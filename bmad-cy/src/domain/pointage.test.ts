import { describe, expect, it } from 'vitest'
import { plannedOn, weekdayLetter, type Day, type Entry } from './model'
import { capacity, pointageDays, pointageMonths, pointageView, previousMonthStart, withoutUnpointed } from './pointage'
import { exportPointage, exportTxt } from '../features/exports/exportTxt'

const entry = (id: string, session: Entry['session'], note = '', patch: Partial<Entry> = {}): Entry => ({ patient: { id, lastName: id, firstName: '', room: '', priority: '', demo: true }, session, note, ...patch })
const day = (date: string, entries: Entry[], patch: Partial<Day> = {}): Day => ({ date, entries: Object.fromEntries(entries.map(item => [item.patient.id, item])), order: entries.map(item => item.patient.id), mood: null, comment: '', ...patch })

describe('pointage définitif', () => {
  // Jeudi 10 septembre 2026.
  const thursday = day('2026-09-10', [
    entry('fictifc', 'B'),
    entry('fictifd', 'A', 'marche', { unpointed: true }),
    entry('fictife', 'A'),
    entry('fictiff', null, 'malade', { planned: true }),
    entry('fictifg', null, '', { planned: true, unpointed: true }),
    entry('fictifh', null, '', { planned: false }),
    entry('fictifi', null, ''),
  ])

  it('lit les jours de séance L, J, V', () => {
    expect(['2026-09-07', '2026-09-08', '2026-09-10', '2026-09-11'].map(weekdayLetter)).toEqual(['L', null, 'J', 'V'])
    expect(plannedOn('LV', '2026-09-11')).toBe(true)
    expect(plannedOn('LV', '2026-09-10')).toBe(false)
  })

  it('garde les jours avec une séance, du plus récent au plus ancien, et leurs mois', () => {
    const days = [day('2026-08-03', [entry('fictifa', 'A')]), day('2026-08-04', [entry('fictifb', null, 'note')]), thursday]
    expect(pointageDays(days).map(item => item.date)).toEqual(['2026-09-10', '2026-08-03'])
    expect(pointageMonths(pointageDays(days))).toEqual(['2026-09', '2026-08'])
  })

  it('met en haut les vus et les prévus non vus (rouge), en dessous les retirés, dépointés et non prévus', () => {
    // fictifi sans jours retenus : la fiche actuelle dit jeudi.
    const view = pointageView(thursday, new Map([['fictifi', { days: 'J' }]]))
    expect(view.top.map(row => `${row.id}:${row.kind}`)).toEqual(['fictifc:B', 'fictife:A', 'fictiff:red', 'fictifi:red'])
    expect(view.below.map(row => `${row.id}:${row.kind}`)).toEqual(['fictifd:removed', 'fictifg:done', 'fictifh:unplanned'])
    expect(pointageView(thursday, new Map()).below.map(row => row.id)).toContain('fictifi')
    expect([view.a, view.b]).toEqual([1, 1])
  })

  it('compare les patients gardés à la capacité du jour (10 sans signe, un par signe, ± 1)', () => {
    expect([capacity(null), capacity(-2), capacity(1)]).toEqual([10, 8, 11])
    const seen = (count: number, mood: Day['mood']) => day('2026-09-10', Array.from({ length: count }, (_, index) => entry(`fictif${index}`, index % 2 ? 'B' : 'A')), { mood })
    expect(pointageView(seen(9, -2), new Map()).warning).toBe(false)
    expect(pointageView(seen(10, -2), new Map()).warning).toBe(true)
    expect(pointageView(seen(8, null), new Map()).warning).toBe(true)
    expect(pointageView(seen(11, null), new Map()).warning).toBe(false)
  })

  it('exporte sans signes H ni séances retirées, avec commentaire, Pas vus et Pause', () => {
    const withMood = { ...thursday, mood: 2 as const, comment: 'journée calme', entries: { ...thursday.entries, fictifh: { ...thursday.entries.fictifh, pause: 'hôpital' } } }
    expect(exportTxt([withMood])).toBe('10/09/2026 ++\njournée calme\nfictifc Fictifd (marche) Fictife\nPas vus : Fictiff (malade)\nPause : Fictifh (hôpital)')
    expect(exportPointage([withMood])).toBe('10/09/2026\njournée calme\nfictifc Fictife\nPas vus : Fictifd (marche) Fictiff (malade)\nPause : Fictifh (hôpital)')
    expect(withoutUnpointed(thursday).entries.fictifd.session).toBeNull()
    expect(thursday.entries.fictifd.session).toBe('A')
  })

  it('propose le premier jour du mois précédent comme début d’export', () => {
    expect(previousMonthStart('2026-11-13')).toBe('2026-10-01')
    expect(previousMonthStart('2027-01-05')).toBe('2026-12-01')
  })
})
