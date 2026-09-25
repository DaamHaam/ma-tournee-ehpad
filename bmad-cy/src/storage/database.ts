import Dexie, { type EntityTable } from 'dexie'
import { careDefaults, type Day, type Patient } from '../domain/model'
export interface OrderTemplate { weekday: number; order: string[] }
export interface Setting { key: string; value: string }
export class TourDatabase extends Dexie {
  patients!: EntityTable<Patient, 'id'>
  days!: EntityTable<Day, 'date'>
  orders!: EntityTable<OrderTemplate, 'weekday'>
  settings!: EntityTable<Setting, 'key'>
  constructor(name = 'bmad-cy-tournee') {
    super(name)
    this.version(1).stores({ patients: 'id, lastName', days: 'date', orders: 'weekday', settings: 'key' })
    // v2 : champs de prise en charge (couverture, séances, IFD, suivi, ordonnance…) avec valeurs vides par défaut.
    this.version(2).stores({ patients: 'id, lastName', days: 'date', orders: 'weekday', settings: 'key' }).upgrade(tx => tx.table('patients').toCollection().modify((patient: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(careDefaults())) if (patient[key] === undefined) patient[key] = value
    }))
  }
}
export const db = new TourDatabase()
