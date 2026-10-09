import { hasTestContent, type TestRecord, type TestType } from './tinetti'
import { hasFlexContent } from './marcheEquilibre'
export type SessionType = 'A' | 'B' | null
export type Mood = -3 | -2 | -1 | 0 | 1 | 2 | 3 | null
export interface Identity { id: string; lastName: string; firstName: string; room: string; priority: string; demo: boolean }
// sex : F, H ou vide ; sert seulement aux accords du texte rédigé par l’IA (envoyé sans nom).
export type Sex = '' | 'F' | 'H'
// waiting : patient en attente d’une séance, signalé par un « ! » rouge devant son nom.
// Prescription en cours : intitulé, durée et fin facultatifs. Dès que la date est connue, prescriptionEnd en découle (durée absente = 1 an) ;
// sans date, la fin se saisit à la main.
export type DurationUnit = 'weeks' | 'months' | 'years'
export const DURATION_UNITS: DurationUnit[] = ['weeks', 'months', 'years']
export const DEFAULT_PRESCRIPTION = { amount: 1, unit: 'years' as DurationUnit }
export interface PatientCare { sex: Sex; coverage: string; days: string; ifd: string; pointed: boolean; billed: boolean; evalDates: string[]; transDates: string[]; prescriptionLabel: string; prescriptionDate: string; prescriptionDuration: number | null; prescriptionUnit: DurationUnit; prescriptionEnd: string; doctor: string; rating: string; group: boolean; waiting: boolean }
export interface Patient extends Identity, PatientCare { archived: boolean; createdAt: string }
export const COVERAGES = ['ALD', 'Mutuelle', '100% invalidité']
export const WEEKDAY_LETTERS = ['L', 'J', 'V'] as const
export function careDefaults(): PatientCare { return { sex: '', coverage: '', days: '', ifd: '', pointed: false, billed: false, evalDates: [], transDates: [], prescriptionLabel: '', prescriptionDate: '', prescriptionDuration: null, prescriptionUnit: 'months', prescriptionEnd: '', doctor: '', rating: '', group: false, waiting: false } }
// bilan : texte brut ; bilanHtml : même bilan mis en forme (gras, italique, souligné) ; bilanAt : heure de première saisie (ordre de l’onglet Bilans) ;
// bilanCopied : copié depuis la dernière modification.
// tests : tests standardisés du jour (un par type), avec cotations, texte dicté et état copié.
export interface Entry { patient: Identity; session: SessionType; note: string; bilan?: string; bilanHtml?: string; bilanAt?: string; bilanCopied?: boolean; tests?: Partial<Record<TestType, TestRecord>> }
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
export function hasTrace(entry: Entry): boolean { return entry.session !== null || entry.note.trim() !== '' || (entry.bilan ?? '').trim() !== '' || Object.values(entry.tests ?? {}).some(hasTestContent) }
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
// Date de la dernière séance A de chaque patient, strictement antérieure à la journée affichée : cocher A ce jour-là ne change pas le chiffre.
export function lastSessionsA(days: Pick<Day, 'date' | 'entries'>[], date: string): Map<string, string> {
  const last = new Map<string, string>()
  for (const day of days) {
    if (day.date >= date) continue
    for (const [id, entry] of Object.entries(day.entries)) if (entry.session === 'A' && day.date > (last.get(id) ?? '')) last.set(id, day.date)
  }
  return last
}
export function daysSince(last: string | undefined, date: string): number | null { return last ? daysBetween(last, date) : null }
// Jours écoulés depuis la dernière séance A antérieure à la journée affichée.
export function daysSinceLastA(days: Pick<Day, 'date' | 'entries'>[], id: string, date: string): number | null { return daysSince(lastSessionsA(days, date).get(id), date) }
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
// Bilans et tests d’une journée dans l’ordre où ils ont été commencés ; ceux sans heure (anciens) suivent l’ordre de la tournée.
export type BilanKind = 'bilan' | TestType
export interface DayBilan { id: string; kind: BilanKind; patient: Identity; text: string; html?: string; record?: TestRecord; copied: boolean; at?: string }
// Un bilan marche / équilibre ne se copie que par son compte rendu : sans formulaire rempli ni résultat retouché (dictée seule),
// il reste enregistré mais n’a rien à copier dans l’onglet Bilans.
function listedTest(kind: TestType, record: TestRecord): boolean {
  return kind === 'marcheEquilibre' ? hasFlexContent(record) || !!record.resultHtml?.trim() : hasTestContent(record)
}
export function dayBilans(day: Pick<Day, 'entries' | 'order'>): DayBilan[] {
  const rank = new Map(day.order.map((id, index) => [id, index]))
  const items: DayBilan[] = []
  for (const [id, entry] of Object.entries(day.entries)) {
    if ((entry.bilan ?? '').trim()) items.push({ id, kind: 'bilan', patient: entry.patient, text: entry.bilan!, html: entry.bilanHtml, copied: !!entry.bilanCopied, at: entry.bilanAt })
    for (const [kind, record] of Object.entries(entry.tests ?? {}) as [TestType, TestRecord][]) if (listedTest(kind, record)) items.push({ id, kind, patient: entry.patient, text: record.notes, html: record.notesHtml, record, copied: !!record.copied, at: record.at || undefined })
  }
  return items.sort((x, y) => (x.at ?? '\uffff').localeCompare(y.at ?? '\uffff') || (rank.get(x.id) ?? Infinity) - (rank.get(y.id) ?? Infinity) || x.kind.localeCompare(y.kind))
}
export function hasBilanOrTest(entry: Entry): boolean { return (entry.bilan ?? '').trim() !== '' || Object.values(entry.tests ?? {}).some(hasTestContent) }
// Fin de prescription : date + durée (1 an sans durée). En mois ou en années, le jour est ramené au dernier jour du mois s’il n’existe pas
// (31 janvier + 1 mois = 28 ou 29 février ; 29 février + 1 an = 28 février).
export function prescriptionEndDate(start: string, amount: number | null, unit: DurationUnit): string | null {
  if (!validDate(start)) return null
  if (amount === null) return prescriptionEndDate(start, DEFAULT_PRESCRIPTION.amount, DEFAULT_PRESCRIPTION.unit)
  if (!Number.isInteger(amount) || amount <= 0) return null
  if (unit === 'weeks') { const end = parseDate(start); end.setDate(end.getDate() + amount * 7); return localDate(end) }
  const [year, month, day] = start.split('-').map(Number)
  const total = month - 1 + (unit === 'years' ? amount * 12 : amount)
  const endYear = year + Math.floor(total / 12), endMonth = total % 12
  const lastDay = new Date(endYear, endMonth + 1, 0).getDate()
  return localDate(new Date(endYear, endMonth, Math.min(day, lastDay), 12))
}
// Fin calculée dès que la date de prescription est connue, sinon la fin saisie à la main.
export function effectivePrescriptionEnd(care: Pick<PatientCare, 'prescriptionDate' | 'prescriptionDuration' | 'prescriptionUnit' | 'prescriptionEnd'>): string {
  return prescriptionEndDate(care.prescriptionDate, care.prescriptionDuration, care.prescriptionUnit) ?? care.prescriptionEnd
}
// Surveillance : orange dans les 15 jours (fin du jour comprise), rouge une fois la fin dépassée.
export type PrescriptionLevel = 'none' | 'ok' | 'soon' | 'over'
export interface PrescriptionStatus { level: PrescriptionLevel; days: number | null }
export const PRESCRIPTION_WARNING_DAYS = 15
export function prescriptionStatus(end: string, today: string): PrescriptionStatus {
  if (!validDate(end)) return { level: 'none', days: null }
  const days = daysBetween(today, end)
  return { level: days < 0 ? 'over' : days <= PRESCRIPTION_WARNING_DAYS ? 'soon' : 'ok', days }
}
export function prescriptionText({ level, days }: PrescriptionStatus): string {
  if (level === 'none' || days === null) return ''
  return days < 0 ? `Terminée depuis ${-days} j` : days === 0 ? 'Fin aujourd’hui' : `Fin dans ${days} j`
}
