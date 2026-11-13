import type { Day } from './model'

// Vue « Pointage » : relire les séances A et B jour par jour et retirer celles qui ne doivent pas être pointées.
// Le retrait (entry.unpointed) ne sert qu’ici : la journée, son export habituel et la fiche gardent A ou B.

export function hasSession(day: Pick<Day, 'entries'>): boolean { return Object.values(day.entries).some(entry => entry.session !== null) }

// Jours où au moins une séance a été cochée, du plus récent au plus ancien.
export function pointageDays<T extends Pick<Day, 'date' | 'entries'>>(days: T[]): T[] {
  return days.filter(hasSession).sort((a, b) => b.date.localeCompare(a.date))
}

// Séances du jour dans l’ordre de la tournée (comme l’export), retirées comprises.
export function pointageEntries(day: Pick<Day, 'entries' | 'order'>) {
  const placed = new Set(day.order)
  const ids = [...day.order, ...Object.keys(day.entries).filter(id => !placed.has(id))]
  return ids.flatMap(id => { const entry = day.entries[id]; return entry && entry.session !== null ? [{ id, entry }] : [] })
}

export function pointageCounts(day: Pick<Day, 'entries'>): { a: number; b: number } {
  const kept = Object.values(day.entries).filter(entry => entry.session !== null && !entry.unpointed)
  return { a: kept.filter(entry => entry.session === 'A').length, b: kept.filter(entry => entry.session === 'B').length }
}

// Mois présents (« AAAA-MM »), du plus récent au plus ancien, pour le sélecteur.
export function pointageMonths(days: Pick<Day, 'date'>[]): string[] {
  return [...new Set(days.map(day => day.date.slice(0, 7)))].sort().reverse()
}

// Journée telle que l’export du pointage la voit : une séance retirée redevient « non vue » (sa note passe dans « Pas vus », sa pause dans « Pause »).
export function withoutUnpointed(day: Day): Day {
  const entries = Object.fromEntries(Object.entries(day.entries).map(([id, entry]) => [id, entry.unpointed ? { ...entry, session: null } : entry]))
  return { ...day, entries }
}

// Premier jour du mois précédent : début proposé pour l’export (ex. août et septembre préparés en octobre ou novembre).
export function previousMonthStart(today: string): string {
  const [year, month] = today.split('-').map(Number)
  const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  return `${previous.year}-${String(previous.month).padStart(2, '0')}-01`
}
