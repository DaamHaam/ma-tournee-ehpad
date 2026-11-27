import { plannedOn, type Day, type Entry, type Mood, type Patient } from './model'

// Vue « Pointage » (pointage définitif) : relire jour par jour le pré-pointage fait d’après les jours L, J, V des fiches.
// En haut, les patients vus (A bleu, B orange) et, en rouge, ceux prévus mais pas vus, à dépointer.
// Toucher un patient le fait descendre dans la liste « non pointés » (entry.unpointed) : séance retirée du pointage définitif,
// ou prévu non vu déjà dépointé. Dans « non pointés », toucher n’importe quel patient (même jamais pointé ce jour-là) propose de
// le remonter en bleu (A), orange (B) ou rouge (prévu non vu) : entry.pointage. Rien d’autre ne change (journée, export
// habituel, fiche) : seul le pointage définitif et son export suivent ces corrections.

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

// Patients du jour dans l’ordre de la tournée, comme l’export : un patient archivé ou supprimé sorti de la tournée
// (son entrée reste dans la journée) n’y figure plus et ne doit pas apparaître en rouge.
function ordered(day: Pick<Day, 'entries' | 'order'>): { id: string; entry: Entry }[] {
  return day.order.flatMap(id => day.entries[id] ? [{ id, entry: day.entries[id] }] : [])
}

export function pointageView(day: Pick<Day, 'date' | 'entries' | 'order' | 'mood'>, patients: Map<string, Pick<Patient, 'days'>>): PointageView {
  const top: PointageRow<ChipKind>[] = []
  const below: PointageRow<BelowKind>[] = []
  for (const { id, entry } of ordered(day)) {
    // Couleur choisie à la main : elle l’emporte sur la séance de la journée et sur le prévu.
    if (entry.pointage && !entry.unpointed) { top.push({ id, entry, kind: entry.pointage }); continue }
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

// Séance retenue par le pointage définitif : retirée → aucune ; couleur choisie à la main → A, B ou aucune (rouge) ; sinon la journée.
export function definitiveSession(entry: Pick<Entry, 'session' | 'unpointed' | 'pointage'>): Entry['session'] {
  if (entry.unpointed) return null
  if (entry.pointage) return entry.pointage === 'red' ? null : entry.pointage
  return entry.session
}
// Journée telle que l’export définitif la voit : une séance retirée redevient « non vue » (sa note passe dans « Pas vus », sa pause
// dans « Pause ») ; une couleur remontée à la main donne sa séance.
export function withoutUnpointed(day: Day): Day {
  const entries = Object.fromEntries(Object.entries(day.entries).map(([id, entry]) => [id, { ...entry, session: definitiveSession(entry) }]))
  return { ...day, entries }
}

// Premier jour du mois précédent : début proposé pour l’export (ex. août et septembre préparés en octobre ou novembre).
export function previousMonthStart(today: string): string {
  const [year, month] = today.split('-').map(Number)
  const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  return `${previous.year}-${String(previous.month).padStart(2, '0')}-01`
}

// Suivi des retraits (remplace le post-it à bâtons) : depuis le début de la session de pointage, nombre de jours où chaque
// patient vu en B (orange) a été descendu dans « Non pointés ». Les A retirés ne comptent pas.
export const SESSION_START_SETTING = 'pointage.sessionStart'
export function removedCounts(days: Pick<Day, 'date' | 'entries'>[], start: string): Map<string, number> {
  const counts = new Map<string, number>()
  if (!start) return counts
  for (const day of days) {
    if (day.date < start) continue
    for (const [id, entry] of Object.entries(day.entries)) if (entry.unpointed && entry.session === 'B') counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}
// Fin proposée pour l’export : deux mois ronds après le début (1er octobre → 30 novembre).
export function twoMonthsEnd(start: string): string {
  const [year, month, day] = start.split('-').map(Number)
  const end = new Date(year, month + 1, day - 1)
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
}
