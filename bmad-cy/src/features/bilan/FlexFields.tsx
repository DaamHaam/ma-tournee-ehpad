import { useState } from 'react'
import { choiceId, type FlexControl, type FlexRubric } from '../../domain/marcheEquilibre'
import type { AiCheck, TestRecord } from '../../domain/tinetti'
import { ChronoPanel } from './Chrono'
import { shortDate } from './display'

// Champs des bilans flexibles, partagés par le bilan marche / équilibre et les tests rapides.
// Champ texte affiché sans la mise en forme (reprise de la dictée par l’IA, retours à la ligne gardés), qui reste dans le compte rendu
// tant qu’on ne le retouche pas.
const plain = (value: string | undefined) => (value ?? '').replace(/<br\s*\/?>/g, '\n').replace(/<\/?(?:b|i|u)>/g, '')
export type FlexValues = { choices: string[]; values: Record<string, string> }
const NO_AI = { filled: [], checks: [] }

// Rubrique (sous-sous-module) : titre, ⏱ pour un test minuté, dernière mesure ★ pour un test standardisé, voyants ⚠, puis ses champs.
// chronoOpen : chronomètre affiché d’emblée (test rapide) ; sinon ⏱ l’ouvre et le referme.
export function Rubric({ rubric, filled, input, ai = NO_AI, busy = false, last, measure, chronoOpen = false, onToggle, onValue }: {
  rubric: FlexRubric; filled: boolean; input: FlexValues; ai?: { filled: string[]; checks: AiCheck[] }; busy?: boolean
  last?: TestRecord; measure?: { date: string; text: string }; chronoOpen?: boolean; onToggle: (choice: string) => void; onValue: (key: string, value: string) => void
}) {
  const [chrono, setChrono] = useState(chronoOpen)
  return <section className={`flex-rubric${filled ? ' filled' : ''}`} aria-label={rubric.title}>
    <h3>{rubric.title}{rubric.chrono && !chronoOpen && <button type="button" className={`chrono-toggle${chrono ? ' open' : ''}`} aria-label={chrono ? 'Fermer le chronomètre' : 'Ouvrir le chronomètre'} aria-expanded={chrono} onClick={() => setChrono(open => !open)}>⏱</button>}</h3>
    {measure && <p className="previous-measure"><span className="previous-mark" aria-hidden="true">★</span> {measure.text} · {shortDate(measure.date)}</p>}
    {rubric.chrono && chrono && <ChronoPanel chrono={rubric.chrono} disabled={busy} onTime={onValue} />}
    {ai.checks.filter(check => check.row === rubric.id).map((check, index) => <p key={index} className="row-doubt" role="note">⚠ {check.reason || 'à vérifier'}</p>)}
    {rubric.controls.map(control => <Control key={control.key} control={control} title={rubric.title} input={input} ai={ai.filled} busy={busy} last={last} onToggle={onToggle} onValue={onValue} />)}
  </section>
}

export function Control({ control, title, input, ai, busy, last, onToggle, onValue }: {
  control: FlexControl; title: string; input: FlexValues; ai: string[]; busy: boolean; last?: TestRecord
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
