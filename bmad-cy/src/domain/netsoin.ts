// Récapitulatif à recopier dans NetSoin (logiciel de la résidence), affiché dans l’onglet Bilans : cotations du Tinetti dans
// l’ordre de NetSoin, par groupes de 5, et durées du TUG par étapes. Le Tinetti et le TUG peuvent venir de leur écran,
// des tests rapides ou des repères du bilan libre.
import { catalogFor, formValues, NS_COMMENT, type BilanForm } from './catalog'
import type { NsTest, NsValidations } from './model'
import { netsoinCotations, TINETTI, type CotationGroup, type TestRecord } from './tinetti'
import { parseTugSteps, tugStepsFromForm, type TugSteps } from './tug'

// fingerprint : empreinte des valeurs à recopier ; le ✓ la garde, une modification ultérieure remet le test « à recopier ».
export interface NetsoinRecap { tinetti?: { groups: CotationGroup[]; total: number; fingerprint: string }; tug?: TugSteps & { fingerprint: string }; comment?: string }
const ROWS = TINETTI.flatMap(section => section.items.flatMap(item => item.rows))

// Cotations du Tinetti cochées dans les repères (lignes cotées du catalogue `equilibre.tinetti.<ligne>`, mêmes identifiants).
export function formTinettiScores(form: Pick<BilanForm, 'version' | 'values' | 'choices'>): Record<string, number> {
  const catalog = catalogFor(form.version)
  const labels = formValues(form, catalog)
  const scores: Record<string, number> = {}
  for (const row of ROWS) {
    const field = catalog.fields.find(item => item.key === `equilibre.tinetti.${row.id}`)
    const option = field?.options.find(item => item.label === labels[field.key])
    if (option?.score !== undefined) scores[row.id] = option.score
  }
  return scores
}

export function netsoinRecap(item: { kind: string; record?: TestRecord; form?: BilanForm }): NetsoinRecap {
  const recap: NetsoinRecap = {}
  const scores = item.kind === 'tinetti' ? item.record?.scores : item.kind === 'bilan' && item.form ? formTinettiScores(item.form) : undefined
  if (scores && Object.keys(scores).length) {
    const groups = netsoinCotations(scores)
    recap.tinetti = { groups, total: Object.values(scores).reduce((sum, value) => sum + value, 0), fingerprint: groups.map(group => group.values.join('')).join('|') }
  }
  const tug = item.kind === 'bilan' ? (item.form ? tugStepsFromForm(item.form.values) : null) : parseTugSteps(item.record?.values)
  if (tug) recap.tug = { ...tug, fingerprint: [...tug.steps, tug.total].join('|') }
  const comment = item.kind === 'bilan' ? item.form?.values[NS_COMMENT]?.trim() : undefined
  if (comment && (recap.tinetti || recap.tug)) recap.comment = comment
  return recap
}
export const hasRecap = (recap: NetsoinRecap) => !!recap.tinetti || !!recap.tug
// Test recopié dans NetSoin et pas modifié depuis.
export const nsDone = (recap: NetsoinRecap, test: NsTest, ns: NsValidations | undefined) => !!recap[test] && ns?.[test] === recap[test]!.fingerprint
