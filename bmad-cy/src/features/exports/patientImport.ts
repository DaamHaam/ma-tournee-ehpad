import { COVERAGES, validDate } from '../../domain/model'
import type { ImportedPatient } from '../../storage/repository'

// Colonnes lues par position ; l'en-tête éventuel et les colonnes en trop sont ignorés.
export const IMPORT_COLUMNS = ['nom', 'prenom', 'couverture', 'seances', 'ifd', 'pointe', 'facture', 'eval', 'trans', 'fin_ordo', 'medecin', 'cotation'] as const
export interface ImportResult { patients: ImportedPatient[]; errors: string[] }

const HEADER_WORDS = new Set(['nom', 'prenom', 'couverture', 'seances', 'fin_ordo', 'medecin', 'cotation'])
const TRUE_WORDS = new Set(['oui', 'true', 'vrai', '1', 'x', 'on'])
const FALSE_WORDS = new Set(['', 'non', 'false', 'faux', '0', 'off'])

function plain(value: string): string { return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim() }
function cell(value: string | undefined): string { return (value ?? '').trim().replace(/^"(.*)"$/s, '$1').replace(/""/g, '"').trim() }
function toDate(value: string): string | null {
  const french = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  const iso = french ? `${french[3]}-${french[2].padStart(2, '0')}-${french[1].padStart(2, '0')}` : value
  return validDate(iso) ? iso : null
}

export function parsePatientImport(text: string, today: string): ImportResult {
  const patients: ImportedPatient[] = []
  const errors: string[] = []
  text.split(/\r?\n/).forEach((line, index) => {
    if (!line.replace(/[\t;]/g, '').trim()) return
    const cells = line.split(line.includes('\t') ? '\t' : ';').map(cell)
    if (cells.some(value => HEADER_WORDS.has(plain(value)))) return
    const [lastName, firstName, coverage, days, ifd, pointed, billed, evaluation, transmission, prescriptionEnd, doctor, rating] = IMPORT_COLUMNS.map((_, column) => cells[column] ?? '')
    const lineErrors: string[] = []
    const flag = (value: string, label: string) => {
      if (TRUE_WORDS.has(plain(value))) return true
      if (!FALSE_WORDS.has(plain(value))) lineErrors.push(`${label} « ${value} » (oui/non attendu)`)
      return false
    }
    const followUp = (value: string, label: string) => {
      const date = toDate(value)
      if (date) return [date]
      return flag(value, label) ? [today] : []
    }
    if (!lastName) lineErrors.push('nom manquant')
    const end = prescriptionEnd ? toDate(prescriptionEnd) : ''
    const patient: ImportedPatient = {
      lastName, firstName,
      coverage: COVERAGES.find(option => plain(option) === plain(coverage)) ?? coverage,
      days: days.toUpperCase(),
      ifd: plain(ifd) === 'non' ? '' : ifd.toUpperCase(),
      pointed: flag(pointed, 'pointé'), billed: flag(billed, 'facturé'),
      evalDates: followUp(evaluation, 'éval'), transDates: followUp(transmission, 'trans'),
      prescriptionEnd: end ?? '', doctor, rating,
    }
    if (end === null) lineErrors.push(`date de fin d’ordonnance « ${prescriptionEnd} »`)
    if (lineErrors.length) errors.push(`Ligne ${index + 1} : ${lineErrors.join(', ')}.`)
    else patients.push(patient)
  })
  if (!patients.length && !errors.length) errors.push('Aucun patient trouvé.')
  return { patients, errors }
}
