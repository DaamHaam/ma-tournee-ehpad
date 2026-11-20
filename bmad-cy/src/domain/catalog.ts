// Catalogue des bilans de l’organisateur de bilans (base Convex partagée avec DATALS) : structure seulement, jamais de donnée patient.
// L’application lit la dernière version publiée, en garde une copie locale (hors ligne) et note la version dans chaque bilan.
// La fabrication du compte rendu reprend `src/report.ts` de l’organisateur (mêmes règles : sections, même ligne, calculs,
// listes, ordre d’un bilan prédéfini, choix dans l’ordre où ils sont cochés) : garder les deux fichiers d’accord.
import { escapeHtml } from '../features/bilan/richText'
import { choiceId, MARCHE_EQUILIBRE, type FlexInput } from './marcheEquilibre'
import type { Sex } from './model'
import { netsoinDetailText } from './tinetti'

export type FieldType = 'multi' | 'single' | 'number' | 'text' | 'check' | 'score' | 'list' | 'calc'
export type ReportStyle = 'titre' | 'italique' | 'observation' | 'normal' | 'sans_libelle'
export interface CatOption { key: string; label: string; score?: number; tags: string[]; archived: boolean }
export interface CatCalc { kind: 'ecart_pct' | 'division' | 'somme'; inputs: string[]; constant?: number }
export interface CatField { key: string; rubricKey: string; label: string; type: FieldType; unit?: string; min?: number; max?: number; other: boolean; example?: string; moduleKey?: string; calc?: CatCalc; prefix?: string; order: number; options: CatOption[]; archived: boolean }
export interface CatModule { key: string; title: string; type: FieldType; unit?: string; other: boolean; options: CatOption[]; archived: boolean }
export interface CatReportPart { field: string; before: string; after: string; sep: string }
export interface CatRubric { key: string; domainKey: string; title: string; order: number; tags: string[]; passation: string; reportLabel: string; reportStyle: ReportStyle; reportParts: CatReportPart[]; section?: string; sameLine?: boolean; dictee: string[]; behaviours: { consigne: string; settings: string }[]; archived: boolean }
export interface CatDomain { key: string; title: string; order: number; archived: boolean }
export interface CatSection { key: string; title: string; order: number; archived: boolean }
export interface CatPreset { key: string; title: string; reportTitle: string; showTitle: boolean; rubricOrder?: string[]; order: number; archived: boolean }
export interface CatPrompt { key: string; title: string; text: string; presetKey?: string; order: number; archived: boolean }
export interface Catalog { domains: CatDomain[]; rubrics: CatRubric[]; fields: CatField[]; modules: CatModule[]; sections: CatSection[]; presets: CatPreset[]; prompts: CatPrompt[] }
export interface PublishedCatalog { number: number; publishedAt: number; catalog: Catalog }

export const TEST_TAG = 'test'
// Tests NS : chiffrage recopié dans une partie dédiée de NetSoin (Tinetti, TUG…), un commentaire libre commun.
export const NS_TAG = 'ns'
export const NS_COMMENT = 'ns#commentaire'
export const FORMAT_PROMPT = 'mise_en_forme'

// ——— Lecture et contrôle d’une version reçue ———

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const hasKeys = (list: unknown, ...keys: string[]): boolean => Array.isArray(list) && list.every(item => isObject(item) && keys.every(key => key in item))
const OPTIONS_OK = (items: unknown[]) => items.every(item => isObject(item) && hasKeys(item.options, 'key', 'label'))

// Version publiée reçue de Convex (ou relue de la base locale) ; null si elle ne ressemble pas à un catalogue :
// l’application garde alors la version précédente. Les prompts sont facultatifs (catalogues antérieurs à leur ajout).
export function parsePublished(value: unknown): PublishedCatalog | null {
  if (!isObject(value) || typeof value.number !== 'number' || typeof value.publishedAt !== 'number' || !isObject(value.catalog)) return null
  const c = value.catalog
  if (!hasKeys(c.domains, 'key', 'title') || !hasKeys(c.rubrics, 'key', 'domainKey', 'title', 'reportParts', 'tags')
    || !hasKeys(c.fields, 'key', 'rubricKey', 'type', 'options') || !hasKeys(c.modules ?? [], 'key', 'type', 'options')
    || !hasKeys(c.sections ?? [], 'key', 'title') || !hasKeys(c.presets ?? [], 'key', 'title') || !hasKeys(c.prompts ?? [], 'key', 'text')) return null
  if (!OPTIONS_OK(c.fields as unknown[]) || !OPTIONS_OK((c.modules ?? []) as unknown[])) return null
  const catalog: Catalog = {
    domains: c.domains as CatDomain[], rubrics: c.rubrics as CatRubric[], fields: c.fields as CatField[], modules: (c.modules ?? []) as CatModule[],
    sections: (c.sections ?? []) as CatSection[], presets: (c.presets ?? []) as CatPreset[], prompts: (c.prompts ?? []) as CatPrompt[],
  }
  return { number: value.number, publishedAt: value.publishedAt, catalog }
}

// ——— Bilan rempli (dans la journée : entry.bilanForm) ———

// Identifiants stables du catalogue, jamais de rang : un choix multiple coché est `${clé de la question}:${clé de la proposition}`,
// dans l’ordre où il a été coché ; un choix unique ou une ligne cotée garde la clé de la proposition dans values ;
// une case à cocher vaut 'oui' ; « Autre » est rangé sous `${clé}#autre`. version : version du catalogue utilisée.
// ai : empreinte du formulaire et lignes fabriquées au dernier ✨ (voyant « à refaire » et éléments décochés depuis).
export interface BilanForm { version: number; preset?: string; choices: string[]; values: Record<string, string>; ai?: { hash: string; lines: string[] } }
export const choiceKey = (field: string, option: string) => `${field}:${option}`
export const otherOf = (field: string) => `${field}#autre`
export const CHECKED = 'oui'

export function hasFormContent(form: Pick<BilanForm, 'choices' | 'values'> | undefined): boolean {
  return !!form && (form.choices.length > 0 || Object.values(form.values).some(value => value.trim() !== ''))
}

// ——— Lecture de la structure ———

export const localKey = (field: Pick<CatField, 'key' | 'rubricKey'>) => field.key.slice(field.rubricKey.length + 1)
// Une question tirée d’un module prend le type, l’unité et les propositions du module.
export function resolve(field: CatField, catalog: Pick<Catalog, 'modules'>): { type: FieldType; unit?: string; other: boolean; options: CatOption[] } {
  const module = field.moduleKey ? catalog.modules.find(item => item.key === field.moduleKey) : undefined
  return module ? { type: module.type, unit: module.unit, other: module.other, options: module.options } : { type: field.type, unit: field.unit, other: field.other, options: field.options }
}
// Propositions proposées : non archivées et, dans un bilan prédéfini, seulement celles qui en portent l’étiquette.
export const visibleOptions = (options: CatOption[], preset?: string) => options.filter(option => !option.archived && (!preset || option.tags.includes(preset)))
export const rubricFields = (catalog: Pick<Catalog, 'fields'>, rubricKey: string) => catalog.fields.filter(field => field.rubricKey === rubricKey && !field.archived).sort((a, b) => a.order - b.order)
export const activePresets = (catalog: Catalog) => catalog.presets.filter(preset => !preset.archived).sort((a, b) => a.order - b.order)

// Rubriques d’un bilan dans son ordre : ordre propre au bilan prédéfini, puis le reste dans l’ordre de l’arbre.
export function orderedRubrics(catalog: Pick<Catalog, 'domains' | 'rubrics' | 'presets'>, presetKey?: string): CatRubric[] {
  const preset = presetKey ? catalog.presets.find(item => item.key === presetKey) : undefined
  const domains = [...catalog.domains].filter(domain => !domain.archived).sort((a, b) => a.order - b.order)
  const domainOrder = new Map(domains.map((domain, index) => [domain.key, index]))
  const inTree = catalog.rubrics
    .filter(rubric => !rubric.archived && domainOrder.has(rubric.domainKey) && (!preset || rubric.tags.includes(preset.key)))
    .sort((a, b) => (domainOrder.get(a.domainKey)! - domainOrder.get(b.domainKey)!) || a.order - b.order)
  if (!preset?.rubricOrder) return inTree
  const own = preset.rubricOrder.map(key => inTree.find(rubric => rubric.key === key)).filter((rubric): rubric is CatRubric => !!rubric)
  return [...own, ...inTree.filter(rubric => !preset.rubricOrder!.includes(rubric.key))]
}

// ——— Valeurs lisibles (libellés) ———

// Valeurs du formulaire, par clé de question : libellés cochés (dans l’ordre des clics) ou texte. Une proposition archivée
// depuis reste lisible : le catalogue garde les éléments archivés.
export type Values = Record<string, string | string[]>
export function formValues(form: Pick<BilanForm, 'choices' | 'values'>, catalog: Catalog): Values {
  const values: Values = {}
  const fields = new Map(catalog.fields.map(field => [field.key, field]))
  for (const choice of form.choices) {
    const at = choice.lastIndexOf(':')
    const field = fields.get(choice.slice(0, at))
    const option = field && resolve(field, catalog).options.find(item => item.key === choice.slice(at + 1))
    if (field && option) values[field.key] = [...(values[field.key] as string[] | undefined ?? []), option.label]
  }
  for (const [key, value] of Object.entries(form.values)) {
    const field = fields.get(key)
    const { type, options } = field ? resolve(field, catalog) : { type: 'text' as FieldType, options: [] }
    values[key] = field && (type === 'single' || type === 'score') ? options.find(option => option.key === value)?.label ?? '' : value
  }
  return values
}

// Accords des propositions écrites « demandeur(se) », « orienté(e) » selon la civilité de la fiche (sans sexe connu, la forme écrite reste).
export function accord(text: string, sex: Sex): string {
  if (sex !== 'F' && sex !== 'H') return text
  return text.replace(/([\p{L}]+)\((e|se|ne|le|te|ve|euse|rice)\)/gu, (_, word: string, suffix: string) => {
    if (sex === 'H') return word
    if (suffix === 'se' && word.endsWith('r')) return `${word.slice(0, -1)}se`
    if (suffix === 'euse' && word.endsWith('eur')) return `${word.slice(0, -3)}euse`
    if (suffix === 'rice' && word.endsWith('teur')) return `${word.slice(0, -3)}rice`
    if (suffix === 've' && word.endsWith('f')) return `${word.slice(0, -1)}ve`
    return `${word}${suffix}`
  })
}

const siblingsOf = (field: CatField, catalog: Pick<Catalog, 'fields'>) => catalog.fields.filter(item => item.rubricKey === field.rubricKey && !item.archived)
function numberOf(field: CatField, catalog: Pick<Catalog, 'fields' | 'modules'>, values: Values): number | null {
  const { type, options } = resolve(field, catalog)
  const raw = values[field.key]
  if (type === 'score') return options.find(option => option.label === raw)?.score ?? null
  if (type === 'calc') { const text = calcText(field, catalog, values); return text === '' ? null : Number(text) }
  const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw.replace(',', '.')) : NaN
  return Number.isFinite(n) ? n : null
}
// Calculs de la liste fermée : écart en %, constante divisée par une question, somme.
export function calcText(field: CatField, catalog: Pick<Catalog, 'fields' | 'modules'>, values: Values): string {
  const rule = field.calc
  if (!rule) return ''
  const inputs = rule.inputs.map(key => siblingsOf(field, catalog).find(item => localKey(item) === key))
  const nums = inputs.map(item => (item && item.key !== field.key ? numberOf(item, catalog, values) : null))
  if (rule.kind === 'ecart_pct') { const [a, b] = nums; return a === null || b === null || a === 0 ? '' : String(Math.round(((a - b) / a) * 100)) }
  if (rule.kind === 'division') { const [a] = nums; return a === null || a === 0 ? '' : String(Math.round((rule.constant ?? 1) / a)) }
  const present = nums.filter((n): n is number => n !== null)
  return present.length ? String(present.reduce((sum, n) => sum + n, 0)) : ''
}
// Texte d’une question remplie (vide si rien n’est rempli).
export function fieldText(field: CatField, catalog: Pick<Catalog, 'fields' | 'modules'>, values: Values, sex: Sex = ''): string {
  const { type, other } = resolve(field, catalog)
  const raw = values[field.key]
  const extra = other ? String(values[otherOf(field.key)] ?? '').trim() : ''
  if (type === 'calc') return calcText(field, catalog, values)
  if (type === 'multi') return [...(Array.isArray(raw) ? raw.map(label => accord(label, sex)) : []), extra].filter(Boolean).join(', ')
  if (type === 'check') return raw ? field.label : ''
  if (type === 'list') return (typeof raw === 'string' ? raw : '').split('\n').map(line => line.trim()).filter(Boolean).map(line => `${field.prefix ?? ''}${line}`).join('\n')
  // Durées en secondes : entières, tronquées (jamais de dixièmes).
  const value = typeof raw === 'string' ? raw.trim() : ''
  const seconds = type === 'number' && (field.unit === 's' || field.unit === 'sec') && /^\d+[.,]\d+$/.test(value) ? String(Math.trunc(Number(value.replace(',', '.')))) : value
  return [accord(seconds, sex), extra].filter(Boolean).join(', ')
}

// ——— Compte rendu ———

export interface Line { label: string; style: ReportStyle; text: string; filled: boolean; labelAlone: boolean }
export function buildLine(rubric: CatRubric, catalog: Pick<Catalog, 'fields' | 'modules'>, values: Values, sex: Sex = ''): Line {
  const fields = rubricFields(catalog, rubric.key)
  let text = '', labelAlone = false
  for (const part of rubric.reportParts) {
    const field = fields.find(item => localKey(item) === part.field)
    if (!field) continue // question retirée (archivée) : son morceau ne s’écrit plus
    const value = fieldText(field, catalog, values, sex)
    if (!value) continue
    if (text && part.sep) text += part.sep
    if (!text && part.sep === '\n') labelAlone = true
    text += `${part.before}${value}${part.after}`
  }
  return { label: rubric.reportLabel, style: rubric.reportStyle, text, filled: text !== '', labelAlone }
}
export type Block = { kind: 'section'; title: string } | { kind: 'line'; keys: string[]; lines: Line[] }
// Titres de section avant la première rubrique remplie de chaque section (sauf tout en tête), rubriques « même ligne » jointes.
export function buildReport(rubrics: CatRubric[], catalog: Catalog, values: Values, sex: Sex = ''): Block[] {
  const blocks: Block[] = []
  const opened = new Set<string>()
  let previous: Extract<Block, { kind: 'line' }> | null = null
  for (const rubric of rubrics) {
    const line = buildLine(rubric, catalog, values, sex)
    if (!line.filled) continue
    const section = rubric.section ? catalog.sections.find(item => item.key === rubric.section && !item.archived) : undefined
    if (section && !opened.has(section.key)) {
      opened.add(section.key)
      if (blocks.length) { blocks.push({ kind: 'section', title: section.title }); previous = null }
    }
    // Tinetti (comportement `detail_tinetti`) : case cochée, ligne compacte des cotations dans l’ordre de NetSoin.
    const detail = behaviour(rubric, 'detail_tinetti')
    if (detail !== undefined && values[`${rubric.key}.${detail || 'detail'}`]) line.text += `\n${netsoinDetailText(rubricScores(rubric, catalog, values))}`
    if (rubric.sameLine && previous) { previous.keys.push(rubric.key); previous.lines.push(line); continue }
    previous = { kind: 'line', keys: [rubric.key], lines: [line] }
    blocks.push(previous)
  }
  return blocks
}
const html = (text: string) => escapeHtml(text).replace(/\n/g, '<br>')
function labelHtml(line: Line): string {
  if (line.style === 'sans_libelle' || !line.label) return ''
  const end = line.labelAlone ? '<br>' : ' : '
  const label = escapeHtml(line.label)
  if (line.style === 'titre') return `<b><u>${label}</u></b>${end}`
  if (line.style === 'italique') return `<i>${label}</i>${end}`
  if (line.style === 'observation') return `- <i>${label}</i>${end}`
  return `${label}${end}`
}
// Une ligne de compte rendu par bloc, en HTML restreint (<b>, <i>, <u>, <br>).
export function blockHtml(block: Block): string {
  return block.kind === 'section' ? `<b><u>${escapeHtml(block.title)}</u></b> :` : block.lines.map(line => `${labelHtml(line)}${html(line.text)}`).join(', ')
}

// ——— Ce que le bilan montre et fabrique ———

export interface FormContext { catalog: Catalog; form: Pick<BilanForm, 'preset' | 'choices' | 'values'>; sex: Sex }
export function formTitle({ catalog, form }: FormContext): string | null {
  const preset = form.preset ? catalog.presets.find(item => item.key === form.preset) : undefined
  return preset?.showTitle ? preset.reportTitle : null
}
// Lignes fabriquées par l’application à partir des éléments cochés, dans l’ordre du bilan (HTML restreint).
export function formBlocks({ catalog, form, sex }: FormContext): Block[] { return buildReport(orderedRubrics(catalog, form.preset), catalog, formValues(form, catalog), sex) }
export function formLines(context: FormContext): string[] { return formBlocks(context).map(blockHtml) }
// Nombre de rubriques remplies (titres de section exclus).
export function filledCount(blocks: Block[]): number { return blocks.reduce((total, block) => total + (block.kind === 'line' ? block.keys.length : 0), 0) }
export function rubricFilled(rubric: CatRubric, catalog: Catalog, values: Values): boolean { return buildLine(rubric, catalog, values).filled }
// Plan du bilan pour l’IA : sections et rubriques dans l’ordre (titres seulement).
export function formPlan({ catalog, form }: FormContext): string[] {
  const plan: string[] = []
  const opened = new Set<string>()
  for (const rubric of orderedRubrics(catalog, form.preset)) {
    const section = rubric.section ? catalog.sections.find(item => item.key === rubric.section && !item.archived) : undefined
    if (section && !opened.has(section.key)) { opened.add(section.key); plan.push(`[${section.title}]`) }
    plan.push(rubric.reportLabel || rubric.title)
  }
  return plan
}
// Empreinte du formulaire : le voyant de ✨ passe à l’orange dès qu’elle change après une mise en forme.
export function formHash(form: Pick<BilanForm, 'preset' | 'choices' | 'values'>): string {
  const text = JSON.stringify([form.preset ?? '', form.choices, Object.entries(form.values).filter(([, value]) => value.trim()).sort(([a], [b]) => a.localeCompare(b))])
  let hash = 5381
  for (let index = 0; index < text.length; index++) hash = ((hash << 5) + hash + text.charCodeAt(index)) >>> 0
  return hash.toString(36)
}
export function behaviour(rubric: CatRubric, consigne: string): string | undefined { return rubric.behaviours.find(item => item.consigne === consigne)?.settings }
// Cotations des lignes cotées d’une rubrique (grille), par clé locale de question (ex. Tinetti : e1, e8a, m11c…).
export function rubricScores(rubric: CatRubric, catalog: Pick<Catalog, 'fields' | 'modules'>, values: Values): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const field of rubricFields(catalog, rubric.key)) {
    const { type, options } = resolve(field, catalog)
    const score = type === 'score' ? options.find(option => option.label === values[field.key])?.score : undefined
    if (score !== undefined) scores[localKey(field)] = score
  }
  return scores
}

// ★ des repères : ce qui avait été coché au dernier bilan antérieur qui en avait (ligne de chaque rubrique), relu avec sa version.
export interface FormDay { date: string; entries: Record<string, { bilanForm?: BilanForm; bilanCopied?: boolean } | undefined> }
export function previousFormLines(days: FormDay[], id: string, date: string): { date: string; copied: boolean; lines: Record<string, string> } | null {
  const found = days.filter(day => day.date < date && hasFormContent(day.entries[id]?.bilanForm)).sort((a, b) => b.date.localeCompare(a.date))[0]
  if (!found) return null
  const entry = found.entries[id]!
  const catalog = catalogFor(entry.bilanForm!.version)
  const values = formValues(entry.bilanForm!, catalog)
  const lines: Record<string, string> = {}
  for (const rubric of catalog.rubrics) { const line = buildLine(rubric, catalog, values); if (line.filled) lines[rubric.key] = line.text.replace(/\n/g, ' · ') }
  return { date: found.date, copied: !!entry.bilanCopied, lines }
}

// ——— Tests standardisés : correspondance avec l’historique commun de l’application ———

// Clé du test dans l’application (★, tests rapides, bilans marche / équilibre, tests reconnus) → question du catalogue.
export const MEASURE_FIELDS: Record<string, string> = {
  eva: 'douleur.eva.eva',
  assisDebout30s: 'transferts.assis_debout_30s.passages', 'assisDebout30s.accoudoirs': 'transferts.assis_debout_30s.accoudoirs',
  cinqLevers: 'transferts.cinq_levers.temps',
  tug: 'transferts.tug.temps',
  stationDebout: 'equilibre.station_debout.duree',
  'perimetre.prefixe': 'marche.perimetre.prefixe', 'perimetre.distance': 'marche.perimetre.distance', 'perimetre.aides': 'marche.perimetre.aides',
  'perimetre.limites': 'marche.perimetre.limites', 'perimetre.lieu': 'marche.perimetre.lieu', 'perimetre.commentaire': 'marche.perimetre.commentaire',
  'trajet.duree': 'marche.trajet.duree', 'trajet.aides': 'marche.trajet.aides', 'trajet.commentaire': 'marche.trajet.commentaire',
  'test10m.temps': 'marche.test_10m.temps', 'test10m.pas': 'marche.test_10m.pas',
  test6min: 'endurance.test_6min.distance',
  tinetti: 'equilibre.tinetti.score', 'tinetti.equilibre': 'equilibre.tinetti.score_equilibre', 'tinetti.marche': 'equilibre.tinetti.score_marche',
}
const APP_TESTS = MARCHE_EQUILIBRE.flatMap(module => module.rubrics).filter(rubric => rubric.test)
// Rubrique du catalogue → test de l’application, pour afficher sa ★ dans les repères.
export const TEST_OF_RUBRIC: Record<string, string> = Object.fromEntries(APP_TESTS.flatMap(test => test.controls
  .map(control => MEASURE_FIELDS[control.key]).filter(Boolean).slice(0, 1).map(key => [key.slice(0, key.lastIndexOf('.')), test.id])))

// Test de l’application (tug, tinetti…) ou rubrique du catalogue → rubrique du catalogue, pour ouvrir le test seul dans les repères.
export function rubricOfTest(test: string): string {
  if (!test) return ''
  if (test.includes('.')) return test
  return Object.entries(TEST_OF_RUBRIC).find(([, id]) => id === test)?.[0] ?? ''
}

// Tests du formulaire, sous la forme des champs des tests de l’application (historique commun et ★).
export function formMeasures(form: Pick<BilanForm, 'choices' | 'values'>, catalog: Catalog): FlexInput {
  const values = formValues(form, catalog)
  const fields = new Map(catalog.fields.map(field => [field.key, field]))
  const out: FlexInput = { choices: [], values: {} }
  for (const test of APP_TESTS) for (const control of test.controls) {
    const field = fields.get(MEASURE_FIELDS[control.key] ?? '')
    if (!field) continue
    const { type } = resolve(field, catalog)
    const raw = values[field.key]
    if (control.kind === 'multi') {
      for (const label of Array.isArray(raw) ? raw : []) { const index = control.options.indexOf(label); if (index >= 0) out.choices!.push(choiceId(control.key, index)) }
      continue
    }
    let text = type === 'calc' ? calcText(field, catalog, values) : type === 'check' ? (raw ? (control.kind === 'single' ? control.options[0] : field.label) : '') : typeof raw === 'string' ? raw.trim() : ''
    if (control.kind === 'single' && text && !control.options.includes(text)) text = ''
    if (text) out.values![control.key] = text
  }
  return out
}

// Prompt de mise en forme du catalogue : propre au bilan prédéfini s’il existe, sinon commun.
export function catalogPrompt(catalog: Catalog, preset?: string): string | undefined {
  const prompts = catalog.prompts.filter(prompt => !prompt.archived && prompt.text.trim())
  return (preset ? prompts.find(prompt => prompt.presetKey === preset) : undefined)?.text ?? prompts.find(prompt => prompt.key === FORMAT_PROMPT)?.text
}

// ——— Versions connues de l’appareil ———

// Versions gardées en mémoire : la version embarquée dans l’application (0, copie du catalogue au moment de la livraison),
// puis celles reçues de Convex (rangées dans les réglages, donc dans la sauvegarde JSON). Un bilan se relit avec la version
// notée à son enregistrement, à défaut avec la plus récente.
const known = new Map<number, PublishedCatalog>()
const listeners = new Set<() => void>()
export function registerCatalog(published: PublishedCatalog): boolean {
  if (known.get(published.number)?.publishedAt === published.publishedAt) return false
  known.set(published.number, published)
  for (const listener of listeners) listener()
  return true
}
export function latestCatalog(): PublishedCatalog {
  let latest: PublishedCatalog | undefined
  for (const item of known.values()) if (!latest || item.number > latest.number) latest = item
  if (!latest) throw new Error('Catalogue absent')
  return latest
}
export function catalogFor(version: number | undefined): Catalog { return (version !== undefined ? known.get(version) : undefined)?.catalog ?? latestCatalog().catalog }
export function subscribeCatalogs(listener: () => void): () => void { listeners.add(listener); return () => { listeners.delete(listener) } }
