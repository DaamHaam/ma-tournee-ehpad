// Suivi des tests NS (chiffrage recopié dans NetSoin) par résident : date du dernier, retard au-delà de 3 mois,
// filtre de la liste des résidents (avec la priorité, ex. groupes 1, 2, 3).
import { parseDate } from './model'

export const NS_DELAY_DAYS = 91
export type NsFilter = 'tous' | 'jamais' | 'retard' | 'ajour'
export const NS_FILTER_LABEL: Record<NsFilter, string> = { tous: 'Tous', jamais: 'Jamais fait', retard: 'Plus de 3 mois ou jamais', ajour: 'Moins de 3 mois' }
export function lastNs(patient: { nsDates?: string[] }): string | undefined { return [...(patient.nsDates ?? [])].sort().at(-1) }
export function nsLate(patient: { nsDates?: string[] }, today: string): boolean {
  const last = lastNs(patient)
  return !last || (parseDate(today).getTime() - parseDate(last).getTime()) / 86_400_000 > NS_DELAY_DAYS
}
export function matchesNs(patient: { nsDates?: string[] }, filter: NsFilter, today: string): boolean {
  if (filter === 'jamais') return !lastNs(patient)
  if (filter === 'retard') return nsLate(patient, today)
  if (filter === 'ajour') return !nsLate(patient, today)
  return true
}
