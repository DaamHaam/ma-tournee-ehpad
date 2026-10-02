export type SessionType = 'A' | 'B' | null
export type Mood = -3 | -2 | -1 | 0 | 1 | 2 | 3 | null
export interface Identity { id: string; lastName: string; firstName: string; room: string; priority: string; demo: boolean }
export interface PatientCare { coverage: string; days: string; ifd: string; pointed: boolean; billed: boolean; evalDates: string[]; transDates: string[]; prescriptionEnd: string; doctor: string; rating: string; group: boolean }
export interface Patient extends Identity, PatientCare { archived: boolean; createdAt: string }
export const COVERAGES = ['ALD', 'Mutuelle', '100% invalidité']
export const WEEKDAY_LETTERS = ['L', 'J', 'V'] as const
export function careDefaults(): PatientCare { return { coverage: '', days: '', ifd: '', pointed: false, billed: false, evalDates: [], transDates: [], prescriptionEnd: '', doctor: '', rating: '', group: false } }
export interface Entry { patient: Identity; session: SessionType; note: string; bilan?: string }
export interface Day { date: string; entries: Record<string, Entry>; order: string[]; mood: Mood; comment: string }
// Le quatrième repère, rouge, sépare les patients sans séance prévue ce jour-là.
export const SEPARATORS = ['separator:1', 'separator:2', 'separator:3', 'separator:4']
export const OFF_DAY_SEPARATOR = 'separator:4'
export function shortName(patient: Identity): string { return [patient.lastName, patient.firstName.trim() && `${patient.firstName.trim()[0]}.`].filter(Boolean).join(' ') }
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
// Snapshot minimal gardé dans les journées : l'identité seule, sans les données de prise en charge.
export function identityOf(patient: Identity): Identity { return { id: patient.id, lastName: patient.lastName, firstName: patient.firstName, room: patient.room, priority: patient.priority, demo: patient.demo } }
// Clé de rapprochement « nom + prénom » insensible à la casse, aux accents et aux espaces superflus.
export function identityKey(patient: Pick<Identity, 'lastName' | 'firstName'>): string {
  const plain = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').replace(/\s+/g, ' ').trim()
  return `${plain(patient.lastName)}|${plain(patient.firstName)}`
}
export function hasTrace(entry: Entry): boolean { return entry.session !== null || entry.note.trim() !== '' || (entry.bilan ?? '').trim() !== '' }
// Range les éléments d’une journée selon un ordre modèle ; ceux que le modèle ignore gardent leur place relative, à la fin.
export function applyOrder(template: string[], current: string[]): string[] {
  const present = new Set(current)
  const ordered = template.filter(id => present.has(id))
  const placed = new Set(ordered)
  return [...ordered, ...current.filter(id => !placed.has(id))]
}
export function toggleSession(current: SessionType, next: Exclude<SessionType, null>): SessionType { return current === next ? null : next }
export function toggleLetter(value: string, letter: string): string {
  const letters = new Set(value.toUpperCase().split('').filter(char => (WEEKDAY_LETTERS as readonly string[]).includes(char)))
  if (letters.has(letter)) letters.delete(letter); else letters.add(letter)
  return WEEKDAY_LETTERS.filter(char => letters.has(char)).join('')
}
export function toggleDate(dates: string[], date: string): string[] { return dates.includes(date) ? dates.filter(value => value !== date) : [...dates, date].sort() }
export function lastFollowUp(care: Pick<PatientCare, 'evalDates' | 'transDates'>): string | null { return [...care.evalDates, ...care.transDates].sort().at(-1) ?? null }
function daysBetween(from: string, to: string): number { return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000) }
// Semaines entières écoulées depuis la dernière éval ou trans, affichées dans le triangle.
export function weeksSince(last: string | null, today: string): number | null { return last ? Math.max(0, Math.floor(daysBetween(last, today) / 7)) : null }
// Jours écoulés depuis la dernière séance A strictement antérieure à la journée affichée : cocher A ce jour-là ne change pas le chiffre.
export function daysSinceLastA(days: Pick<Day, 'date' | 'entries'>[], id: string, date: string): number | null {
  let last: string | null = null
  for (const day of days) if (day.date < date && day.entries[id]?.session === 'A' && (!last || day.date > last)) last = day.date
  return last ? daysBetween(last, date) : null
}
export type FollowUpLevel = 'unknown' | 'recent' | 'month' | 'late' | 'overdue'
// Seuils NFR25 en jours : < 1 mois (30 j), 1 à 1,5 mois (45 j), 1,5 à 2 mois (60 j), au-delà.
export function followUpLevel(last: string | null, today: string): FollowUpLevel {
  if (!last) return 'unknown'
  const days = daysBetween(last, today)
  return days < 30 ? 'recent' : days < 45 ? 'month' : days <= 60 ? 'late' : 'overdue'
}
// Un patient actif est toujours affiché ; archivé ou supprimé, il ne reste visible que là où une trace existe déjà, jamais sur une journée future.
export function entryVisible(entry: Entry, patient: Pick<Patient, 'archived'> | undefined, date: string, today: string): boolean {
  if (patient && !patient.archived) return true
  return date <= today && hasTrace(entry)
}
