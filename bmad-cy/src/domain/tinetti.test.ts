import { describe, expect, it } from 'vitest'
import { previousTest, TINETTI, tinettiInterpretation, tinettiResultHtml, tinettiScore } from './tinetti'

const all = (value: (max: number) => number) => Object.fromEntries(TINETTI.flatMap(section => section.items.flatMap(item => item.rows)).map(row => [row.id, value(row.options.length - 1)]))

describe('test de Tinetti', () => {
  it('compte 16 points d’équilibre, 12 de marche, 28 au total', () => {
    const score = tinettiScore(all(max => max))
    expect([score.equilibre.max, score.marche.max, score.max]).toEqual([16, 12, 28])
    expect([score.equilibre.score, score.marche.score, score.total, score.complete]).toEqual([16, 12, 28, true])
    expect(TINETTI.flatMap(section => section.items).map(item => item.number)).toEqual(Array.from({ length: 16 }, (_, index) => index + 1))
  })
  it('signale les items non cotés et n’interprète qu’une cotation complète', () => {
    const partial = tinettiScore({ e1: 1, e8a: 1, m11a: 1 })
    expect(partial).toMatchObject({ total: 3, complete: false })
    expect(partial.missing).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    expect(tinettiInterpretation(partial)).toBe('')
    expect(tinettiInterpretation(tinettiScore(all(() => 0)))).toMatch(/inférieur à 19/)
    const almost = all(max => max); almost.e6 = 0; almost.m14 = 0
    expect(tinettiInterpretation(tinettiScore(almost))).toMatch(/inférieur à 26/)
    expect(tinettiInterpretation(tinettiScore(all(max => max)))).toBe('')
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
})
