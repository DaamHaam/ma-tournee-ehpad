import { useMemo, useRef, useState } from 'react'
import {
  activePresets, behaviour, calcText, choiceKey, CHECKED, formValues, orderedRubrics, otherOf, resolve, rubricFields, rubricFilled, TEST_OF_RUBRIC, TEST_TAG, visibleOptions,
  type BilanForm, type CatField, type CatRubric, type Catalog, type Values,
} from '../../domain/catalog'
import type { Measure } from '../../domain/mesures'
import { ChronoPanel } from './Chrono'
import { shortDate } from './display'

// Volet « Repères » du bilan : le catalogue de l’organisateur de bilans, que l’on consulte et coche pendant que l’on dicte.
// Bilan prédéfini (ou arbre complet), domaines à la suite avec onglets pour y sauter, tests avec ★ et chronomètre,
// filtre « cochés seulement ». Les éléments cochés deviennent des lignes de compte rendu (✨ ou « Insérer les cochés »).
export interface PreviousLines { date: string; copied: boolean; lines: Record<string, string> }
export function ReperesPane({ catalog, form, measures, previous, onChange, onInsert, insertCount }: {
  catalog: Catalog; form: BilanForm; measures: Record<string, Measure>; previous: PreviousLines | null
  onChange: (form: BilanForm) => void; onInsert: () => void; insertCount: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const tabs = useRef<HTMLDivElement>(null)
  const [onlyFilled, setOnlyFilled] = useState(false)
  const values = useMemo(() => formValues(form, catalog), [form, catalog])
  const rubrics = useMemo(() => orderedRubrics(catalog, form.preset), [catalog, form.preset])
  const shown = onlyFilled ? rubrics.filter(rubric => rubricFilled(rubric, catalog, values)) : rubrics
  // Domaines à la suite, dans l’ordre du bilan (un bilan prédéfini peut revenir sur un domaine : chaque passage a son titre).
  const groups = useMemo(() => {
    const list: { id: string; domain: string; rubrics: CatRubric[] }[] = []
    for (const rubric of shown) {
      const last = list.at(-1)
      if (last?.domain === rubric.domainKey) last.rubrics.push(rubric)
      else list.push({ id: `${rubric.domainKey}-${list.length}`, domain: rubric.domainKey, rubrics: [rubric] })
    }
    return list
  }, [shown])
  const domainTitle = (key: string) => catalog.domains.find(domain => domain.key === key)?.title ?? key
  const firstGroups = groups.filter((group, index) => groups.findIndex(item => item.domain === group.domain) === index)
  const [active, setActive] = useState('')
  const offset = () => (tabs.current?.offsetHeight ?? 0) + 6
  const jump = (id: string) => {
    const pane = box.current, section = pane?.querySelector<HTMLElement>(`[data-group="${id}"]`)
    if (pane && section) pane.scrollTo({ top: section.offsetTop - offset(), behavior: 'smooth' })
  }
  const follow = () => {
    const pane = box.current
    if (!pane) return
    const top = pane.scrollTop + offset() + 8
    let current = groups[0]?.domain ?? ''
    for (const group of groups) { const section = pane.querySelector<HTMLElement>(`[data-group="${group.id}"]`); if (section && section.offsetTop <= top) current = group.domain }
    if (current !== active) setActive(current)
  }
  const set = (patch: Partial<BilanForm>) => onChange({ ...form, ...patch })
  const toggleChoice = (field: string, option: string) => {
    const id = choiceKey(field, option)
    set({ choices: form.choices.includes(id) ? form.choices.filter(item => item !== id) : [...form.choices, id] })
  }
  const setValue = (key: string, value: string) => {
    const next = { ...form.values }
    if (value.trim()) next[key] = value
    else delete next[key]
    set({ values: next })
  }
  const presets = activePresets(catalog)
  return <div className="pane flex-form reperes" role="tabpanel" aria-label="Repères" ref={box} onScroll={follow}>
    <div className="reperes-head">
      <div className="flex-options compact" role="radiogroup" aria-label="Bilan">
        <button type="button" role="radio" className="test-option" aria-checked={!form.preset} onClick={() => set({ preset: undefined })}>Tout</button>
        {presets.map(preset => <button key={preset.key} type="button" role="radio" className="test-option" aria-checked={form.preset === preset.key} onClick={() => set({ preset: form.preset === preset.key ? undefined : preset.key })}>{preset.title}</button>)}
      </div>
      <div className="reperes-actions">
        <button type="button" role="switch" className="test-option" aria-checked={onlyFilled} onClick={() => setOnlyFilled(on => !on)}>Cochés seulement</button>
        <button type="button" className="primary" disabled={!insertCount} onClick={onInsert}>Insérer les cochés{insertCount ? ` (${insertCount})` : ''}</button>
      </div>
      {previous && <p className={`previous-note${previous.copied ? '' : ' pending'}`}>★ bilan précédent du {shortDate(previous.date)}</p>}
    </div>
    {firstGroups.length > 1 && <div className="domain-tabs" role="tablist" aria-label="Domaines" ref={tabs}>
      {firstGroups.map(group => {
        const filled = groups.filter(item => item.domain === group.domain).flatMap(item => item.rubrics).filter(rubric => rubricFilled(rubric, catalog, values)).length
        return <button key={group.id} type="button" role="tab" aria-selected={group.domain === active} onClick={() => { setActive(group.domain); jump(group.id) }}>{domainTitle(group.domain)}{filled > 0 && <span className="module-count" aria-label={`${filled} rubriques renseignées`}>{filled}</span>}</button>
      })}
    </div>}
    {groups.map(group => <section key={group.id} data-group={group.id} className="flex-module" aria-label={domainTitle(group.domain)}>
      <h2 className="module-title">{domainTitle(group.domain)}</h2>
      {group.rubrics.map(rubric => <RubricBlock key={rubric.key} rubric={rubric} catalog={catalog} form={form} values={values}
        measure={measures[TEST_OF_RUBRIC[rubric.key] ?? '']} last={previous?.lines[rubric.key]} lastCopied={!!previous?.copied} lastDate={previous?.date}
        onToggle={toggleChoice} onValue={setValue} />)}
    </section>)}
    {groups.length === 0 && <p className="pane-instructions">{onlyFilled ? 'Rien n’est encore coché.' : 'Aucune rubrique dans ce bilan.'}</p>}
  </div>
}

function RubricBlock({ rubric, catalog, form, values, measure, last, lastCopied, lastDate, onToggle, onValue }: {
  rubric: CatRubric; catalog: Catalog; form: BilanForm; values: Values; measure?: Measure; last?: string; lastCopied: boolean; lastDate?: string
  onToggle: (field: string, option: string) => void; onValue: (key: string, value: string) => void
}) {
  const fields = rubricFields(catalog, rubric.key)
  const stopwatch = behaviour(rubric, 'chronometre')
  const countdown = behaviour(rubric, 'compte_a_rebours')
  const timed = fields.find(field => field.key === `${rubric.key}.${stopwatch}`)
  const chrono = timed ? { mode: 'stopwatch' as const, key: timed.key } : countdown && Number(countdown) > 0 ? { mode: 'countdown' as const, seconds: Number(countdown) } : undefined
  const [open, setOpen] = useState(false)
  const filled = rubricFilled(rubric, catalog, values)
  // ★ : dernière mesure du test (historique commun), sinon ce qui avait été coché au bilan précédent.
  const star = measure ? { text: measure.text, date: measure.date, copied: measure.copied } : last && lastDate ? { text: last, date: lastDate, copied: lastCopied } : null
  return <section className={`flex-rubric${filled ? ' filled' : ''}`} aria-label={rubric.title}>
    <h3>{rubric.title}{rubric.tags.includes(TEST_TAG) && <span className="test-tag"> · test</span>}{chrono && <button type="button" className={`chrono-toggle${open ? ' open' : ''}`} aria-label={open ? 'Fermer le chronomètre' : 'Ouvrir le chronomètre'} aria-expanded={open} onClick={() => setOpen(value => !value)}>⏱</button>}</h3>
    {star && <p className={`previous-measure${star.copied ? '' : ' pending'}`}><span className="previous-mark" aria-hidden="true">★</span> {star.text} · {shortDate(star.date)}</p>}
    {rubric.passation && <p className="pane-instructions">{rubric.passation}</p>}
    {chrono && open && <ChronoPanel chrono={chrono} text={timed ? resolve(timed, catalog).type === 'text' : false} onTime={onValue} />}
    {fields.map(field => <Field key={field.key} field={field} rubric={rubric} catalog={catalog} form={form} values={values} onToggle={onToggle} onValue={onValue} />)}
  </section>
}

function Field({ field, rubric, catalog, form, values, onToggle, onValue }: {
  field: CatField; rubric: CatRubric; catalog: Catalog; form: BilanForm; values: Values
  onToggle: (field: string, option: string) => void; onValue: (key: string, value: string) => void
}) {
  const { type, unit, other, options } = resolve(field, catalog)
  const label = field.label && field.label !== rubric.title ? field.label : ''
  const name = label ? `${rubric.title} – ${label}` : rubric.title
  const raw = form.values[field.key] ?? ''
  // Propositions du bilan prédéfini, plus celles déjà cochées (autre bilan, archivées depuis) pour pouvoir les décocher.
  const chosen = (key: string) => type === 'multi' ? form.choices.includes(choiceKey(field.key, key)) : raw === key
  const list = options.filter(option => visibleOptions([option], form.preset).length > 0 || chosen(option.key))
  const otherInput = other && <input type="text" className="other-input" aria-label={`${name} : autre`} placeholder="Autre…" value={form.values[otherOf(field.key)] ?? ''} onChange={event => onValue(otherOf(field.key), event.target.value)} />
  switch (type) {
    case 'multi': return <div className="flex-options" role="group" aria-label={name}>
      {label && <p className="row-sub">{label}</p>}
      {list.map(option => <button key={option.key} type="button" role="checkbox" className="test-option" aria-checked={chosen(option.key)} onClick={() => onToggle(field.key, option.key)}><span className="option-label">{option.label}</span></button>)}
      {otherInput}
    </div>
    case 'single': case 'score': return <div className={`flex-options${list.length > 3 && list.every(option => option.label.length < 4) ? ' compact' : ''}`} role="radiogroup" aria-label={name}>
      {label && <p className="row-sub">{label}</p>}
      {list.map(option => <button key={option.key} type="button" role="radio" className="test-option" aria-checked={chosen(option.key)} onClick={() => onValue(field.key, chosen(option.key) ? '' : option.key)}>{type === 'score' && option.score !== undefined && <span className="option-score">{option.score}</span>}<span className="option-label">{option.label}</span></button>)}
      {otherInput}
    </div>
    case 'check': return <div className="flex-options" role="group" aria-label={name}>
      <button type="button" role="checkbox" className="test-option" aria-checked={raw === CHECKED} onClick={() => onValue(field.key, raw === CHECKED ? '' : CHECKED)}><span className="option-label">{field.label}</span></button>
    </div>
    case 'calc': {
      const result = calcText(field, catalog, values)
      return <p className="flex-field calc-field"><span>{field.label}</span> <b>{result === '' ? '—' : `${result}${unit ? ` ${unit}` : ''}`}</b></p>
    }
    case 'number': return <label className="flex-field">{label && <span>{label}</span>}<span className="flex-number"><input type="text" inputMode="decimal" aria-label={name} value={raw} onChange={event => onValue(field.key, event.target.value)} /><span>{unit}</span></span>{otherInput}</label>
    case 'list': return <label className="flex-field">{label && <span>{label}</span>}<textarea rows={3} aria-label={name} placeholder="Une ligne par élément" value={raw} onChange={event => onValue(field.key, event.target.value)} /></label>
    case 'text': return <label className="flex-field">{label && <span>{label}</span>}<textarea rows={2} aria-label={name} value={raw} onChange={event => onValue(field.key, event.target.value)} />{otherInput}</label>
  }
}
