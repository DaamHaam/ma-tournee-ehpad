// Tests standardisés suivis dans le temps. Le catalogue est celui des rubriques « test » du bilan marche / équilibre
// (mêmes clés, même ligne de compte rendu partout) ; une mesure vient d’un test rapide (tests.mesures), d’un bilan libre
// (mesures reconnues puis validées, bilanMeasures) ou d’un bilan marche / équilibre. Les ★ lisent cet historique commun.
import { hasFlexContent, MARCHE_EQUILIBRE, rubricHtml, rubricText, type FlexInput, type FlexRubric } from './marcheEquilibre'
import { tinettiScore, type TestRecord } from './tinetti'
import { catalogFor, formMeasures, hasFormContent, type BilanForm } from './catalog'
import { parseTugSteps, tugStepsFromForm } from './tug'

export const MEASURE_RUBRICS: FlexRubric[] = MARCHE_EQUILIBRE.flatMap(module => module.rubrics).filter(rubric => rubric.test)
// Le Tinetti est un test comme les autres (score saisi ou dicté) ; une grille complète du même jour donne aussi son score.
export const TINETTI_MEASURE = 'tinetti'
// Nom court (onglets, listes) ; le titre complet reste celui de la rubrique.
const SHORT: Record<string, string> = { assisDebout30s: 'Assis-debout 30 s', tug: 'TUG', stationDebout: 'Station debout', trajet: 'Trajet chambre-RDC', test10m: '10 m', test6min: '6 min', [TINETTI_MEASURE]: 'Tinetti', sppb: 'SPPB' }
export function measureTitle(id: string): string { return SHORT[id] ?? MEASURE_RUBRICS.find(rubric => rubric.id === id)?.title ?? id }

interface MeasureEntry { tests?: Partial<Record<string, TestRecord>>; bilanMeasures?: FlexInput; bilanForm?: BilanForm; bilanCopied?: boolean; ns?: Partial<Record<string, string>> }
export interface MeasureDay { date: string; entries: Record<string, MeasureEntry> }
// copied : le test ou le bilan d’où vient la mesure a été copié (transmis) ; sinon la ★ est orange (suivi personnel, à transmettre).
export interface Measure { date: string; text: string; copied: boolean }

// Score d’une grille de Tinetti complète, sous la forme des champs du test.
function gridMeasure(record: TestRecord | undefined): FlexInput | undefined {
  const score = record && tinettiScore(record.scores)
  return score?.complete ? { values: { [TINETTI_MEASURE]: String(score.total), 'tinetti.equilibre': String(score.equilibre.score), 'tinetti.marche': String(score.marche.score) } } : undefined
}
// Valeur d’un test pour une journée : test rapide, puis bilan libre (tests validés, puis repères cochés), puis bilan marche / équilibre, puis TUG du Tinetti, puis grille du Tinetti.
function dayMeasure(entry: MeasureEntry | undefined, id: string): Omit<Measure, 'date'> | null {
  if (!entry) return null
  const grid = id === TINETTI_MEASURE ? gridMeasure(entry.tests?.tinetti) : undefined
  // TUG chronométré pendant le Tinetti (values.tug du Tinetti) : un test comme les autres, transmis avec le Tinetti.
  const tug = id === 'tug' && entry.tests?.tinetti?.values?.tug ? { values: { tug: entry.tests.tinetti.values.tug } } : undefined
  const form = entry.bilanForm && hasFormContent(entry.bilanForm) ? formMeasures(entry.bilanForm, catalogFor(entry.bilanForm.version)) : undefined
  for (const [source, copied] of [[entry.tests?.mesures, entry.tests?.mesures?.copied], [entry.bilanMeasures, entry.bilanCopied], [form, entry.bilanCopied || !!entry.ns?.[id]], [entry.tests?.marcheEquilibre, entry.tests?.marcheEquilibre?.copied], [tug, entry.tests?.tinetti?.copied], [grid, entry.tests?.tinetti?.copied]] as const) {
    const text = source ? rubricText(id, source) : ''
    if (text) return { text, copied: !!copied }
  }
  return null
}
const MEASURE_IDS = MEASURE_RUBRICS.map(rubric => rubric.id)

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
// Liste des ★ (fiche et bilan, même règle) : pour chaque test, la dernière mesure et le nombre de fois en tout ;
// les tests faits le plus souvent en haut, à égalité le plus récent d’abord.
export interface StarItem { test: string; last: Measure; count: number }
export function starList(history: Record<string, Measure[]>): StarItem[] {
  return Object.entries(history).filter(([, list]) => list.length).map(([test, list]) => ({ test, last: list[0], count: list.length }))
    .sort((a, b) => b.count - a.count || b.last.date.localeCompare(a.last.date) || MEASURE_IDS.indexOf(a.test) - MEASURE_IDS.indexOf(b.test))
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

// ★ de chaque étape du TUG : dernier TUG par étapes antérieur à la journée (repères du bilan, test rapide ou TUG du Tinetti).
export interface PreviousTugSteps { date: string; steps: number[]; copied: boolean }
export function previousTugSteps(days: MeasureDay[], id: string, before: string): PreviousTugSteps | null {
  for (const day of [...days].filter(item => item.date < before).sort((a, b) => b.date.localeCompare(a.date))) {
    const entry = day.entries[id]
    if (!entry) continue
    const found = [
      [entry.bilanForm ? tugStepsFromForm(entry.bilanForm.values) : null, entry.bilanCopied || !!entry.ns?.tug],
      [parseTugSteps(entry.tests?.mesures?.values), entry.tests?.mesures?.copied],
      [parseTugSteps(entry.tests?.tinetti?.values), entry.tests?.tinetti?.copied],
    ] as const
    for (const [steps, copied] of found) if (steps) return { date: day.date, steps: steps.steps, copied: !!copied }
  }
  return null
}
