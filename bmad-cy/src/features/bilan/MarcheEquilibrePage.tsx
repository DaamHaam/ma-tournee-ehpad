import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { fullName, parseDate, validDate, type Entry } from '../../domain/model'
import type { TestRecord } from '../../domain/tinetti'
import { choiceId, hasFlexContent, MARCHE_EQUILIBRE, marcheEquilibreHtml, previousMarcheEquilibre, rubricFilled, type FlexControl, type FlexRubric, type PreviousFlex } from '../../domain/marcheEquilibre'
import { useBilanCopy } from './useBilanCopy'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { sanitizeBilanHtml } from './richText'
import { ScreenHeader } from './screen'
import { backTarget, useBlockEdgeSwipe, useVisibleViewport } from './screenUtils'

const KIND = 'marcheEquilibre'
const shortDate = (date: string) => parseDate(date).toLocaleDateString('fr-FR')

// Bilan marche / équilibre en plein écran : volet Formulaire (sous-modules en onglets, rubriques à cocher) et volet Résultat
// (compte rendu généré, retouchable avant copie ; toute modification du formulaire le régénère).
export function MarcheEquilibrePage() {
  const { date = '', id = '' } = useParams()
  const target = backTarget(useLocation().state, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  const previous = useLiveQuery(async () => valid ? previousMarcheEquilibre(await db.days.where('date').below(date).toArray(), id, date) : undefined, [date, id, valid])
  if (!valid) return <Navigate replace to="/" />
  if (!day || !previous) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <MarcheEquilibreEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} previous={previous} />
}

function MarcheEquilibreEditor({ date, id, back, label, entry, previous }: { date: string; id: string; back: string; label: string; entry: Entry; previous: PreviousFlex }) {
  const { run } = useSave()
  const navigate = useNavigate()
  const [initial] = useState<TestRecord | undefined>(() => entry.tests?.[KIND])
  const [choices, setChoices] = useState<string[]>(initial?.choices ?? [])
  const [values, setValues] = useState<Record<string, string>>(initial?.values ?? {})
  const [resultHtml, setResultHtml] = useState(initial?.resultHtml ?? '')
  // Change à chaque modification du formulaire : l’éditeur du résultat repart du compte rendu régénéré.
  const [version, setVersion] = useState(0)
  const changed = useRef(false)
  const [module, setModule] = useState(MARCHE_EQUILIBRE[0].id)
  const [pane, setPane] = useState(0)
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const panes = useRef<HTMLDivElement>(null)
  const form = useRef<HTMLDivElement>(null)
  const editor = useRef<RichEditorHandle>(null)
  const viewport = useVisibleViewport()
  useBlockEdgeSwipe()
  const { copied, copy } = useBilanCopy(date, id, KIND)
  const input = { choices, values }
  const generated = marcheEquilibreHtml(input)
  const shown = resultHtml || generated
  const save = (next: { choices?: string[]; values?: Record<string, string> }) => {
    changed.current = true; setResultHtml(''); setVersion(current => current + 1)
    void run(() => repository.setTest(date, id, KIND, next))
  }
  const toggle = (choice: string) => {
    const next = choices.includes(choice) ? choices.filter(item => item !== choice) : [...choices, choice]
    setChoices(next); save({ choices: next })
  }
  const setValue = (key: string, value: string) => {
    const next = { ...values }
    if (value.trim()) next[key] = value
    else delete next[key]
    setValues(next); save({ values: next })
  }
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
  const goTo = (index: number) => { const box = panes.current; if (box) box.scrollTo({ left: index * box.clientWidth, behavior: 'smooth' }) }
  const openModule = (next: string) => { setModule(next); form.current?.scrollTo({ top: 0 }) }
  const current = MARCHE_EQUILIBRE.find(item => item.id === module) ?? MARCHE_EQUILIBRE[0]
  const last = previous.last?.record
  return <div className="bilan-page tinetti-page flex-page" style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient} tools={<span className="total-badge">Marche / équilibre</span>}
      copied={copied} copyDisabled={!hasFlexContent(input)} onCopy={() => void copy(shown)} onCancel={() => void cancel()} />
    <div className="pane-tabs two" role="tablist" aria-label="Volets du bilan">
      {['Formulaire', 'Résultat'].map((tab, index) => <button key={tab} type="button" role="tab" aria-selected={pane === index} onClick={() => goTo(index)}>{tab}</button>)}
    </div>
    {previous.last && <p className="previous-note">★ bilan précédent du {shortDate(previous.last.date)}</p>}
    <div className="panes" ref={panes} onScroll={event => { const box = event.currentTarget; setPane(Math.round(box.scrollLeft / Math.max(1, box.clientWidth))) }}>
      <div className="pane" role="tabpanel" aria-label="Formulaire" ref={form}>
        <div className="module-tabs" role="tablist" aria-label="Sous-modules">
          {MARCHE_EQUILIBRE.map(item => {
            const filled = item.rubrics.filter(rubric => rubricFilled(rubric, input)).length
            return <button key={item.id} type="button" role="tab" aria-selected={item.id === module} onClick={() => openModule(item.id)}>{item.title}{filled > 0 && <span className="module-count" aria-label={`${filled} rubriques renseignées`}>{filled}</span>}</button>
          })}
        </div>
        {current.rubrics.map(rubric => <Rubric key={rubric.id} rubric={rubric} filled={rubricFilled(rubric, input)} choices={choices} values={values} last={last} measure={previous.measures[rubric.id]} onToggle={toggle} onValue={setValue} />)}
      </div>
      <section className="pane notes-pane" role="tabpanel" aria-label="Résultat">
        <FormatButtons editor={editor} state={format} />
        <RichEditor key={version} ref={editor} initialHtml={shown} label={`Compte rendu marche / équilibre pour ${fullName(entry.patient)}`} keyboard placeholder="Compte rendu" onChange={editResult} onFormatState={setFormat} />
        {resultHtml && <p className="save-hint">Texte retouché : il sera régénéré si le formulaire change.</p>}
      </section>
    </div>
  </div>
}

// Rubrique (sous-sous-module) : titre, dernière mesure ★ pour un test standardisé, puis ses champs.
function Rubric({ rubric, filled, choices, values, last, measure, onToggle, onValue }: {
  rubric: FlexRubric; filled: boolean; choices: string[]; values: Record<string, string>; last?: TestRecord; measure?: { date: string; text: string }
  onToggle: (choice: string) => void; onValue: (key: string, value: string) => void
}) {
  return <section className={`flex-rubric${filled ? ' filled' : ''}`} aria-label={rubric.title}>
    <h3>{rubric.title}</h3>
    {measure && <p className="previous-measure"><span className="previous-mark" aria-hidden="true">★</span> {measure.text} · {shortDate(measure.date)}</p>}
    {rubric.controls.map(control => <Control key={control.key} control={control} title={rubric.title} choices={choices} values={values} last={last} onToggle={onToggle} onValue={onValue} />)}
  </section>
}

function Control({ control, title, choices, values, last, onToggle, onValue }: {
  control: FlexControl; title: string; choices: string[]; values: Record<string, string>; last?: TestRecord
  onToggle: (choice: string) => void; onValue: (key: string, value: string) => void
}) {
  const name = control.label ? `${title} – ${control.label}` : title
  const star = <span className="previous-mark" title="Choix du bilan précédent">★</span>
  switch (control.kind) {
    case 'multi': return <div className="flex-options" role="group" aria-label={name}>
      {control.label && <p className="row-sub">{control.label}</p>}
      {control.options.map((option, index) => {
        const choice = choiceId(control.key, index)
        return <button key={choice} type="button" role="checkbox" className="test-option" aria-checked={choices.includes(choice)} onClick={() => onToggle(choice)}><span className="option-label">{option}</span>{last?.choices?.includes(choice) && star}</button>
      })}
    </div>
    case 'single': return <div className={`flex-options${control.compact ? ' compact' : ''}`} role="radiogroup" aria-label={name}>
      {control.label && <p className="row-sub">{control.label}</p>}
      {control.options.map(option => <button key={option} type="button" role="radio" className="test-option" aria-checked={values[control.key] === option} onClick={() => onValue(control.key, values[control.key] === option ? '' : option)}><span className="option-label">{option}</span>{last?.values?.[control.key] === option && star}</button>)}
    </div>
    case 'number': return <label className="flex-field"><span>{control.label}</span><span className="flex-number"><input type="text" inputMode="decimal" aria-label={name} value={values[control.key] ?? ''} onChange={event => onValue(control.key, event.target.value)} /><span>{control.unit}</span></span></label>
    case 'text': return <label className="flex-field"><span>{control.label}</span>{control.long
      ? <textarea rows={3} aria-label={name} value={values[control.key] ?? ''} onChange={event => onValue(control.key, event.target.value)} />
      : <input type="text" aria-label={name} value={values[control.key] ?? ''} onChange={event => onValue(control.key, event.target.value)} />}</label>
  }
}
