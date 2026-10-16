// Tests standardisés suivis dans le temps. Le catalogue est celui des rubriques « test » du bilan marche / équilibre
// (mêmes clés, même ligne de compte rendu partout) ; une mesure vient d’un test rapide (tests.mesures), d’un bilan libre
// (mesures reconnues puis validées, bilanMeasures) ou d’un bilan marche / équilibre. Les ★ lisent cet historique commun.
import { hasFlexContent, MARCHE_EQUILIBRE, rubricHtml, rubricText, type FlexInput, type FlexRubric } from './marcheEquilibre'
import { tinettiScore, type TestRecord } from './tinetti'

export const MEASURE_RUBRICS: FlexRubric[] = MARCHE_EQUILIBRE.flatMap(module => module.rubrics).filter(rubric => rubric.test)
// Le Tinetti garde toujours sa grille complète : son score entre dans l’historique, jamais saisi seul.
export const TINETTI_MEASURE = 'tinetti'
// Nom court (onglets, listes) ; le titre complet reste celui de la rubrique.
const SHORT: Record<string, string> = { assisDebout30s: 'Assis-debout 30 s', tug: 'TUG', stationDebout: 'Station debout', trajet: 'Trajet chambre-RDC', test10m: '10 m', test6min: '6 min', [TINETTI_MEASURE]: 'Tinetti' }
export function measureTitle(id: string): string { return SHORT[id] ?? MEASURE_RUBRICS.find(rubric => rubric.id === id)?.title ?? id }

interface MeasureEntry { tests?: Partial<Record<string, TestRecord>>; bilanMeasures?: FlexInput; bilanCopied?: boolean }
export interface MeasureDay { date: string; entries: Record<string, MeasureEntry> }
// copied : le test ou le bilan d’où vient la mesure a été copié (transmis) ; sinon la ★ est orange (suivi personnel, à transmettre).
export interface Measure { date: string; text: string; copied: boolean }

// Valeur d’un test pour une journée : test rapide, puis bilan libre, puis bilan marche / équilibre.
function dayMeasure(entry: MeasureEntry | undefined, id: string): Omit<Measure, 'date'> | null {
  if (!entry) return null
  if (id === TINETTI_MEASURE) {
    const record = entry.tests?.tinetti
    if (!record) return null
    const score = tinettiScore(record.scores)
    return score.complete ? { text: `${score.total}/${score.max}`, copied: !!record.copied } : null
  }
  for (const [source, copied] of [[entry.tests?.mesures, entry.tests?.mesures?.copied], [entry.bilanMeasures, entry.bilanCopied], [entry.tests?.marcheEquilibre, entry.tests?.marcheEquilibre?.copied]] as const) {
    const text = source ? rubricText(id, source) : ''
    if (text) return { text, copied: !!copied }
  }
  return null
}
const MEASURE_IDS = [...MEASURE_RUBRICS.map(rubric => rubric.id), TINETTI_MEASURE]

// Historique d’un patient, du plus récent au plus ancien, par test ; before : journées strictement antérieures seulement.
export function measureHistory(days: MeasureDay[], id: string, before?: string): Record<string, Measure[]> {
  const history: Record<string, Measure[]> = {}
  const sorted = days.filter(day => before === undefined || day.date < before).sort((a, b) => b.date.localeCompare(a.date))
  for (const day of sorted) for (const test of MEASURE_IDS) {
    const measure = dayMeasure(day.entries[id], test)
    if (measure) (history[test] ??= []).push({ date: day.date, ...measure })
  }
  return history
}
// ★ : dernière mesure de chaque test, strictement antérieure à la journée.
export function latestMeasures(days: MeasureDay[], id: string, date: string): Record<string, Measure> {
  return Object.fromEntries(Object.entries(measureHistory(days, id, date)).map(([test, list]) => [test, list[0]]))
}

// ★ du bilan marche / équilibre : dernier bilan antérieur (choix précédents) et dernières mesures, toutes sources confondues.
export interface PreviousFlex { last: { date: string; record: TestRecord } | null; measures: Record<string, Measure> }
export function previousMarcheEquilibre(days: MeasureDay[], id: string, date: string): PreviousFlex {
  const found = days.filter(day => day.date < date).map(day => ({ date: day.date, record: day.entries[id]?.tests?.marcheEquilibre }))
    .filter((item): item is { date: string; record: TestRecord } => !!item.record && hasFlexContent(item.record)).sort((a, b) => b.date.localeCompare(a.date))
  return { last: found[0] ?? null, measures: latestMeasures(days, id, date) }
}

// Tests rapides du jour : un par test, dans l’ordre du catalogue, une ligne chacun.
export function filledMeasures(input: FlexInput): string[] { return MEASURE_RUBRICS.filter(rubric => rubricText(rubric.id, input)).map(rubric => rubric.id) }
export function mesuresHtml(input: FlexInput): string { return filledMeasures(input).map(id => rubricHtml(id, input, true)).join('<br>') }
