import { describe, expect, it } from 'vitest'
import seed from './catalogSeed.json'
import { formLines, parsePublished, registerCatalog, type BilanForm } from './catalog'
import { netsoinRecap } from './netsoin'
import { parseTugSteps, tugStepsFromForm, tugStepsFromMarks } from './tug'
import { TINETTI } from './tinetti'
import { htmlToText } from '../features/bilan/richText'

registerCatalog(parsePublished(seed)!)
const catalog = parsePublished(seed)!.catalog
const rows = TINETTI.flatMap(section => section.items.flatMap(item => item.rows))
// Repères : toutes les lignes du Tinetti à leur cotation maximale (clé de la proposition du catalogue).
const tinettiValues = Object.fromEntries(rows.map(row => {
  const field = catalog.fields.find(item => item.key === `equilibre.tinetti.${row.id}`)!
  return [field.key, [...field.options].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0].key]
}))
const form = (values: Record<string, string>): BilanForm => ({ version: 0, choices: [], values })

describe('TUG par étapes', () => {
  it('tronque chaque étape et le total à la seconde', () => {
    expect(tugStepsFromMarks([2900, 6100, 9000, 12999, 15500])).toEqual({ steps: [2, 4, 3, 3, 3], total: 15 })
  })
  it('relit les étapes d’un test et des repères', () => {
    expect(parseTugSteps({ tug: '15', 'tug.etapes': '2;4;3;3;3' })).toEqual({ steps: [2, 4, 3, 3, 3], total: 15 })
    expect(parseTugSteps({ tug: '15' })).toBeNull()
    expect(tugStepsFromForm({ 'transferts.tug.temps': '15', 'transferts.tug.assis_debout': '2', 'transferts.tug.aller': '4', 'transferts.tug.demi_tour': '3', 'transferts.tug.retour': '3', 'transferts.tug.debout_assis': '3' })).toEqual({ steps: [2, 4, 3, 3, 3], total: 15 })
  })
})

describe('récapitulatif NetSoin', () => {
  it('Tinetti des repères : cotations par 5, item 9 à la fin', () => {
    const recap = netsoinRecap({ kind: 'bilan', form: form(tinettiValues) })
    expect(recap.tinetti?.total).toBe(28)
    expect(recap.tinetti?.groups.at(-1)).toMatchObject({ from: '13', to: '9' })
  })
  it('TUG par étapes d’un test rapide ; rien à recopier sinon', () => {
    expect(netsoinRecap({ kind: 'mesures', record: { scores: {}, notes: '', at: '', values: { tug: '15', 'tug.etapes': '2;4;3;3;3' } } }).tug?.total).toBe(15)
    expect(netsoinRecap({ kind: 'bilan' })).toEqual({})
  })
  it('compte rendu des repères : Tinetti au score seul, détail des cotations seulement si la case est cochée', () => {
    const plain = formLines({ catalog, sex: '', form: form(tinettiValues) }).map(line => htmlToText(line)).join('\n')
    expect(plain).toContain('Tinetti : 28/28')
    expect(plain).not.toContain('Cotations')
    const detailed = formLines({ catalog, sex: '', form: form({ ...tinettiValues, 'equilibre.tinetti.detail': 'oui' }) }).map(line => htmlToText(line)).join('\n')
    expect(detailed).toContain('Cotations : 1 2 2 2 2 · 2 1 1 1 1 · 1 1 1 1 1 · 1 2 2 1 2')
  })
})
