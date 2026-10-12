import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { validDate, type Entry } from '../../domain/model'
import { hasFlexContent, rubricFilled, withoutRubric } from '../../domain/marcheEquilibre'
import { latestMeasures, MEASURE_RUBRICS, measureTitle, mesuresHtml, type Measure } from '../../domain/mesures'
import type { TestRecord } from '../../domain/tinetti'
import { Rubric } from './FlexFields'
import { ScreenHeader } from './screen'
import { backTarget, useBlockEdgeSwipe, useVisibleViewport } from './screenUtils'
import { useBilanCopy } from './useBilanCopy'

const KIND = 'mesures'
const DEFAULT_TEST = 'tug'

// Tests rapides du jour (TUG, 10 m, assis-debout…), sans bilan complet : un test à la fois, avec sa dernière mesure ★ et son chronomètre.
// Les mesures entrent dans l’historique commun ; la copie (une ligne par test) coche la transmission du jour.
export function MesuresPage() {
  const { date = '', id = '' } = useParams()
  const target = backTarget(useLocation().state, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  const previous = useLiveQuery(async () => valid ? latestMeasures(await db.days.where('date').below(date).toArray(), id, date) : undefined, [date, id, valid])
  if (!valid) return <Navigate replace to="/" />
  if (!day || !previous) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <MesuresEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} previous={previous} />
}

function MesuresEditor({ date, id, back, label, entry, previous }: { date: string; id: string; back: string; label: string; entry: Entry; previous: Record<string, Measure> }) {
  const { run } = useSave()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [initial] = useState<TestRecord | undefined>(() => entry.tests?.[KIND])
  const [choices, setChoices] = useState<string[]>(initial?.choices ?? [])
  const [values, setValues] = useState<Record<string, string>>(initial?.values ?? {})
  const input = { choices, values }
  const asked = params.get('test')
  const [selected, setSelected] = useState(() => MEASURE_RUBRICS.find(rubric => rubric.id === asked)?.id ?? MEASURE_RUBRICS.find(rubric => rubricFilled(rubric, input))?.id ?? DEFAULT_TEST)
  const rubric = MEASURE_RUBRICS.find(item => item.id === selected)!
  const { copied, copy } = useBilanCopy(date, id, KIND)
  const viewport = useVisibleViewport()
  useBlockEdgeSwipe()
  const changed = useRef(false)
  const save = (next: { choices: string[]; values: Record<string, string> }) => {
    changed.current = true
    setChoices(next.choices); setValues(next.values)
    void run(() => repository.setTest(date, id, KIND, next))
  }
  const toggle = (choice: string) => save({ choices: choices.includes(choice) ? choices.filter(item => item !== choice) : [...choices, choice], values })
  const setValue = (key: string, value: string) => save({ choices, values: value.trim() ? { ...values, [key]: value } : Object.fromEntries(Object.entries(values).filter(([item]) => item !== key)) })
  // Supprimer un test pour le refaire : seuls ses champs sont vidés.
  const remove = () => {
    if (!window.confirm(`Supprimer la mesure « ${measureTitle(selected)} » du jour ?`)) return
    const next = withoutRubric(input, selected)
    save({ choices: next.choices ?? [], values: next.values ?? {} })
  }
  // ✕ : quitte en remettant les tests du jour tels qu’à l’ouverture (sans rien écrire s’ils n’ont pas changé :
  // consulter une journée passée ne doit pas la créer).
  const cancel = async () => {
    if (changed.current) await run(() => repository.restoreTest(date, id, KIND, initial))
    navigate(back)
  }
  const filled = rubricFilled(rubric, input)
  return <div className="bilan-page mesures-page" style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient} tools={<span className="total-badge">Tests rapides</span>}
      copied={copied} copyDisabled={!hasFlexContent(input)} onCopy={() => void copy(mesuresHtml(input))} onCancel={() => void cancel()} />
    <div className="mesures-body">
      <div className="measure-tabs" role="tablist" aria-label="Tests">
        {MEASURE_RUBRICS.map(item => <button key={item.id} type="button" role="tab" aria-selected={item.id === selected} className={rubricFilled(item, input) ? 'done' : undefined} onClick={() => setSelected(item.id)}>{measureTitle(item.id)}{rubricFilled(item, input) && <span aria-label=" (fait)"> ✓</span>}</button>)}
      </div>
      <Rubric key={selected} rubric={rubric} filled={filled} input={input} measure={previous[selected]} chronoOpen onToggle={toggle} onValue={setValue} />
    </div>
    <div className="action-row mesures-actions">
      {filled && <button type="button" className="danger" onClick={remove}>Supprimer ce test</button>}
      <button type="button" className="primary" onClick={() => navigate(back)}>Valider</button>
    </div>
  </div>
}
