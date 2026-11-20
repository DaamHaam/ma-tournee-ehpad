import { describe, expect, it } from 'vitest'
import { lastNs, matchesNs, nsLate } from './suiviNs'

describe('suivi des tests NS', () => {
  it('dernier test, retard au-delà de 3 mois, filtres', () => {
    const recent = { nsDates: ['2026-06-01', '2026-10-15'] }, old = { nsDates: ['2026-05-01'] }, never = { nsDates: [] }
    expect(lastNs(recent)).toBe('2026-10-15')
    expect([nsLate(recent, '2026-11-20'), nsLate(old, '2026-11-20'), nsLate(never, '2026-11-20')]).toEqual([false, true, true])
    expect([recent, old, never].filter(p => matchesNs(p, 'retard', '2026-11-20'))).toEqual([old, never])
    expect([recent, old, never].filter(p => matchesNs(p, 'jamais', '2026-11-20'))).toEqual([never])
    expect([recent, old, never].filter(p => matchesNs(p, 'ajour', '2026-11-20'))).toEqual([recent])
  })
})
