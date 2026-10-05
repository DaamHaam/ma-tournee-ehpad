import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { fullName, parseDate, validDate, type Entry, type Sex } from '../../domain/model'
import { hasTestContent, previousTest, TINETTI, tinettiScore, type TestRecord } from '../../domain/tinetti'
import { useBilanCopy } from './useBilanCopy'
import { useAssistant } from './useAssistant'
import { anonymizeWithMap, parseTinettiReply, restoreNames, tinettiRequest } from './assistant'
import { ReviewAnswers, TransmissionScreen } from './SynthesisReview'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { appendText, htmlToText, sanitizeBilanHtml } from './richText'
import { testCopyHtml, testNotesHtml } from './display'
import { useDictation } from './useDictation'
import { DictationFooter, Icon, ScreenHeader } from './screen'
import { backTarget, ICONS, useBlockEdgeSwipe, useVisibleViewport } from './screenUtils'

// Test de Tinetti en plein écran : volet Grille (équilibre puis marche) et volet Dictée, d’un seul glissement ; micro toujours accessible.
export function TinettiPage() {
  const { date = '', id = '' } = useParams()
  const target = backTarget(useLocation().state, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  const previous = useLiveQuery(async () => valid ? { found: previousTest(await db.days.where('date').below(date).toArray(), id, date, 'tinetti') } : undefined, [date, id, valid])
  const sex = useLiveQuery(async () => (await db.patients.get(id))?.sex ?? '', [id])
  if (!valid) return <Navigate replace to="/" />
  if (!day || !previous || sex === undefined) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <TinettiEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} previous={previous.found} sex={sex} />
}

function TinettiEditor({ date, id, back, label, entry, previous, sex }: { date: string; id: string; back: string; label: string; entry: Entry; previous: { date: string; record: TestRecord } | null; sex: Sex }) {
  const { run } = useSave()
  const navigate = useNavigate()
  const name = fullName(entry.patient)
  const [initial] = useState(() => entry.tests?.tinetti)
  const [scores, setScores] = useState<Record<string, number>>(initial?.scores ?? {})
  const [notesHtml, setNotesHtml] = useState(() => initial ? testNotesHtml(initial) : '')
  const [startNotes] = useState(notesHtml)
  // Texte final validé après synthèse ; effacé dès que la cotation ou la dictée change (comme dans la base).
  const [resultHtml, setResultHtml] = useState(initial?.resultHtml ?? '')
  // Dernière synthèse IA, gardée pour la revoir sans nouvel appel.
  const [ai, setAi] = useState({ observations: initial?.aiObservations, checks: initial?.aiChecks ?? [], filled: initial?.aiFilled ?? [], source: initial?.aiSource ?? '' })
  const [request, setRequest] = useState('')
  // Synthèse en deux écrans : réponses du formulaire, puis transmission en plein écran.
  const [synthesis, setSynthesis] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'review' } | { status: 'transmission' } | null>(null)
  const transmission = useRef<RichEditorHandle>(null)
  const onTransmission = useRef(false)
  useEffect(() => { onTransmission.current = synthesis?.status === 'transmission' }, [synthesis])
  const assistant = useAssistant()
  const latestNotes = useRef(notesHtml)
  const changed = useRef(false)
  const editor = useRef<RichEditorHandle>(null)
  const panes = useRef<HTMLDivElement>(null)
  const [pane, setPane] = useState(0)
  const [keyboard, setKeyboard] = useState(false)
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const viewport = useVisibleViewport()
  useBlockEdgeSwipe()
  const { copied, copy } = useBilanCopy(date, id, 'tinetti')
  const score = tinettiScore(scores)
  // Une cotation touchée à la main n’est plus celle de l’IA : ses marques (✨, ⚠) disparaissent pour cette ligne.
  const choose = (row: string, value: number) => {
    const next = { ...scores }
    if (next[row] === value) delete next[row]
    else next[row] = value
    setScores(next); changed.current = true; setResultHtml('')
    const marked = ai.filled.includes(row) || ai.checks.some(check => check.row === row)
    const nextAi = marked ? { ...ai, filled: ai.filled.filter(item => item !== row), checks: ai.checks.filter(check => check.row !== row) } : ai
    if (marked) setAi(nextAi)
    void run(() => repository.setTest(date, id, 'tinetti', marked ? { scores: next, aiFilled: nextAi.filled, aiChecks: nextAi.checks } : { scores: next }))
  }
  const saveNotes = useCallback((html: string, text: string) => {
    latestNotes.current = html; setNotesHtml(html); changed.current = true; setResultHtml('')
    void run(() => repository.setTest(date, id, 'tinetti', { notes: text, notesHtml: html }))
  }, [date, id, run])
  const dictation = useDictation(
    // La dictée va dans l’écran de transmission quand il est ouvert, sinon dans le volet Dictée.
    useCallback((text: string) => (onTransmission.current ? transmission : editor).current?.insertText(text), []),
    useCallback(async (text: string) => { const value = appendText(latestNotes.current, text); latestNotes.current = value; await run(() => repository.setTest(date, id, 'tinetti', { notes: htmlToText(value), notesHtml: value })) }, [date, id, run]),
  )
  // ✕ : quitte en remettant le test tel qu’il était à l’ouverture (absent s’il n’existait pas).
  const cancel = async () => {
    if (changed.current) await run(() => repository.restoreTest(date, id, 'tinetti', initial))
    navigate(back)
  }
  // Une seule passe, sans validation : les lignes vides décrites dans la dictée sont cotées par l’IA (✨),
  // conflits et incertitudes allument un voyant (⚠), les observations rédigées sont gardées pour la copie.
  const synthesize = async () => {
    if (resultHtml && !window.confirm('Remplacer le texte de transmission déjà enregistré ?')) return
    if (keyboard) toggleKeyboard(false)
    setSynthesis({ status: 'loading' })
    try {
      const source = htmlToText(latestNotes.current)
      const { text, found } = anonymizeWithMap(source, [entry.patient.lastName, entry.patient.firstName])
      const sent = tinettiRequest(scores, text, sex)
      const reply = parseTinettiReply(await assistant.ask('tinetti', sent, true), scores)
      const merged = { ...reply.scores, ...scores }
      const next = { observations: sanitizeBilanHtml(restoreNames(reply.observations, found)), checks: reply.checks, filled: Object.keys(reply.scores), source }
      setScores(merged); setAi(next); setResultHtml(''); setRequest(sent); setSynthesis({ status: 'review' }); changed.current = true
      await run(() => repository.setTest(date, id, 'tinetti', { scores: merged, aiObservations: next.observations, aiChecks: next.checks, aiFilled: next.filled, aiSource: source }))
    } catch (cause) { setSynthesis({ status: 'error', message: cause instanceof Error ? cause.message : 'Synthèse impossible.' }) }
  }
  const record = { scores, notes: htmlToText(notesHtml), notesHtml, resultHtml, aiObservations: ai.observations, aiSource: ai.source }
  const notesChanged = ai.observations !== undefined && htmlToText(notesHtml) !== ai.source
  // Transmission validée : enregistrée telle quelle (gardée jusqu’au prochain changement de cotation ou de dictée), puis retour à la journée.
  const validateTransmission = async (html: string) => {
    const value = sanitizeBilanHtml(html)
    setResultHtml(value); changed.current = true
    if (await run(() => repository.setTest(date, id, 'tinetti', { resultHtml: value }))) navigate(`/?date=${date}`)
  }
  const toggleKeyboard = (open: boolean) => { editor.current?.setKeyboard(open); setKeyboard(open) }
  const goTo = (index: number) => { const box = panes.current; if (box) box.scrollTo({ left: index * box.clientWidth, behavior: 'smooth' }) }
  // Quitter le volet Dictée referme le clavier.
  const showPane = (index: number) => { if (index !== pane) { if (index === 0 && keyboard) toggleKeyboard(false); setPane(index) } }
  const tabs = ['Grille', 'Dictée']
  const sections = { equilibre: score.equilibre, marche: score.marche }
  const empty = !hasTestContent({ scores, notes: htmlToText(notesHtml) })
  return <div className={`bilan-page tinetti-page${keyboard ? ' keyboard-open' : ''}`} style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient}
      tools={<span className="total-badge" aria-label={`Total ${score.total} sur ${score.max}`}>Tinetti {score.total}/{score.max}</span>}
      copied={copied} copyDisabled={empty} onCopy={() => void copy(testCopyHtml(record))} onCancel={() => void cancel()} />
    <div className="pane-tabs two" role="tablist" aria-label="Volets du test">
      {tabs.map((tab, index) => <button key={tab} type="button" role="tab" aria-selected={pane === index} onClick={() => goTo(index)}>{tab}</button>)}
    </div>
    <div className="synth-bar">
      <span className={`synth-state${ai.observations !== undefined && !notesChanged ? ' done' : ''}`}>{synthesis?.status === 'loading' ? 'Synthèse en cours…' : ai.observations === undefined ? 'Synthèse IA' : notesChanged ? 'Dictée modifiée depuis la synthèse' : `✓ Synthèse faite${ai.checks.length ? ` · ${ai.checks.length} ⚠` : ''}`}</span>
      {ai.observations !== undefined && <button type="button" onClick={() => setSynthesis({ status: 'review' })}>Voir</button>}
      <button type="button" className="synth-button" disabled={!!assistant.unavailable || empty || synthesis?.status === 'loading'} title={assistant.unavailable || 'Synthèse par l’IA'} onClick={() => void synthesize()}>{synthesis?.status === 'loading' ? '…' : ai.observations !== undefined ? '✨ Relancer' : '✨ Lancer'}</button>
    </div>
    {synthesis?.status === 'error' && <p className="field-error" role="alert">{synthesis.message}</p>}
    {previous && <p className="previous-note">★ cotations du {parseDate(previous.date).toLocaleDateString('fr-FR')} : {tinettiScore(previous.record.scores).total}/28</p>}
    <div className="panes" ref={panes} onScroll={event => { const box = event.currentTarget; showPane(Math.round(box.scrollLeft / Math.max(1, box.clientWidth))) }}>
      <div className="pane" role="tabpanel" aria-label="Grille">{TINETTI.map(section => <section key={section.id} aria-label={section.title}>
        <h2 className="section-title">{section.title} <span>{sections[section.id].score}/{sections[section.id].max}</span></h2>
        <p className="pane-instructions">{section.instructions}</p>
        {section.items.map(item => <div key={item.number} className="test-item">
          <h3>{item.number}. {item.title}</h3>
          {item.rows.map(row => <div key={row.id} className="test-row" role="radiogroup" aria-label={`${item.number}. ${item.title}${row.sub ? ` – ${row.sub}` : ''}`}>
            {row.sub && <p className="row-sub">{row.sub}</p>}
            {row.options.map(option => <button key={option.score} type="button" role="radio" className="test-option" aria-checked={scores[row.id] === option.score} aria-label={`${option.score} – ${option.label}`} onClick={() => choose(row.id, option.score)}>
              <span className="option-score">{option.score}</span><span className="option-label">{option.label}</span>{scores[row.id] === option.score && ai.filled.includes(row.id) && <span className="ai-mark" title="Cotée par l’IA d’après la dictée">✨</span>}{previous?.record.scores[row.id] === option.score && <span className="previous-mark" title="Cotation précédente">★</span>}
            </button>)}
            {ai.checks.filter(check => check.row === row.id).map(check => <p key={check.row} className="row-doubt" role="note">⚠ {check.reason || 'à vérifier'}</p>)}
          </div>)}
        </div>)}
      </section>)}</div>
      <section className="pane notes-pane" role="tabpanel" aria-label="Dictée">
        <FormatButtons editor={editor} state={format} />
        <RichEditor ref={editor} initialHtml={startNotes} label={`Observations Tinetti pour ${name}`} keyboard={keyboard} placeholder="Observations" onChange={saveNotes} onFormatState={setFormat} />
      </section>
    </div>
    {synthesis?.status === 'review' && <ReviewAnswers scores={scores} checks={ai.checks} filled={ai.filled} request={request || undefined} notice={notesChanged ? 'La dictée a changé depuis cette synthèse : relancez-la pour l’intégrer.' : ''} onBack={() => setSynthesis(null)} onNext={() => setSynthesis({ status: 'transmission' })} />}
    {synthesis?.status === 'transmission' && <TransmissionScreen initialHtml={testCopyHtml(record)} name={name} editor={transmission} dictation={dictation} onBack={() => setSynthesis({ status: 'review' })} onValidate={html => void validateTransmission(html)} />}
    {keyboard
      ? <button type="button" className="keyboard-hide" aria-label="Fermer le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(false)}><Icon d={ICONS.hide} /></button>
      : <DictationFooter dictation={dictation}
        left={pane === 1 ? <button type="button" className="round-button" aria-label="Aller à la ligne" title="Aller à la ligne" onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.insertLineBreak()}><Icon d={ICONS.newline} size={24} /></button> : undefined}
        right={pane === 1 ? <button type="button" className="round-button" aria-label="Ouvrir le clavier" title="Ouvrir le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(true)}><Icon d={ICONS.keyboard} /></button> : undefined} />}
  </div>
}
