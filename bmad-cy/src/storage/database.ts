import Dexie, { type EntityTable } from 'dexie'
import type { Day, Patient } from '../domain/model'
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
  }
}
export const db = new TourDatabase()
