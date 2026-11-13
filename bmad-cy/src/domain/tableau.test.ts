import { describe, expect, it } from 'vitest'
import { careDefaults, type Patient } from './model'
import { billingTotals, coverageOptions, ifdLabel, LETTER_COMBOS, letterOptions, shortEndDate, tableEnd, tablePatients } from './tableau'

const patient = (lastName: string, patch: Partial<Patient> = {}): Patient => ({ ...careDefaults(), id: lastName, lastName, firstName: '', room: '', priority: '', demo: false, archived: false, createdAt: '2026-01-01', ...patch })

describe('tableau des patients', () => {
  it('affiche les patients actifs, pause comprise, par ordre alphabétique', () => {
    const rows = tablePatients([patient('Zola'), patient('élise', { paused: true }), patient('Archivé', { archived: true }), patient('Bernard')])
    expect(rows.map(row => row.lastName)).toEqual(['Bernard', 'élise', 'Zola'])
  })

  it('propose toutes les combinaisons de jours et garde une valeur hors liste', () => {
    expect(LETTER_COMBOS).toEqual(['L', 'J', 'V', 'LJ', 'LV', 'JV', 'LJV'])
    expect(letterOptions('LJ')).toEqual(LETTER_COMBOS)
    expect(letterOptions('X')).toEqual([...LETTER_COMBOS, 'X'])
    expect(ifdLabel('')).toBe('non')
    expect(ifdLabel('LV')).toBe('LV')
  })

  it('propose les couvertures connues et une valeur importée telle quelle', () => {
    expect(coverageOptions('')).toEqual(['ALD', 'Mutuelle', '100% invalidité'])
    expect(coverageOptions('CMU')).toEqual(['ALD', 'Mutuelle', '100% invalidité', 'CMU'])
  })

  it('écrit la fin d’ordonnance en JJ/MM/AA avec la couleur de surveillance', () => {
    expect(shortEndDate('')).toBe('—')
    expect(shortEndDate('2026-10-05')).toBe('05/10/26')
    const today = '2026-11-13'
    expect(tableEnd(patient('A', { prescriptionEnd: '2027-03-01' }), today)).toEqual({ text: '01/03/27', level: 'ok' })
    expect(tableEnd(patient('A', { prescriptionEnd: '2026-11-20' }), today).level).toBe('soon')
    expect(tableEnd(patient('A', { prescriptionEnd: '2026-11-12' }), today).level).toBe('over')
    expect(tableEnd(patient('A'), today)).toEqual({ text: '—', level: 'none' })
    // Fin calculée depuis la date de prescription (durée absente = 1 an).
    expect(tableEnd(patient('A', { prescriptionDate: '2026-01-10' }), today).text).toBe('10/01/27')
  })

  it('compte les pointés et facturés', () => {
    expect(billingTotals([patient('A', { pointed: true, billed: true }), patient('B', { pointed: true }), patient('C')])).toBe('2/3 pointés · 1/3 facturés')
  })
})
