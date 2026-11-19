import { describe, expect, it } from 'vitest'
import { fillEmptyRows, netsoinCotations, netsoinDetailText, previousTest, TINETTI, tinettiResultHtml, tinettiScore } from './tinetti'

const all = (value: (max: number) => number) => Object.fromEntries(TINETTI.flatMap(section => section.items.flatMap(item => item.rows)).map(row => [row.id, value(row.options.length - 1)]))

describe('test de Tinetti', () => {
  it('compte 16 points d’équilibre, 12 de marche, 28 au total', () => {
    const score = tinettiScore(all(max => max))
    expect([score.equilibre.max, score.marche.max, score.max]).toEqual([16, 12, 28])
    expect([score.equilibre.score, score.marche.score, score.total, score.complete]).toEqual([16, 12, 28, true])
    expect(TINETTI.flatMap(section => section.items).map(item => item.number)).toEqual(Array.from({ length: 16 }, (_, index) => index + 1))
  })
  it('signale les items non cotés, sans jamais d’interprétation', () => {
    const partial = tinettiScore({ e1: 1, e8a: 1, m11a: 1 })
    expect(partial).toMatchObject({ total: 3, complete: false })
    expect(partial.missing).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    expect(tinettiResultHtml({ scores: all(() => 0) })).toBe('<u><b>Tinetti</b></u> : <b>0/28</b> (équilibre 0/16, marche 0/12)')
  })
  it('cotations dans l’ordre de NetSoin (item 9 à la fin), par groupes de 5', () => {
    const scores = all(max => max)
    const groups = netsoinCotations(scores)
    expect(groups.map(group => `${group.from}-${group.to}`)).toEqual(['1-5', '6-10', '11a-12', '13-9'])
    expect(groups.flatMap(group => group.values)).toHaveLength(20)
    expect(netsoinCotations({ e9: 2 }).at(-1)).toMatchObject({ to: '9', values: ['–', '–', '–', '–', '2'] })
    expect(netsoinDetailText(scores)).toBe('Cotations : 1 2 2 2 2 · 2 1 1 1 1 · 1 1 1 1 1 · 1 2 2 1 2')
  })
  it('produit un résultat court mis en forme', () => {
    expect(tinettiResultHtml({ scores: all(max => max) }, 'Marche <b>lente</b>')).toBe('<u><b>Tinetti</b></u> : <b>28/28</b> (équilibre 16/16, marche 12/12)<br>Marche <b>lente</b>')
    expect(tinettiResultHtml({ scores: { e1: 1 } })).toBe('<u><b>Tinetti</b></u> : <b>1/28</b> (équilibre 1/16, marche 0/12) – cotation incomplète<br>Items non cotés : 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16.')
  })
  it('retrouve le dernier test antérieur du patient', () => {
    const record = (score: number) => ({ tests: { tinetti: { scores: { e1: score }, notes: '', at: '' } } })
    const days: Parameters<typeof previousTest>[0] = [{ date: '2026-06-01', entries: { p: record(0) } }, { date: '2026-08-01', entries: { p: record(1) } }, { date: '2026-10-05', entries: { p: record(1) } }, { date: '2026-07-01', entries: { q: record(1) } }]
    expect(previousTest(days, 'p', '2026-10-05', 'tinetti')).toMatchObject({ date: '2026-08-01' })
    expect(previousTest(days, 'p', '2026-06-01', 'tinetti')).toBeNull()
  })

  it('remplit les lignes vides au maximum ou au minimum sans toucher aux lignes cochées', () => {
    const max = fillEmptyRows({ e2: 1 }, 'max')
    expect(Object.keys(max)).toHaveLength(20)
    expect(max.e2).toBe(1)
    expect(tinettiScore(max).total).toBe(27)
    const min = fillEmptyRows({ e2: 1 }, 'min')
    expect(tinettiScore(min)).toMatchObject({ total: 1, complete: true })
  })
})
