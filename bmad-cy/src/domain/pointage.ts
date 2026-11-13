import { plannedOn, type Day, type Entry, type Mood, type Patient } from './model'

// Vue « Pointage » (pointage définitif) : relire jour par jour le pré-pointage fait d’après les jours L, J, V des fiches.
// En haut, les patients vus (A bleu, B orange) et, en rouge, ceux prévus mais pas vus, à dépointer.
// Toucher un patient le fait descendre dans la liste « non pointés » (entry.unpointed) : séance retirée du pointage définitif,
// ou prévu non vu déjà dépointé. Un second toucher le remonte. Rien d’autre ne change (journée, export habituel, fiche).

export function hasSession(day: Pick<Day, 'entries'>): boolean { return Object.values(day.entries).some(entry => entry.session !== null) }

// Jours où au moins une séance a été cochée, du plus récent au plus ancien.
export function pointageDays<T extends Pick<Day, 'date' | 'entries'>>(days: T[]): T[] {
  return days.filter(hasSession).sort((a, b) => b.date.localeCompare(a.date))
}

// Prévu ce jour-là : jours retenus dans la journée, sinon (journées plus anciennes) jours actuels de la fiche.
export function isPlanned(entry: Pick<Entry, 'planned'>, date: string, patient?: Pick<Patient, 'days'>): boolean {
  return entry.planned ?? (patient ? plannedOn(patient.days ?? '', date) : false)
}

export type ChipKind = 'A' | 'B' | 'red'
export type BelowKind = 'removed' | 'done' | 'unplanned'
export interface PointageRow<K> { id: string; entry: Entry; kind: K }
export interface PointageView { top: PointageRow<ChipKind>[]; below: PointageRow<BelowKind>[]; a: number; b: number; capacity: number; warning: boolean }

// Capacité du jour selon le niveau H : 10 patients sans signe, un de plus ou de moins par signe, à ±1 près.
export const BASE_CAPACITY = 10
export function capacity(mood: Mood): number { return BASE_CAPACITY + (mood ?? 0) }

// Patients du jour dans l’ordre de la tournée (comme l’export).
function ordered(day: Pick<Day, 'entries' | 'order'>): { id: string; entry: Entry }[] {
  const placed = new Set(day.order)
  return [...day.order, ...Object.keys(day.entries).filter(id => !placed.has(id))].flatMap(id => day.entries[id] ? [{ id, entry: day.entries[id] }] : [])
}

export function pointageView(day: Pick<Day, 'date' | 'entries' | 'order' | 'mood'>, patients: Map<string, Pick<Patient, 'days'>>): PointageView {
  const top: PointageRow<ChipKind>[] = []
  const below: PointageRow<BelowKind>[] = []
  for (const { id, entry } of ordered(day)) {
    if (entry.session !== null) {
      if (entry.unpointed) below.push({ id, entry, kind: 'removed' }); else top.push({ id, entry, kind: entry.session })
    } else if (isPlanned(entry, day.date, patients.get(id))) {
      if (entry.unpointed) below.push({ id, entry, kind: 'done' }); else top.push({ id, entry, kind: 'red' })
    } else below.push({ id, entry, kind: 'unplanned' })
  }
  const a = top.filter(row => row.kind === 'A').length
  const b = top.filter(row => row.kind === 'B').length
  const expected = capacity(day.mood)
  return { top, below, a, b, capacity: expected, warning: Math.abs(a + b - expected) > 1 }
}

// Mois présents (« AAAA-MM »), du plus récent au plus ancien, pour le sélecteur.
export function pointageMonths(days: Pick<Day, 'date'>[]): string[] {
  return [...new Set(days.map(day => day.date.slice(0, 7)))].sort().reverse()
}

// Journée telle que l’export définitif la voit : une séance retirée redevient « non vue » (sa note passe dans « Pas vus », sa pause dans « Pause »).
export function withoutUnpointed(day: Day): Day {
  const entries = Object.fromEntries(Object.entries(day.entries).map(([id, entry]) => [id, entry.unpointed && entry.session !== null ? { ...entry, session: null } : entry]))
  return { ...day, entries }
}

// Premier jour du mois précédent : début proposé pour l’export (ex. août et septembre préparés en octobre ou novembre).
export function previousMonthStart(today: string): string {
  const [year, month] = today.split('-').map(Number)
  const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  return `${previous.year}-${String(previous.month).padStart(2, '0')}-01`
}
