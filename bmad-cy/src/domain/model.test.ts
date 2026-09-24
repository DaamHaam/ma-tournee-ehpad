import { describe, expect, it } from 'vitest'
import { localDate, moodSigns, toggleSession, validDate, weekDate } from './model'

describe('règles du domaine', () => {
  it('bascule A/B de façon exclusive et réversible', () => {
    expect(toggleSession(null, 'A')).toBe('A')
    expect(toggleSession('A', 'B')).toBe('B')
    expect(toggleSession('B', 'B')).toBeNull()
  })

  it('distingue le H neutre et encode uniquement les signes', () => {
    expect(moodSigns(null)).toBe('')
    expect(moodSigns(0)).toBe('')
    expect(moodSigns(-3)).toBe('---')
    expect(moodSigns(2)).toBe('++')
  })

  it('valide les vraies dates locales et calcule les jours L/J/V', () => {
    expect(validDate('2026-02-29')).toBe(false)
    expect(validDate('2028-02-29')).toBe(true)
    expect(weekDate('2026-09-24', 1)).toBe('2026-09-21')
    expect(weekDate('2026-09-24', 5)).toBe('2026-09-25')
    expect(localDate(new Date(2026, 8, 4, 23, 30))).toBe('2026-09-04')
  })
})
