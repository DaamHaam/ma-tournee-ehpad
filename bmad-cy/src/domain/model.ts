export type SessionType = 'A' | 'B' | null
export type Mood = -3 | -2 | -1 | 0 | 1 | 2 | 3 | null
export interface Identity { id: string; lastName: string; firstName: string; room: string; priority: string; demo: boolean }
export interface PatientCare { coverage: string; days: string; ifd: string; pointed: boolean; billed: boolean; evalDates: string[]; transDates: string[]; prescriptionEnd: string; doctor: string; rating: string }
export interface Patient extends Identity, PatientCare { archived: boolean; createdAt: string }
export const COVERAGES = ['ALD', 'Mutuelle', '100% invalidité']
export const WEEKDAY_LETTERS = ['L', 'J', 'V'] as const
export function careDefaults(): PatientCare { return { coverage: '', days: '', ifd: '', pointed: false, billed: false, evalDates: [], transDates: [], prescriptionEnd: '', doctor: '', rating: '' } }
export interface Entry { patient: Identity; session: SessionType; note: string }
export interface Day { date: string; entries: Record<string, Entry>; order: string[]; mood: Mood; comment: string }
export const SEPARATORS = ['separator:1', 'separator:2', 'separator:3']
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function parseDate(value: string): Date { return new Date(`${value}T12:00:00`) }
export function validDate(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDate(value).getTime()) && localDate(parseDate(value)) === value }
export function weekDate(date: string, weekday: number): string {
  const target = parseDate(date)
  target.setDate(target.getDate() - ((target.getDay() + 6) % 7) + weekday - 1)
  return localDate(target)
}
export function dateLabel(date: string): string { return parseDate(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
export function fullName(patient: Identity): string { return [patient.lastName, patient.firstName].filter(Boolean).join(' ') }
export function moodSigns(mood: Mood): string { return mood === null || mood === 0 ? '' : (mood > 0 ? '+' : '-').repeat(Math.abs(mood)) }
export function hasTrace(entry: Entry): boolean { return entry.session !== null || entry.note.trim() !== '' }
export function toggleSession(current: SessionType, next: Exclude<SessionType, null>): SessionType { return current === next ? null : next }
export function toggleLetter(value: string, letter: string): string {
  const letters = new Set(value.toUpperCase().split('').filter(char => (WEEKDAY_LETTERS as readonly string[]).includes(char)))
  if (letters.has(letter)) letters.delete(letter); else letters.add(letter)
  return WEEKDAY_LETTERS.filter(char => letters.has(char)).join('')
}
export function toggleDate(dates: string[], date: string): string[] { return dates.includes(date) ? dates.filter(value => value !== date) : [...dates, date].sort() }
export function lastFollowUp(care: Pick<PatientCare, 'evalDates' | 'transDates'>): string | null { return [...care.evalDates, ...care.transDates].sort().at(-1) ?? null }
export type FollowUpLevel = 'unknown' | 'recent' | 'month' | 'late' | 'overdue'
// Seuils NFR25 en jours : < 1 mois (30 j), 1 à 1,5 mois (45 j), 1,5 à 2 mois (60 j), au-delà.
export function followUpLevel(last: string | null, today: string): FollowUpLevel {
  if (!last) return 'unknown'
  const days = Math.round((parseDate(today).getTime() - parseDate(last).getTime()) / 86_400_000)
  return days < 30 ? 'recent' : days < 45 ? 'month' : days <= 60 ? 'late' : 'overdue'
}
