import { useCallback, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { fullName, parseDate, validDate, type Entry, type Sex } from '../../domain/model'
import { fillEmptyRows, hasTestContent, previousTest, TINETTI, tinettiResultHtml, tinettiScore, type TestRecord } from '../../domain/tinetti'
import { useBilanCopy } from './useBilanCopy'
import { useAssistant } from './useAssistant'
import { anonymizeWithMap, parseTinettiReply, restoreNames, tinettiRequest } from './assistant'
import type { RichEditorHandle } from './RichEditor'
import { appendText, htmlToText, sanitizeBilanHtml } from './richText'
import { markLine, testCopyHtml, testNotesHtml } from './display'
import { useDictation } from './useDictation'
import { ScreenHeader } from './screen'
import { backTarget, useBlockEdgeSwipe, useVisibleViewport } from './screenUtils'
import { NotesPane, PaneTabs, ResultPane, TestPage } from './TestScreen'
import { useTestPanes } from './useTestPanes'


// Test de Tinetti en plein écran : volets Grille, Dictée et Résultat, d’un seul glissement ; micro toujours accessible.
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
  // Résultat retouché ; effacé (et régénéré) dès que la cotation ou la dictée change, comme dans la base.
  const [resultHtml, setResultHtml] = useState(initial?.resultHtml ?? '')
  const [version, setVersion] = useState(0)
  // Dernière intégration IA, gardée pour la revoir sans nouvel appel.
  const [ai, setAi] = useState({ observations: initial?.aiObservations, checks: initial?.aiChecks ?? [], filled: initial?.aiFilled ?? [], source: initial?.aiSource })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const assistant = useAssistant()
  const latestNotes = useRef(notesHtml)
  const changed = useRef(false)
  const editor = useRef<RichEditorHandle>(null)
  const result = useRef<RichEditorHandle>(null)
  const screen = useTestPanes(editor, result)
  const viewport = useVisibleViewport()
  useBlockEdgeSwipe()
  const { copied, copy } = useBilanCopy(date, id, 'tinetti')
  const score = tinettiScore(scores)
  const regenerate = () => { changed.current = true; setResultHtml(''); setVersion(current => current + 1) }
  // Une cotation touchée à la main n’est plus celle de l’IA : ses marques (✨, ⚠) disparaissent pour cette ligne.
  // Grille verrouillée pendant l’intégration : la réponse de l’IA est fusionnée avec la grille envoyée.
  const choose = (row: string, value: number) => {
    if (busy) return
    const next = { ...scores }
    if (next[row] === value) delete next[row]
    else next[row] = value
    setScores(next); regenerate()
    const marked = ai.filled.includes(row) || ai.checks.some(check => check.row === row)
    const nextAi = marked ? { ...ai, filled: ai.filled.filter(item => item !== row), checks: ai.checks.filter(check => check.row !== row) } : ai
    if (marked) setAi(nextAi)
    void run(() => repository.setTest(date, id, 'tinetti', marked ? { scores: next, aiFilled: nextAi.filled, aiChecks: nextAi.checks } : { scores: next }))
  }
  // Min / Max : remplit d’un coup les lignes vides, à corriger ensuite ligne par ligne.
  const fillEmpty = (level: 'max' | 'min') => {
    if (busy) return
    const next = fillEmptyRows(scores, level)
    if (Object.keys(next).length === Object.keys(scores).length) return
    setScores(next); regenerate()
    void run(() => repository.setTest(date, id, 'tinetti', { scores: next }))
  }
  const saveNotes = useCallback((html: string, text: string) => {
    latestNotes.current = html; setNotesHtml(html); changed.current = true; setResultHtml(''); setVersion(current => current + 1)
    void run(() => repository.setTest(date, id, 'tinetti', { notes: text, notesHtml: html }))
  }, [date, id, run])
  const dictation = useDictation(
    screen.insertDictation,
    useCallback(async (text: string) => { const value = appendText(latestNotes.current, text); latestNotes.current = value; await run(() => repository.setTest(date, id, 'tinetti', { notes: htmlToText(value), notesHtml: value })) }, [date, id, run]),
  )
  // ✕ : quitte en remettant le test tel qu’il était à l’ouverture (absent s’il n’existait pas).
  const cancel = async () => {
    if (changed.current) await run(() => repository.restoreTest(date, id, 'tinetti', initial))
    navigate(back)
  }
  // Une seule passe, sans validation : les lignes vides décrites dans la dictée sont cotées par l’IA (✨),
  // conflits et incertitudes allument un voyant (⚠), les observations rédigées entrent dans le résultat.
  // Relancer reprend la grille sans les cotations de l’IA restées intactes.
  const integrate = async () => {
    if (resultHtml && !window.confirm('Remplacer le texte retouché du résultat ?')) return
    setBusy(true); setError('')
    try {
      const source = htmlToText(latestNotes.current)
      const base = Object.fromEntries(Object.entries(scores).filter(([row]) => !ai.filled.includes(row)))
      const { text, found } = anonymizeWithMap(source, [entry.patient.lastName, entry.patient.firstName])
      const sent = tinettiRequest(base, text, sex)
      const answer = await assistant.ask('tinetti', sent, true)
      const reply = parseTinettiReply(answer.content, base)
      const merged = { ...reply.scores, ...base }
      const next = { observations: sanitizeBilanHtml(restoreNames(reply.observations, found)), checks: reply.checks, filled: Object.keys(reply.scores), source }
      setScores(merged); setAi(next); regenerate()
      await run(() => repository.setTest(date, id, 'tinetti', { scores: merged, aiObservations: next.observations, aiChecks: next.checks, aiFilled: next.filled, aiSource: source }))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Intégration impossible.') }
    finally { setBusy(false) }
  }
  const record = { scores, notes: htmlToText(notesHtml), notesHtml, resultHtml, aiObservations: ai.observations, aiSource: ai.source }
  const generated = testCopyHtml({ ...record, resultHtml: '' })
  const shown = resultHtml || generated
  // À l’écran seulement : ✨ en marge du score si l’IA a coté des lignes (⚠ s’il y a des doutes) et des observations qu’elle a rédigées.
  const fresh = ai.observations !== undefined && ai.source === record.notes
  const [scoreLine, ...details] = tinettiResultHtml({ scores }).split('<br>')
  const marked = resultHtml || [markLine(scoreLine, ai.filled.length > 0, ai.checks.length > 0), ...details, ...(fresh && ai.observations ? [markLine(sanitizeBilanHtml(ai.observations), true)] : fresh ? [] : [testNotesHtml(record)].filter(html => htmlToText(html).trim()))].join('<br>')
  const editResult = (html: string) => {
    const value = html === sanitizeBilanHtml(generated) ? '' : html
    setResultHtml(value); changed.current = true
    void run(() => repository.setTest(date, id, 'tinetti', { resultHtml: value }))
  }
  const notesText = htmlToText(notesHtml)
  const empty = !hasTestContent({ scores, notes: notesText })
  // ↶ : retire les cotations de l’IA restées intactes, ses voyants et ses observations ; les cotations à la main restent.
  const undoIntegration = () => {
    if (resultHtml && !window.confirm('Annuler l’intégration efface le texte retouché du résultat. Continuer ?')) return
    const base = Object.fromEntries(Object.entries(scores).filter(([row]) => !ai.filled.includes(row)))
    setScores(base); setAi({ observations: undefined, checks: [], filled: [], source: undefined }); setError(''); regenerate()
    void run(() => repository.setTest(date, id, 'tinetti', { scores: base, aiObservations: undefined, aiChecks: [], aiFilled: [], aiSource: undefined }))
  }
  const integration = {
    state: busy ? 'loading' as const : ai.source === undefined ? 'none' as const : ai.source !== notesText ? 'stale' as const : 'done' as const,
    checks: ai.checks.length, error, unavailable: assistant.unavailable, canRun: !!notesText.trim(),
    run: () => void integrate(), undo: undoIntegration, showChecks: screen.showFirstDoubt,
  }
  const sections = { equilibre: score.equilibre, marche: score.marche }
  return <TestPage keyboard={screen.keyboard} viewport={viewport}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient}
      tools={<span className="total-badge" aria-label={`Total ${score.total} sur ${score.max}`}>Tinetti {score.total}/{score.max}</span>}
      copied={copied} copyDisabled={empty} onCopy={() => void copy(shown)} onCancel={() => void cancel()} />
    <PaneTabs tabs={['Grille', 'Dictée', 'Résultat']} pane={screen.pane} goTo={screen.goTo} />
    <div className="panes" ref={screen.panes} onScroll={screen.onScroll}>
      <div className="pane" role="tabpanel" aria-label="Grille">{previous && <p className="previous-note">★ cotations du {parseDate(previous.date).toLocaleDateString('fr-FR')} : {tinettiScore(previous.record.scores).total}/28</p>}<div className="fill-buttons" role="group" aria-label="Remplir les lignes vides">{(['min', 'max'] as const).map(level => <button key={level} type="button" aria-label={`Lignes vides au ${level === 'max' ? 'maximum' : 'minimum'}`} title={`Lignes vides au ${level === 'max' ? 'maximum' : 'minimum'}`} disabled={busy || score.complete} onClick={() => fillEmpty(level)}>{level === 'max' ? 'Max' : 'Min'}</button>)}</div>{TINETTI.map(section => <section key={section.id} aria-label={section.title}>
        <h2 className="section-title">{section.title} <span>{sections[section.id].score}/{sections[section.id].max}</span></h2>
        <p className="pane-instructions">{section.instructions}</p>
        {section.items.map(item => <div key={item.number} className="test-item">
          <h3>{item.number}. {item.title}</h3>
          {item.rows.map(row => <div key={row.id} className="test-row" role="radiogroup" aria-label={`${item.number}. ${item.title}${row.sub ? ` – ${row.sub}` : ''}`}>
            {row.sub && <p className="row-sub">{row.sub}</p>}
            {row.options.map(option => <button key={option.score} type="button" role="radio" className="test-option" aria-checked={scores[row.id] === option.score} aria-label={`${option.score} – ${option.label}`} disabled={busy} onClick={() => choose(row.id, option.score)}>
              <span className="option-score">{option.score}</span><span className="option-label">{option.label}</span>{scores[row.id] === option.score && ai.filled.includes(row.id) && <span className="ai-mark" title="Cotée par l’IA d’après la dictée">✨</span>}{previous?.record.scores[row.id] === option.score && <span className="previous-mark" title="Cotation précédente">★</span>}
            </button>)}
            {ai.checks.filter(check => check.row === row.id).map(check => <p key={check.row} className="row-doubt" role="note">⚠ {check.reason || 'à vérifier'}</p>)}
          </div>)}
        </div>)}
      </section>)}</div>
      <NotesPane editor={editor} initialHtml={startNotes} label={`Observations Tinetti pour ${name}`} keyboard={screen.keyboard && screen.pane === 1} tools={screen.pane === 1 ? screen.keyboardTools(dictation) : undefined} onChange={saveNotes} />
      <ResultPane editor={result} version={version} initialHtml={marked} label={`Résultat Tinetti pour ${name}`} keyboard={screen.keyboard && screen.pane === 2} tools={screen.pane === 2 ? screen.keyboardTools(dictation) : undefined} ai={integration} onChange={editResult} onValidate={() => navigate(back)} />
    </div>
    {screen.footer(dictation)}
  </TestPage>
}
