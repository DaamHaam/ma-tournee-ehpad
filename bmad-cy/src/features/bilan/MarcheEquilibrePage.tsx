import { useCallback, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { fullName, parseDate, validDate, type Entry, type Sex } from '../../domain/model'
import type { AiCheck, TestRecord } from '../../domain/tinetti'
import { choiceId, hasFlexContent, MARCHE_EQUILIBRE, marcheEquilibreHtml, marcheEquilibreLines, previousMarcheEquilibre, rubricFilled, rubricOfKey, type FlexControl, type FlexRubric, type PreviousFlex } from '../../domain/marcheEquilibre'
import { useBilanCopy } from './useBilanCopy'
import { useAssistant } from './useAssistant'
import { anonymizeWithMap, marcheRequest, parseMarcheReply } from './assistant'
import type { RichEditorHandle } from './RichEditor'
import { appendText, htmlToText, sanitizeBilanHtml } from './richText'
import { markLines, testNotesHtml } from './display'
import { useDictation } from './useDictation'
import type { Reasoning } from './openrouter'
import { ScreenHeader } from './screen'
import { backTarget, useBlockEdgeSwipe, useVisibleViewport } from './screenUtils'
import { NotesPane, PaneTabs, ResultPane, TestPage } from './TestScreen'
import { useTestPanes } from './useTestPanes'

const KIND = 'marcheEquilibre'
const shortDate = (date: string) => parseDate(date).toLocaleDateString('fr-FR')
// Champ texte affiché sans la mise en forme (reprise de la dictée par l’IA), qui reste dans le compte rendu tant qu’on ne le retouche pas.
const plain = (value: string | undefined) => (value ?? '').replace(/<\/?(?:b|i|u)>|<br\s*\/?>/g, '')
const without = (values: Record<string, string>, keys: string[]) => Object.fromEntries(Object.entries(values).filter(([key]) => !keys.includes(key)))

// Bilan marche / équilibre en plein écran : volets Formulaire (sous-modules à la suite, onglets pour y sauter), Dictée et Résultat
// (compte rendu tiré du formulaire, retouchable ; l’IA intègre la dictée au formulaire, qui régénère le résultat).
export function MarcheEquilibrePage() {
  const { date = '', id = '' } = useParams()
  const target = backTarget(useLocation().state, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  const previous = useLiveQuery(async () => valid ? previousMarcheEquilibre(await db.days.where('date').below(date).toArray(), id, date) : undefined, [date, id, valid])
  const sex = useLiveQuery(async () => (await db.patients.get(id))?.sex ?? '', [id])
  if (!valid) return <Navigate replace to="/" />
  if (!day || !previous || sex === undefined) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <MarcheEquilibreEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} previous={previous} sex={sex} />
}

function MarcheEquilibreEditor({ date, id, back, label, entry, previous, sex }: { date: string; id: string; back: string; label: string; entry: Entry; previous: PreviousFlex; sex: Sex }) {
  const { run } = useSave()
  const navigate = useNavigate()
  const name = fullName(entry.patient)
  const [initial] = useState<TestRecord | undefined>(() => entry.tests?.[KIND])
  const [choices, setChoices] = useState<string[]>(initial?.choices ?? [])
  const [values, setValues] = useState<Record<string, string>>(initial?.values ?? {})
  const [notesHtml, setNotesHtml] = useState(() => initial ? testNotesHtml(initial) : '')
  const [startNotes] = useState(notesHtml)
  const [resultHtml, setResultHtml] = useState(initial?.resultHtml ?? '')
  // Change à chaque modification du formulaire : l’éditeur du résultat repart du compte rendu régénéré.
  const [version, setVersion] = useState(0)
  // filled : choix et champs remplis par l’IA (✨) ; checks : voyants ⚠ par rubrique ; source : dictée intégrée.
  const [ai, setAi] = useState<{ filled: string[]; checks: AiCheck[]; source?: string }>({ filled: initial?.aiFilled ?? [], checks: initial?.aiChecks ?? [], source: initial?.aiSource })
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState<number | null>(null)
  const [error, setError] = useState('')
  const assistant = useAssistant()
  const changed = useRef(false)
  const latestNotes = useRef(notesHtml)
  const editor = useRef<RichEditorHandle>(null)
  const result = useRef<RichEditorHandle>(null)
  const screen = useTestPanes(editor, result)
  const viewport = useVisibleViewport()
  useBlockEdgeSwipe()
  const { copied, copy } = useBilanCopy(date, id, KIND)
  const input = { choices, values }
  const generated = marcheEquilibreHtml(input)
  const shown = resultHtml || generated
  // À l’écran seulement : ✨ en marge des lignes que l’IA a complétées, ⚠ de celles à vérifier (rien de cela n’est copié).
  const aiRubrics = new Set(ai.filled.map(key => rubricOfKey(key)?.id))
  const doubtRubrics = new Set(ai.checks.map(check => check.row))
  const marked = resultHtml || markLines(marcheEquilibreLines(input), aiRubrics, doubtRubrics)
  // Une saisie à la main dans une rubrique efface les marques de l’IA sur ce champ et les voyants de la rubrique.
  const touch = (key: string) => {
    const rubric = rubricOfKey(key)?.id
    if (!ai.filled.includes(key) && !ai.checks.some(check => check.row === rubric)) return {}
    const next = { ...ai, filled: ai.filled.filter(item => item !== key), checks: ai.checks.filter(check => check.row !== rubric) }
    setAi(next)
    return { aiFilled: next.filled, aiChecks: next.checks }
  }
  const save = (patch: Partial<Pick<TestRecord, 'choices' | 'values' | 'aiFilled' | 'aiChecks' | 'aiSource'>>) => {
    changed.current = true; setResultHtml(''); setVersion(current => current + 1)
    void run(() => repository.setTest(date, id, KIND, patch))
  }
  const toggle = (choice: string) => {
    if (busy) return
    const next = choices.includes(choice) ? choices.filter(item => item !== choice) : [...choices, choice]
    setChoices(next); save({ choices: next, ...touch(choice) })
  }
  const setValue = (key: string, value: string) => {
    if (busy) return
    const next = value.trim() ? { ...values, [key]: value } : without(values, [key])
    setValues(next); save({ values: next, ...touch(key) })
  }
  const saveNotes = useCallback((html: string, text: string) => {
    latestNotes.current = html; setNotesHtml(html); changed.current = true
    void run(() => repository.setTest(date, id, KIND, { notes: text, notesHtml: html }))
  }, [date, id, run])
  const dictation = useDictation(
    screen.insertDictation,
    useCallback(async (text: string) => { const value = appendText(latestNotes.current, text); latestNotes.current = value; await run(() => repository.setTest(date, id, KIND, { notes: htmlToText(value), notesHtml: value })) }, [date, id, run]),
  )
  // Retouche du résultat : gardée tant que le formulaire ne change pas ; revenue au texte généré, elle s’efface.
  const editResult = (html: string) => {
    const value = html === sanitizeBilanHtml(generated) ? '' : html
    setResultHtml(value); changed.current = true
    void run(() => repository.setTest(date, id, KIND, { resultHtml: value }))
  }
  // ✕ : quitte en remettant le bilan tel qu’il était à l’ouverture (absent s’il n’existait pas).
  const cancel = async () => {
    if (changed.current) await run(() => repository.restoreTest(date, id, KIND, initial))
    navigate(back)
  }
  // Intégration de la dictée, en une passe : l’IA coche et remplit seulement ce qui est libre (✨) et allume ⚠ en cas de doute.
  // Relancer repart du formulaire sans les ajouts de l’IA restés intacts.
  const integrate = async () => {
    if (resultHtml && !window.confirm('Remplacer le texte retouché du résultat ?')) return
    setBusy(true); setError('')
    try {
      const source = htmlToText(latestNotes.current)
      const base = { choices: choices.filter(choice => !ai.filled.includes(choice)), values: without(values, ai.filled) }
      const { text, found } = anonymizeWithMap(sanitizeBilanHtml(latestNotes.current), [entry.patient.lastName, entry.patient.firstName])
      const sent = marcheRequest(base, text, sex)
      setSeconds(null)
      const answer = await assistant.ask(KIND, sent, true)
      setSeconds(answer.seconds)
      const reply = parseMarcheReply(answer.content, base, sex, found)
      const merged = { choices: [...base.choices, ...reply.choices], values: { ...reply.values, ...base.values } }
      const next = { filled: [...reply.choices, ...Object.keys(reply.values)], checks: reply.checks, source }
      setChoices(merged.choices); setValues(merged.values); setAi(next)
      save({ ...merged, aiFilled: next.filled, aiChecks: next.checks, aiSource: source })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Intégration impossible.') }
    finally { setBusy(false) }
  }
  const notesText = htmlToText(notesHtml)
  // ↶ : retire les ajouts de l’IA restés intacts (choix et champs) et ses voyants ; la saisie à la main reste.
  const undoIntegration = () => {
    if (resultHtml && !window.confirm('Annuler l’intégration efface le texte retouché du résultat. Continuer ?')) return
    const base = { choices: choices.filter(choice => !ai.filled.includes(choice)), values: without(values, ai.filled) }
    setChoices(base.choices); setValues(base.values); setAi({ filled: [], checks: [], source: undefined }); setError('')
    save({ ...base, aiFilled: [], aiChecks: [], aiSource: undefined })
  }
  const integration = {
    state: busy ? 'loading' as const : ai.source === undefined ? 'none' as const : ai.source !== notesText ? 'stale' as const : 'done' as const,
    checks: ai.checks.length, error, unavailable: assistant.unavailable, canRun: !!notesText.trim(),
    run: () => void integrate(), undo: undoIntegration, showChecks: screen.showFirstDoubt,
    reasoning: assistant.reasoning, setReasoning: (level: Reasoning) => void run(() => assistant.setReasoning(level)), seconds,
  }
  return <TestPage keyboard={screen.keyboard} viewport={viewport}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient} tools={<span className="total-badge">Marche / équilibre</span>}
      copied={copied} copyDisabled={!hasFlexContent(input)} onCopy={() => void copy(shown)} onCancel={() => void cancel()} />
    <PaneTabs tabs={['Formulaire', 'Dictée', 'Résultat']} pane={screen.pane} goTo={screen.goTo} />
    <div className="panes" ref={screen.panes} onScroll={screen.onScroll}>
      <FlexForm input={input} ai={ai} busy={busy} previous={previous} onToggle={toggle} onValue={setValue} />
      <NotesPane editor={editor} initialHtml={startNotes} label={`Dictée marche / équilibre pour ${name}`} keyboard={screen.keyboard && screen.pane === 1} tools={screen.pane === 1 ? screen.keyboardTools(dictation) : undefined} onChange={saveNotes} />
      <ResultPane editor={result} version={version} initialHtml={marked} label={`Compte rendu marche / équilibre pour ${name}`} keyboard={screen.keyboard && screen.pane === 2} tools={screen.pane === 2 ? screen.keyboardTools(dictation) : undefined} ai={integration} onChange={editResult} onValidate={() => navigate(back)} />
    </div>
    {screen.footer(dictation)}
  </TestPage>
}

// Formulaire d’un seul tenant : les sous-modules se suivent au défilement ; les onglets (deux rangées) y sautent et suivent la lecture.
function FlexForm({ input, ai, busy, previous, onToggle, onValue }: {
  input: { choices: string[]; values: Record<string, string> }; ai: { filled: string[]; checks: AiCheck[] }; busy: boolean; previous: PreviousFlex
  onToggle: (choice: string) => void; onValue: (key: string, value: string) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const tabs = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(MARCHE_EQUILIBRE[0].id)
  const offset = () => (tabs.current?.offsetHeight ?? 0) + 6
  const jump = (module: string) => {
    const pane = box.current, section = pane?.querySelector<HTMLElement>(`#module-${module}`)
    if (pane && section) pane.scrollTo({ top: section.offsetTop - offset(), behavior: 'smooth' })
  }
  const follow = () => {
    const pane = box.current
    if (!pane) return
    const top = pane.scrollTop + offset() + 8
    const atEnd = pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 4
    let current = MARCHE_EQUILIBRE[0].id
    for (const module of MARCHE_EQUILIBRE) { const section = pane.querySelector<HTMLElement>(`#module-${module.id}`); if (section && section.offsetTop <= top) current = module.id }
    if (atEnd) current = MARCHE_EQUILIBRE.at(-1)!.id
    if (current !== active) setActive(current)
  }
  const last = previous.last?.record
  return <div className="pane flex-form" role="tabpanel" aria-label="Formulaire" ref={box} onScroll={follow}>
    {previous.last && <p className="previous-note">★ bilan précédent du {shortDate(previous.last.date)}</p>}
    <div className="module-tabs" role="tablist" aria-label="Sous-modules" ref={tabs}>
      {MARCHE_EQUILIBRE.map(module => {
        const filled = module.rubrics.filter(rubric => rubricFilled(rubric, input)).length
        return <button key={module.id} data-module={module.id} type="button" role="tab" aria-selected={module.id === active} onClick={() => { setActive(module.id); jump(module.id) }}>{module.title}{filled > 0 && <span className="module-count" aria-label={`${filled} rubriques renseignées`}>{filled}</span>}</button>
      })}
    </div>
    {MARCHE_EQUILIBRE.map(module => <section key={module.id} id={`module-${module.id}`} className="flex-module" aria-label={`Sous-module ${module.title}`}>
      <h2 className="module-title">{module.title}</h2>
      {module.rubrics.map(rubric => <Rubric key={rubric.id} rubric={rubric} filled={rubricFilled(rubric, input)} input={input} ai={ai} busy={busy} last={last} measure={previous.measures[rubric.id]} onToggle={onToggle} onValue={onValue} />)}
    </section>)}
  </div>
}

// Rubrique (sous-sous-module) : titre, dernière mesure ★ pour un test standardisé, voyants ⚠, puis ses champs.
function Rubric({ rubric, filled, input, ai, busy, last, measure, onToggle, onValue }: {
  rubric: FlexRubric; filled: boolean; input: { choices: string[]; values: Record<string, string> }; ai: { filled: string[]; checks: AiCheck[] }; busy: boolean
  last?: TestRecord; measure?: { date: string; text: string }; onToggle: (choice: string) => void; onValue: (key: string, value: string) => void
}) {
  return <section className={`flex-rubric${filled ? ' filled' : ''}`} aria-label={rubric.title}>
    <h3>{rubric.title}</h3>
    {measure && <p className="previous-measure"><span className="previous-mark" aria-hidden="true">★</span> {measure.text} · {shortDate(measure.date)}</p>}
    {ai.checks.filter(check => check.row === rubric.id).map((check, index) => <p key={index} className="row-doubt" role="note">⚠ {check.reason || 'à vérifier'}</p>)}
    {rubric.controls.map(control => <Control key={control.key} control={control} title={rubric.title} input={input} ai={ai.filled} busy={busy} last={last} onToggle={onToggle} onValue={onValue} />)}
  </section>
}

function Control({ control, title, input, ai, busy, last, onToggle, onValue }: {
  control: FlexControl; title: string; input: { choices: string[]; values: Record<string, string> }; ai: string[]; busy: boolean; last?: TestRecord
  onToggle: (choice: string) => void; onValue: (key: string, value: string) => void
}) {
  const { choices, values } = input
  const name = control.label ? `${title} – ${control.label}` : title
  const star = <span className="previous-mark" title="Choix du bilan précédent">★</span>
  const sparkle = <span className="ai-mark" title="Ajouté par l’IA d’après la dictée">✨</span>
  const fieldLabel = (control.kind === 'number' || control.kind === 'text') && (control.label || ai.includes(control.key)) ? <span>{control.label}{ai.includes(control.key) && <> {sparkle}</>}</span> : null
  switch (control.kind) {
    case 'multi': return <div className="flex-options" role="group" aria-label={name}>
      {control.label && <p className="row-sub">{control.label}</p>}
      {control.options.map((option, index) => {
        const choice = choiceId(control.key, index)
        return <button key={choice} type="button" role="checkbox" className="test-option" aria-checked={choices.includes(choice)} disabled={busy} onClick={() => onToggle(choice)}><span className="option-label">{option}</span>{choices.includes(choice) && ai.includes(choice) && sparkle}{last?.choices?.includes(choice) && star}</button>
      })}
    </div>
    case 'single': return <div className={`flex-options${control.compact ? ' compact' : ''}`} role="radiogroup" aria-label={name}>
      {control.label && <p className="row-sub">{control.label}</p>}
      {control.options.map(option => <button key={option} type="button" role="radio" className="test-option" aria-checked={values[control.key] === option} disabled={busy} onClick={() => onValue(control.key, values[control.key] === option ? '' : option)}><span className="option-label">{option}</span>{values[control.key] === option && ai.includes(control.key) && sparkle}{last?.values?.[control.key] === option && star}</button>)}
    </div>
    case 'number': return <label className="flex-field">{fieldLabel}<span className="flex-number"><input type="text" inputMode="decimal" aria-label={name} value={values[control.key] ?? ''} disabled={busy} onChange={event => onValue(control.key, event.target.value)} /><span>{control.unit}</span></span></label>
    case 'text':
      if (control.ai && !values[control.key]) return null
      return <label className="flex-field">{fieldLabel}{control.long
        ? <textarea rows={3} aria-label={name} value={plain(values[control.key])} disabled={busy} onChange={event => onValue(control.key, event.target.value)} />
        : <input type="text" aria-label={name} value={plain(values[control.key])} disabled={busy} onChange={event => onValue(control.key, event.target.value)} />}</label>
  }
}
