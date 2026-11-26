import { useMemo, useRef, useState } from 'react'
import {
  activePresets, behaviour, calcText, copyTargets, preciseFields, secondsText, tenthsText, choiceKey, CHECKED, formValues, NS_COMMENT, NS_TAG, orderedRubrics, otherOf, resolve, rubricFields, rubricFilled, TEST_OF_RUBRIC, TEST_TAG, visibleOptions,
  type BilanForm, type CatField, type CatRubric, type Catalog, type Values,
} from '../../domain/catalog'
import type { Measure } from '../../domain/mesures'
import { TUG_STEPS } from '../../domain/tug'
import { shortDate } from './display'
import { ChronoBar, ChronoStart } from './ChronoBar'
import { useChrono, type Chrono, type ChronoResult } from './useChrono'

// Volet « Repères » du bilan : le catalogue de l’organisateur de bilans, que l’on consulte et coche pendant que l’on dicte.
// Par défaut tout l’arbre ; « + » ouvre un bilan prédéfini (son ordre, ses propositions) ou va droit à un test (Tinetti, TUG…).
// Domaines à la suite, onglets sur deux lignes pour y sauter, tests avec ★ et chronomètre, « Voir ce qui est rempli ».
// Ce qui est rempli devient des lignes de compte rendu (✨ ou « Ajouter au texte »).
export interface PreviousLines { date: string; copied: boolean; lines: Record<string, string> }
const TUG = 'transferts.tug'
const ATCD = 'contexte.atcd'

// initialFocus : test ouvert seul d’emblée (★ de la fiche ou des dernières mesures).
// atcdKine : antécédents utiles en séance de la fiche, repris dans « Antécédents » sur le bouton « Reprendre de la fiche ».
export function ReperesPane({ catalog, form, measures, previous, initialFocus = '', atcdKine = '', onChange }: {
  catalog: Catalog; form: BilanForm; measures: Record<string, Measure>; previous: PreviousLines | null; initialFocus?: string; atcdKine?: string
  onChange: (form: BilanForm) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const tabs = useRef<HTMLDivElement>(null)
  const [onlyFilled, setOnlyFilled] = useState(false)
  const [menu, setMenu] = useState(false)
  // Test ouvert seul (raccourci du menu « + »), sans changer le bilan.
  const [focus, setFocus] = useState(initialFocus)
  const values = useMemo(() => formValues(form, catalog), [form, catalog])
  const rubrics = useMemo(() => orderedRubrics(catalog, form.preset), [catalog, form.preset])
  const tests = useMemo(() => orderedRubrics(catalog).filter(rubric => rubric.tags.includes(TEST_TAG)), [catalog])
  const shown = focus ? orderedRubrics(catalog).filter(rubric => rubric.key === focus) : onlyFilled ? rubrics.filter(rubric => rubricFilled(rubric, catalog, values)) : rubrics
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
  // Recopie vers un autre test (comportement `copie_vers`, ex. 5 levers du SPPB → test « 5 levers de chaise »), en secondes entières.
  const copies = useMemo(() => copyTargets(catalog), [catalog])
  const setValues = (patch: Record<string, string>) => {
    const next = { ...form.values }
    const all = { ...patch }
    for (const [key, value] of Object.entries(patch)) if (copies[key]) all[copies[key]] = value.trim() ? secondsText(value) : ''
    for (const [key, value] of Object.entries(all)) { if (value.trim()) next[key] = value; else delete next[key] }
    set({ values: next })
  }
  const setValue = (key: string, value: string) => setValues({ [key]: value })
  // Chronomètre unique, en haut du volet (visible pendant que l’on cote) ; à l’arrêt, la valeur va directement dans le champ.
  // TUG (simple ou par étapes, lancé du TUG ou du Tinetti) : questions du TUG du catalogue ; un TUG simple efface les étapes.
  const chrono = useChrono((result: ChronoResult) => setValues('key' in result ? { [result.key]: result.value } : {
    [`${TUG}.temps`]: result.tug,
    ...Object.fromEntries(TUG_STEPS.map((step, index) => [`${TUG}.${step.key}`, result.steps ? String(result.steps[index]) : ''])),
  }))
  const presets = activePresets(catalog)
  const preset = presets.find(item => item.key === form.preset)
  const focused = tests.find(rubric => rubric.key === focus)
  const choose = (patch: { preset?: string; focus?: string }) => { setMenu(false); setFocus(patch.focus ?? ''); if (!patch.focus) set({ preset: patch.preset }); box.current?.scrollTo({ top: 0 }) }
  return <div className="pane flex-form reperes" role="tabpanel" aria-label="Repères" ref={box} onScroll={follow}>
    <div className="reperes-sticky" ref={tabs}>
      <ChronoBar chrono={chrono} />
      {/* Domaines (deux lignes) et « + » sur la même rangée, pour gagner de la hauteur. */}
      <div className="reperes-nav">
      {!focus && firstGroups.length > 1 && <div className="domain-tabs" role="tablist" aria-label="Domaines">
        {/* Deux lignes que l’on fait défiler ensemble : largeur du ruban ≈ moitié de la longueur totale des onglets. */}
        <div className="domain-tabs-rows" style={{ width: `${Math.ceil(firstGroups.reduce((sum, group) => sum + domainTitle(group.domain).length * 7 + 30, 0) / 2) + 20}px` }}>
        {firstGroups.map(group => {
          const filled = groups.filter(item => item.domain === group.domain).flatMap(item => item.rubrics).filter(rubric => rubricFilled(rubric, catalog, values)).length
          return <button key={group.id} type="button" role="tab" aria-selected={group.domain === active} onClick={() => { setActive(group.domain); jump(group.id) }}>{domainTitle(group.domain)}{filled > 0 && <span className="module-count" aria-label={`${filled} rubriques renseignées`}>{filled}</span>}</button>
        })}
        </div>
      </div>}
      {/* Tous les repères par défaut : seul le « + » ; une étiquette rappelle un bilan ou un test ouvert, ✕ y revient. */}
      <div className="reperes-head">
        {(focused || preset) && <button type="button" className="reperes-filter" aria-label={`Revenir à tous les repères (${(focused ?? preset)!.title} ouvert)`} onClick={() => choose({})}>{(focused ?? preset)!.title} ✕</button>}
        <button type="button" className="reperes-more" aria-expanded={menu} aria-label="Ouvrir un bilan ou un test" onClick={() => setMenu(open => !open)}>+</button>
      </div>
      </div>
      {menu && <div className="reperes-menu" role="menu" aria-label="Bilans et tests">
        <p className="row-sub">Bilans</p>
        {presets.map(item => <button key={item.key} type="button" role="menuitem" onClick={() => choose({ preset: item.key })}>{item.title}</button>)}
        <p className="row-sub">Tests</p>
        {tests.map(rubric => <button key={rubric.key} type="button" role="menuitem" onClick={() => choose({ focus: rubric.key })}>{rubric.title}</button>)}
      </div>}
    </div>
    {previous && <p className={`previous-note${previous.copied ? '' : ' pending'}`}>★ bilan précédent du {shortDate(previous.date)}</p>}
    {groups.map(group => <section key={group.id} data-group={group.id} className="flex-module" aria-label={domainTitle(group.domain)}>
      <h2 className="module-title">{domainTitle(group.domain)}</h2>
      {group.rubrics.map(rubric => <RubricBlock key={rubric.key} rubric={rubric} catalog={catalog} form={form} values={values}
        measure={measures[TEST_OF_RUBRIC[rubric.key] ?? '']} last={previous?.lines[rubric.key]} lastCopied={!!previous?.copied} lastDate={previous?.date}
        chrono={chrono} tugMeasure={measures.tug} atcdKine={atcdKine} onToggle={toggleChoice} onValue={setValue} />)}
    </section>)}
    {groups.length === 0 && <p className="pane-instructions">{onlyFilled ? 'Rien n’est encore rempli.' : 'Aucune rubrique dans ce bilan.'}</p>}
    {!focus && <div className="reperes-actions">
      <button type="button" role="switch" className="test-option" aria-checked={onlyFilled} onClick={() => setOnlyFilled(on => !on)}>Voir ce qui est rempli</button>
    </div>}
  </div>
}

function RubricBlock({ rubric, catalog, form, values, measure, last, lastCopied, lastDate, chrono, tugMeasure, atcdKine, onToggle, onValue }: {
  rubric: CatRubric; catalog: Catalog; form: BilanForm; values: Values; measure?: Measure; last?: string; lastCopied: boolean; lastDate?: string
  chrono: Chrono; tugMeasure?: Measure; atcdKine: string
  onToggle: (field: string, option: string) => void; onValue: (key: string, value: string) => void
}) {
  const fields = rubricFields(catalog, rubric.key)
  const countdown = behaviour(rubric, 'compte_a_rebours')
  // Questions chronométrées : un bouton par question (SPPB : 3 positions, 2 essais de marche, lever) ; au centième pour
  // `chronometre_centiemes` (affiché au dixième), sinon en secondes entières.
  const precise = preciseFields(rubric)
  const timedFields = rubric.behaviours.filter(item => item.consigne === 'chronometre' || item.consigne === 'chronometre_centiemes')
    .map(item => fields.find(field => field.key === `${rubric.key}.${item.settings}`)).filter((field): field is CatField => !!field)
  const filled = rubricFilled(rubric, catalog, values)
  const isTug = rubric.key === TUG
  const inTinetti = behaviour(rubric, 'tug_dans_tinetti') !== undefined
  // ★ : dernière mesure du test (historique commun), sinon ce qui avait été coché au bilan précédent.
  const star = measure ? { text: measure.text, date: measure.date, copied: measure.copied } : last && lastDate ? { text: last, date: lastDate, copied: lastCopied } : null
  // Boutons du chronomètre, les mêmes partout : TUG (simple, par étapes), sinon chronomètre ou compte à rebours du test.
  const tugButtons = <div className="chrono-starts">
    <ChronoStart chrono={chrono} spec={{ mode: 'tug', label: 'TUG' }}>TUG</ChronoStart>
    {(isTug ? behaviour(rubric, 'chronometre_etapes') !== undefined : true) && <ChronoStart chrono={chrono} spec={{ mode: 'steps', label: 'TUG par étapes' }}>TUG par étapes</ChronoStart>}
  </div>
  const starts = isTug ? tugButtons
    : timedFields.length ? <div className="chrono-starts">{timedFields.map(timed => <ChronoStart key={timed.key} chrono={chrono} spec={{ mode: 'stopwatch', label: timedFields.length > 1 ? `${rubric.title} – ${timed.label}` : rubric.title, key: timed.key, text: resolve(timed, catalog).type === 'text', centi: precise.has(timed.key) }}>{timedFields.length > 1 ? timed.label : 'Chronomètre'}</ChronoStart>)}</div>
    : countdown && Number(countdown) > 0 ? <div className="chrono-starts"><ChronoStart chrono={chrono} spec={{ mode: 'countdown', label: rubric.title, seconds: Number(countdown) }}>{`Compte à rebours ${Number(countdown) >= 60 ? `${Number(countdown) / 60} min` : `${countdown} s`}`}</ChronoStart></div>
    : null
  // Dans le Tinetti, le TUG se lance en tête de l’épreuve de marche (première ligne « m… »), avec sa ★.
  const walkStart = inTinetti ? fields.find(field => /^m/.test(field.key.slice(rubric.key.length + 1)))?.key : undefined
  // Tests NS : un commentaire libre commun en bas (Tinetti et TUG faits ensemble), repris sous les chiffres à recopier.
  const ns = rubric.tags.includes(NS_TAG)
  return <section className={`flex-rubric${filled ? ' filled' : ''}`} aria-label={rubric.title}>
    <h3>{rubric.title}{rubric.tags.includes(TEST_TAG) && <span className="test-tag"> · test{ns ? ' NS' : ''}</span>}</h3>
    {star && <p className={`previous-measure${star.copied ? '' : ' pending'}`}><span className="previous-mark" aria-hidden="true">★</span> {star.text} · {shortDate(star.date)}</p>}
    {rubric.passation && <p className="pane-instructions">{rubric.passation}</p>}
    {starts}
    {rubric.key === ATCD && atcdKine && <button type="button" className="rubric-action" disabled={(form.values[`${ATCD}.atcd`] ?? '').includes(atcdKine)} onClick={() => { const atcd = form.values[`${ATCD}.atcd`] ?? ''; onValue(`${ATCD}.atcd`, atcd.trim() ? `${atcd.trimEnd()}\n${atcdKine}` : atcdKine) }}>Reprendre de la fiche</button>}
    {fields.map(field => <div key={field.key} className="field-wrap">
      {field.key === walkStart && <><p className="row-sub">Épreuve de marche</p>{tugButtons}{tugMeasure && <p className={`previous-measure${tugMeasure.copied ? '' : ' pending'}`}><span className="previous-mark" aria-hidden="true">★</span> TUG {tugMeasure.text} · {shortDate(tugMeasure.date)}</p>}</>}
      <Field field={field} rubric={rubric} catalog={catalog} form={form} values={values} precise={precise.has(field.key)} onToggle={onToggle} onValue={onValue} />
    </div>)}
    {ns && <label className="flex-field ns-comment"><span>Commentaire des tests NS (commun au Tinetti et au TUG)</span><textarea rows={2} aria-label={`Commentaire des tests NS (${rubric.title})`} value={form.values[NS_COMMENT] ?? ''} onChange={event => onValue(NS_COMMENT, event.target.value)} /></label>}
  </section>
}

function Field({ field, rubric, catalog, form, values, precise = false, onToggle, onValue }: {
  field: CatField; rubric: CatRubric; catalog: Catalog; form: BilanForm; values: Values
  onToggle: (field: string, option: string) => void; precise?: boolean
  onValue: (key: string, value: string) => void
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
    // Au centième (SPPB) : mesuré au centième, affiché au dixième (une saisie à la main garde ce qu’on tape).
    case 'number': return <label className="flex-field">{label && <span>{label}</span>}<span className="flex-number"><input type="text" inputMode="decimal" aria-label={name} value={precise ? tenthsText(raw) : raw} onChange={event => onValue(field.key, event.target.value)} /><span>{unit}</span></span>{otherInput}</label>
    case 'list': return <label className="flex-field">{label && <span>{label}</span>}<textarea rows={3} aria-label={name} placeholder="Une ligne par élément" value={raw} onChange={event => onValue(field.key, event.target.value)} /></label>
    case 'text': return <label className="flex-field">{label && <span>{label}</span>}<textarea rows={2} aria-label={name} value={raw} onChange={event => onValue(field.key, event.target.value)} />{otherInput}</label>
  }
}
