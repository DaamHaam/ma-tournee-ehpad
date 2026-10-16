import { useState } from 'react'
import { Link } from 'react-router-dom'
import { rubricById, rubricFilled, rubricText, type FlexInput } from '../../domain/marcheEquilibre'
import { measureTitle, type Measure } from '../../domain/mesures'
import { shortDate } from './display'
import { Rubric } from './FlexFields'

// Tests standardisés reconnus par l’IA dans le bilan libre : rien n’entre dans l’historique sans validation.
// Chaque test est coché par défaut, avec sa mesure précédente ★ ; ✎ ouvre ses champs pour corriger la valeur.
export interface Recognized { measures: FlexInput; tests: string[]; tinetti: boolean }
export function RecognizedTests({ found, previous, tinettiPath, onSave, onDismiss }: {
  found: Recognized; previous: Record<string, Measure>; tinettiPath: string
  onSave: (measures: FlexInput, tests: string[]) => void; onDismiss: () => void
}) {
  const [measures, setMeasures] = useState({ choices: found.measures.choices ?? [], values: found.measures.values ?? {} })
  const [kept, setKept] = useState(found.tests)
  const [editing, setEditing] = useState<string | null>(null)
  const toggle = (test: string) => setKept(current => current.includes(test) ? current.filter(item => item !== test) : [...current, test])
  const onToggle = (choice: string) => setMeasures(current => ({ ...current, choices: current.choices.includes(choice) ? current.choices.filter(item => item !== choice) : [...current.choices, choice] }))
  const onValue = (key: string, value: string) => setMeasures(current => ({ ...current, values: value.trim() ? { ...current.values, [key]: value } : Object.fromEntries(Object.entries(current.values).filter(([item]) => item !== key)) }))
  const valid = kept.filter(test => rubricText(test, measures))
  return <section className="recognized" aria-label="Tests reconnus">
    <p className="recognized-title">Tests reconnus</p>
    {found.tests.length > 0 && <ul>{found.tests.map(test => {
      const rubric = rubricById(test)!
      const before = previous[test]
      return <li key={test}>
        <div className="recognized-row">
          <button type="button" role="checkbox" className="test-option" aria-checked={kept.includes(test)} onClick={() => toggle(test)}>
            <span className="option-label"><strong>{measureTitle(test)}</strong> : {rubricText(test, measures) || '—'}{before && <span className={`previous-measure${before.copied ? '' : ' pending'}`}> · <span className="previous-mark">★</span> {before.text} ({shortDate(before.date)})</span>}</span>
          </button>
          <button type="button" className="icon-button" aria-label={`Corriger ${measureTitle(test)}`} aria-expanded={editing === test} onClick={() => setEditing(current => current === test ? null : test)}>✎</button>
        </div>
        {editing === test && <Rubric rubric={rubric} filled={rubricFilled(rubric, measures)} input={measures} onToggle={onToggle} onValue={onValue} />}
      </li>
    })}</ul>}
    {found.tinetti && <p className="recognized-tinetti">Tinetti mentionné : <Link to={tinettiPath}>ouvrir la grille</Link></p>}
    <div className="action-row">
      <button type="button" onClick={onDismiss}>Ignorer</button>
      {found.tests.length > 0 && <button type="button" className="primary" disabled={!valid.length} onClick={() => onSave(measures, valid)}>Enregistrer les mesures</button>}
    </div>
  </section>
}

// ★ Dernières mesures du patient, repliées sous l’en-tête du bilan libre ; toucher un test l’ouvre pour le refaire.
export function LastMeasures({ measures, onOpen }: { measures: [string, Measure][]; onOpen: (test: string) => void }) {
  if (!measures.length) return null
  return <details className="last-measures">
    <summary>★ Dernières mesures</summary>
    <ul>{measures.map(([test, measure]) => <li key={test} className={measure.copied ? undefined : 'pending'}><button type="button" aria-label={`Faire le test ${measureTitle(test)}`} onClick={() => onOpen(test)}><span className="previous-mark" aria-hidden="true">★</span> <strong>{measureTitle(test)}</strong> : {measure.text} <span>· {shortDate(measure.date)}</span></button></li>)}</ul>
  </details>
}
