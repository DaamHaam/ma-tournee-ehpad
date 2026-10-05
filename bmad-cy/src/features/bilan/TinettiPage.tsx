import { useCallback, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { fullName, parseDate, validDate, type Entry, type Sex } from '../../domain/model'
import { hasTestContent, previousTest, TINETTI, tinettiResultHtml, tinettiScore, type TestRecord } from '../../domain/tinetti'
import { useBilanCopy } from './useBilanCopy'
import { useAssistant } from './useAssistant'
import { anonymizeWithMap, parseTinettiReply, restoreNames, tinettiRequest } from './assistant'
import { SynthesisReview } from './SynthesisReview'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { appendText, htmlToText, sanitizeBilanHtml } from './richText'
import { testNotesHtml } from './display'
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
  const [synthesis, setSynthesis] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'review'; checks: { row: string; reason: string }[]; html: string } | null>(null)
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
  const choose = (row: string, value: number) => {
    const next = { ...scores }
    if (next[row] === value) delete next[row]
    else next[row] = value
    setScores(next); changed.current = true; setResultHtml('')
    void run(() => repository.setTest(date, id, 'tinetti', { scores: next }))
  }
  const saveNotes = useCallback((html: string, text: string) => {
    latestNotes.current = html; setNotesHtml(html); changed.current = true; setResultHtml('')
    void run(() => repository.setTest(date, id, 'tinetti', { notes: text, notesHtml: html }))
  }, [date, id, run])
  const dictation = useDictation(
    useCallback((text: string) => editor.current?.insertText(text), []),
    useCallback(async (text: string) => { const value = appendText(latestNotes.current, text); latestNotes.current = value; await run(() => repository.setTest(date, id, 'tinetti', { notes: htmlToText(value), notesHtml: value })) }, [date, id, run]),
  )
  // ✕ : quitte en remettant le test tel qu’il était à l’ouverture (absent s’il n’existait pas).
  const cancel = async () => {
    if (changed.current) await run(() => repository.restoreTest(date, id, 'tinetti', initial))
    navigate(back)
  }
  // Une seule passe : grille cochée + dictée anonymisée → observations rédigées et lignes à vérifier.
  const synthesize = async () => {
    if (keyboard) toggleKeyboard(false)
    setSynthesis({ status: 'loading' })
    try {
      const { text, found } = anonymizeWithMap(htmlToText(latestNotes.current), [entry.patient.lastName, entry.patient.firstName])
      const reply = parseTinettiReply(await assistant.ask('tinetti', tinettiRequest(scores, text, sex), true), scores)
      setSynthesis({ status: 'review', checks: reply.checks, html: tinettiResultHtml({ scores }, sanitizeBilanHtml(restoreNames(reply.observations, found))) })
    } catch (cause) { setSynthesis({ status: 'error', message: cause instanceof Error ? cause.message : 'Synthèse impossible.' }) }
  }
  const validate = (html: string) => {
    const value = sanitizeBilanHtml(html)
    setResultHtml(value); setSynthesis(null); changed.current = true
    void run(() => repository.setTest(date, id, 'tinetti', { resultHtml: value }))
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
      copied={copied} copyDisabled={empty} onCopy={() => void copy(resultHtml || tinettiResultHtml({ scores }, notesHtml))} onCancel={() => void cancel()} />
    <div className="pane-tabs two with-action" role="tablist" aria-label="Volets du test">
      {tabs.map((tab, index) => <button key={tab} type="button" role="tab" aria-selected={pane === index} onClick={() => goTo(index)}>{tab}</button>)}
      <button type="button" className="synth-button" disabled={!!assistant.unavailable || empty || synthesis?.status === 'loading'} title={assistant.unavailable || 'Synthèse par l’IA'} onClick={() => void synthesize()}>{synthesis?.status === 'loading' ? 'Synthèse…' : '✨ Synthèse'}</button>
    </div>
    {synthesis?.status === 'error' && <p className="field-error" role="alert">{synthesis.message}</p>}
    {resultHtml && !synthesis && <p className="synth-done">✓ Synthèse validée, prête à copier</p>}
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
              <span className="option-score">{option.score}</span><span className="option-label">{option.label}</span>{previous?.record.scores[row.id] === option.score && <span className="previous-mark" title="Cotation précédente">★</span>}
            </button>)}
          </div>)}
        </div>)}
      </section>)}</div>
      <section className="pane notes-pane" role="tabpanel" aria-label="Dictée">
        <FormatButtons editor={editor} state={format} />
        <RichEditor ref={editor} initialHtml={startNotes} label={`Observations Tinetti pour ${name}`} keyboard={keyboard} placeholder="Observations" onChange={saveNotes} onFormatState={setFormat} />
      </section>
    </div>
    {synthesis?.status === 'review' && <SynthesisReview scores={scores} checks={synthesis.checks} initialHtml={synthesis.html} name={name} onValidate={validate} onCancel={() => setSynthesis(null)} />}
    {keyboard
      ? <button type="button" className="keyboard-hide" aria-label="Fermer le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(false)}><Icon d={ICONS.hide} /></button>
      : <DictationFooter dictation={dictation}
        left={pane === 1 ? <button type="button" className="round-button" aria-label="Aller à la ligne" title="Aller à la ligne" onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.insertLineBreak()}><Icon d={ICONS.newline} size={24} /></button> : undefined}
        right={pane === 1 ? <button type="button" className="round-button" aria-label="Ouvrir le clavier" title="Ouvrir le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(true)}><Icon d={ICONS.keyboard} /></button> : undefined} />}
  </div>
}
