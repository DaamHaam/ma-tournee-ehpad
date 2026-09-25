import { describe, expect, it } from 'vitest'
import { followUpLevel, lastFollowUp, localDate, moodSigns, toggleDate, toggleLetter, toggleSession, validDate, weekDate } from './model'

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

  it('bascule les jours L/J/V dans un ordre stable', () => {
    expect(toggleLetter('', 'V')).toBe('V')
    expect(toggleLetter('V', 'L')).toBe('LV')
    expect(toggleLetter('LJV', 'J')).toBe('LV')
  })

  it('retient la dernière éval ou trans et colore selon son ancienneté', () => {
    expect(toggleDate(['2026-09-01'], '2026-08-01')).toEqual(['2026-08-01', '2026-09-01'])
    expect(toggleDate(['2026-09-01', '2026-09-25'], '2026-09-25')).toEqual(['2026-09-01'])
    expect(lastFollowUp({ evalDates: ['2026-09-10'], transDates: ['2026-08-01'] })).toBe('2026-09-10')
    expect(lastFollowUp({ evalDates: [], transDates: [] })).toBeNull()
    expect(followUpLevel(null, '2026-09-25')).toBe('unknown')
    expect(followUpLevel('2026-08-27', '2026-09-25')).toBe('recent')
    expect(followUpLevel('2026-08-26', '2026-09-25')).toBe('month')
    expect(followUpLevel('2026-08-11', '2026-09-25')).toBe('late')
    expect(followUpLevel('2026-07-27', '2026-09-25')).toBe('late')
    expect(followUpLevel('2026-07-26', '2026-09-25')).toBe('overdue')
  })
})
