import { describe, expect, it } from 'vitest'
import { daysSinceLastA, entryVisible, identityKey, followUpLevel, shortName, lastFollowUp, localDate, moodSigns, toggleDate, toggleLetter, toggleSession, validDate, weekDate, weeksSince, type Day } from './model'

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

  it('affiche le nom suivi de l’initiale du prénom', () => {
    const base = { id: 'x', room: '', priority: '', demo: false }
    expect(shortName({ ...base, lastName: 'FICTIF', firstName: 'alpha' })).toBe('FICTIF a.')
    expect(shortName({ ...base, lastName: 'Essai', firstName: 'Beta Gamma' })).toBe('Essai B.')
    expect(shortName({ ...base, lastName: 'EXEMPLE', firstName: ' ' })).toBe('EXEMPLE')
  })
  it('rapproche les noms sans tenir compte de la casse, des accents ni des espaces', () => {
    expect(identityKey({ lastName: ' DUPONT ', firstName: 'Zoé' })).toBe(identityKey({ lastName: 'dupont', firstName: 'zoe' }))
    expect(identityKey({ lastName: 'Dupont', firstName: 'M' })).not.toBe(identityKey({ lastName: 'Dupont', firstName: 'J' }))
  })

  it('n’affiche un patient archivé ou supprimé que là où il a déjà une trace, jamais dans le futur', () => {
    const empty = { patient: { id: 'p', lastName: 'Dupont', firstName: '', room: '', priority: '', demo: false }, session: null, note: '' }
    const seen = { ...empty, session: 'A' as const }
    expect(entryVisible(empty, { archived: false }, '2026-10-02', '2026-10-01')).toBe(true)
    expect(entryVisible(seen, { archived: true }, '2026-10-01', '2026-10-01')).toBe(true)
    expect(entryVisible(seen, undefined, '2026-09-30', '2026-10-01')).toBe(true)
    expect(entryVisible(empty, { archived: true }, '2026-10-01', '2026-10-01')).toBe(false)
    expect(entryVisible(seen, undefined, '2026-10-02', '2026-10-01')).toBe(false)
  })

  it('compte les semaines entières depuis la dernière éval ou trans', () => {
    expect(weeksSince(null, '2026-10-02')).toBeNull()
    expect(weeksSince('2026-10-02', '2026-10-02')).toBe(0)
    expect(weeksSince('2026-09-26', '2026-10-02')).toBe(0)
    expect(weeksSince('2026-09-25', '2026-10-02')).toBe(1)
    expect(weeksSince('2026-08-01', '2026-10-02')).toBe(8)
  })

  it('compte les jours depuis la dernière séance A antérieure à la journée affichée', () => {
    const day = (date: string, session: 'A' | 'B' | null): Pick<Day, 'date' | 'entries'> => ({ date, entries: { p1: { patient: { id: 'p1', lastName: 'Fictif', firstName: '', room: '', priority: '', demo: false }, session, note: '' } } })
    const days = [day('2026-09-21', 'A'), day('2026-09-24', 'B'), day('2026-09-25', 'A'), day('2026-10-02', 'A')]
    expect(daysSinceLastA(days, 'p1', '2026-10-02')).toBe(7)
    expect(daysSinceLastA(days, 'p1', '2026-09-24')).toBe(3)
    expect(daysSinceLastA(days, 'p1', '2026-09-21')).toBeNull()
    expect(daysSinceLastA(days, 'autre', '2026-10-02')).toBeNull()
  })
})
