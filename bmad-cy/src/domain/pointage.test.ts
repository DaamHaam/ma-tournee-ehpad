import { describe, expect, it } from 'vitest'
import type { Day, Entry } from './model'
import { pointageCounts, pointageDays, pointageEntries, pointageMonths, previousMonthStart, withoutUnpointed } from './pointage'
import { exportPointage, exportTxt } from '../features/exports/exportTxt'

const entry = (id: string, session: Entry['session'], note = '', patch: Partial<Entry> = {}): Entry => ({ patient: { id, lastName: id, firstName: '', room: '', priority: '', demo: true }, session, note, ...patch })
const day = (date: string, entries: Entry[], patch: Partial<Day> = {}): Day => ({ date, entries: Object.fromEntries(entries.map(item => [item.patient.id, item])), order: entries.map(item => item.patient.id), mood: null, comment: '', ...patch })

describe('pointage', () => {
  const days = [
    day('2026-08-03', [entry('fictifa', 'A')]),
    day('2026-08-04', [entry('fictifb', null, 'note')]),
    day('2026-09-10', [entry('fictifc', 'B'), entry('fictifd', 'A', 'marche', { unpointed: true }), entry('fictife', 'A')]),
  ]

  it('garde les jours avec une séance, du plus récent au plus ancien, et leurs mois', () => {
    expect(pointageDays(days).map(item => item.date)).toEqual(['2026-09-10', '2026-08-03'])
    expect(pointageMonths(pointageDays(days))).toEqual(['2026-09', '2026-08'])
  })

  it('montre les séances dans l’ordre de la tournée, retirées comprises, et compte celles qui restent', () => {
    expect(pointageEntries(days[2]).map(item => item.id)).toEqual(['fictifc', 'fictifd', 'fictife'])
    expect(pointageCounts(days[2])).toEqual({ a: 1, b: 1 })
  })

  it('exporte au format de la journée sans les séances retirées, qui redeviennent non vues', () => {
    const withMood = { ...days[2], mood: 2 as const, comment: 'journée calme' }
    expect(exportTxt([withMood])).toBe('10/09/2026 ++\njournée calme\nfictifc Fictifd (marche) Fictife')
    expect(exportPointage([withMood])).toBe('10/09/2026 ++\njournée calme\nfictifc Fictife\nPas vus : Fictifd (marche)')
    expect(withoutUnpointed(days[2]).entries.fictifd.session).toBeNull()
    expect(days[2].entries.fictifd.session).toBe('A')
  })

  it('propose le premier jour du mois précédent comme début d’export', () => {
    expect(previousMonthStart('2026-11-13')).toBe('2026-10-01')
    expect(previousMonthStart('2027-01-05')).toBe('2026-12-01')
  })
})
