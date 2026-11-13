import { COVERAGES, effectivePrescriptionEnd, parseDate, prescriptionStatus, validDate, WEEKDAY_LETTERS, type Patient, type PrescriptionLevel } from './model'

// Vue « Tableau » des patients : prise en charge administrative de tous les patients actifs (ni archivés ni supprimés, pause comprise).

// Toutes les combinaisons de jours, dans l’ordre L, J, V, LJ, LV, JV, LJV.
export const LETTER_COMBOS: string[] = (() => {
  const combos: string[] = []
  for (let mask = 1; mask < 1 << WEEKDAY_LETTERS.length; mask++) combos.push(WEEKDAY_LETTERS.filter((_, index) => mask & (1 << index)).join(''))
  return combos.sort((a, b) => a.length - b.length)
})()

export function byName(a: Pick<Patient, 'lastName' | 'firstName'>, b: Pick<Patient, 'lastName' | 'firstName'>) {
  return a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
}

export function tablePatients<T extends Pick<Patient, 'archived' | 'lastName' | 'firstName'>>(patients: T[]): T[] {
  return patients.filter(patient => !patient.archived).sort(byName)
}

// Couverture : les valeurs connues, plus une valeur importée telle quelle.
export function coverageOptions(current: string): string[] {
  return current && !COVERAGES.includes(current) ? [...COVERAGES, current] : [...COVERAGES]
}

// Jours proposés dans le menu : les combinaisons, plus une valeur hors liste conservée telle quelle.
export function letterOptions(current: string): string[] {
  return current && !LETTER_COMBOS.includes(current) ? [...LETTER_COMBOS, current] : LETTER_COMBOS
}

export function ifdLabel(ifd: string): string { return ifd || 'non' }

// Fin d’ordonnance en JJ/MM/AA ; vide = —.
export function shortEndDate(date: string): string {
  if (!validDate(date)) return '—'
  return parseDate(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export interface TableEnd { text: string; level: PrescriptionLevel }
export function tableEnd(patient: Pick<Patient, 'prescriptionDate' | 'prescriptionDuration' | 'prescriptionUnit' | 'prescriptionEnd'>, today: string): TableEnd {
  const end = effectivePrescriptionEnd(patient)
  return { text: shortEndDate(end), level: prescriptionStatus(end, today).level }
}

export function billingTotals(patients: Pick<Patient, 'pointed' | 'billed'>[]): string {
  const total = patients.length
  return `${patients.filter(patient => patient.pointed).length}/${total} pointés · ${patients.filter(patient => patient.billed).length}/${total} facturés`
}
