import { careDefaults, validDate, type Day, type Patient } from '../../domain/model'
import type { OrderTemplate, Setting } from '../../storage/database'
import type { BackupData } from '../../storage/repository'

// Format public de sauvegarde complète : ne changer qu'en incrémentant BACKUP_VERSION.
export const BACKUP_FORMAT = 'ma-tournee-sauvegarde'
export const BACKUP_VERSION = 1
export interface Backup extends BackupData { format: typeof BACKUP_FORMAT; version: number; createdAt: string }

export function buildBackup(data: BackupData, createdAt: string): string {
  const backup: Backup = { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt, ...data }
  return JSON.stringify(backup)
}

const INVALID = 'Ce fichier n’est pas une sauvegarde Ma tournée valide.'
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string'
const isStringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString)

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const PATIENT_TEXT = ['firstName', 'room', 'priority', 'createdAt', 'coverage', 'days', 'ifd', 'prescriptionEnd', 'doctor', 'rating'] as const
const PATIENT_FLAGS = ['demo', 'archived', 'pointed', 'billed', 'group'] as const

function checkPatient(value: unknown): Patient {
  if (!isObject(value) || !isString(value.id) || !isString(value.lastName)) throw new Error(INVALID)
  const patient = { ...careDefaults(), firstName: '', room: '', priority: '', demo: false, archived: false, createdAt: '', ...value } as Patient
  if (!isStringList(patient.evalDates) || !isStringList(patient.transDates)) throw new Error(INVALID)
  if (PATIENT_TEXT.some(key => !isString(patient[key])) || PATIENT_FLAGS.some(key => !isBoolean(patient[key]))) throw new Error(INVALID)
  return patient
}
// Identité retenue par une journée : le nom est exigé, les autres champs anciens ou absents sont complétés.
function checkSnapshot(value: unknown, id: string): Day['entries'][string]['patient'] {
  if (!isObject(value) || !isString(value.lastName)) throw new Error(INVALID)
  const snapshot = { id, firstName: '', room: '', priority: '', demo: false, ...value }
  if (!isString(snapshot.id) || !isString(snapshot.firstName) || !isString(snapshot.room) || !isString(snapshot.priority)) throw new Error(INVALID)
  return snapshot as Day['entries'][string]['patient']
}
function checkDay(value: unknown): Day {
  if (!isObject(value) || !isString(value.date) || !validDate(value.date) || !isObject(value.entries) || !isStringList(value.order)) throw new Error(INVALID)
  const entries: Day['entries'] = {}
  for (const [id, entry] of Object.entries(value.entries)) {
    if (!isObject(entry) || !isString(entry.note) || (entry.bilan !== undefined && !isString(entry.bilan)) || (entry.bilanAt !== undefined && !isString(entry.bilanAt)) || (entry.bilanCopied !== undefined && !isBoolean(entry.bilanCopied)) || !['A', 'B', null].includes(entry.session as string | null)) throw new Error(INVALID)
    entries[id] = { ...entry, patient: checkSnapshot(entry.patient, id) } as Day['entries'][string]
  }
  const day = { mood: null, comment: '', ...value, entries } as Day
  if (!isString(day.comment) || !(day.mood === null || [-3, -2, -1, 0, 1, 2, 3].includes(day.mood))) throw new Error(INVALID)
  return day
}
function checkOrder(value: unknown): OrderTemplate {
  if (!isObject(value) || typeof value.weekday !== 'number' || !isStringList(value.order)) throw new Error(INVALID)
  return value as unknown as OrderTemplate
}

export function parseBackup(text: string): Backup {
  let raw: unknown
  try { raw = JSON.parse(text) } catch { throw new Error(INVALID) }
  if (!isObject(raw) || raw.format !== BACKUP_FORMAT || typeof raw.version !== 'number') throw new Error(INVALID)
  if (raw.version > BACKUP_VERSION) throw new Error('Cette sauvegarde vient d’une version plus récente de l’application. Mettez l’application à jour.')
  if (!Array.isArray(raw.patients) || !Array.isArray(raw.days) || !Array.isArray(raw.orders) || !Array.isArray(raw.settings)) throw new Error(INVALID)
  return {
    format: BACKUP_FORMAT, version: raw.version, createdAt: isString(raw.createdAt) ? raw.createdAt : '',
    patients: raw.patients.map(checkPatient),
    days: raw.days.map(checkDay),
    orders: raw.orders.map(checkOrder),
    settings: raw.settings.filter((item): item is Setting => isObject(item) && isString(item.key) && isString(item.value)),
  }
}
