import { db, type OrderTemplate, type Setting, type TourDatabase } from './database'
import { careDefaults, hasTrace, localDate, parseDate, SEPARATORS, toggleDate, toggleSession, validDate, type Day, type Identity, type Mood, type Patient, type PatientCare } from '../domain/model'
export interface BackupData { patients: Patient[]; days: Day[]; orders: OrderTemplate[]; settings: Setting[] }
export type ImportedPatient = Pick<Identity, 'lastName' | 'firstName'> & PatientCare
type EditableField = 'lastName' | 'firstName' | 'room' | 'priority' | 'coverage' | 'days' | 'ifd' | 'pointed' | 'billed' | 'prescriptionEnd' | 'doctor' | 'rating'
export class TourRepository {
  private database: TourDatabase
  constructor(database = db) { this.database = database }
  async initialize(): Promise<void> {
    await this.database.transaction('rw', this.database.settings, this.database.patients, async () => {
      if (await this.database.settings.get('initialized')) return
      const samples = [ ['Martin', 'Alice', '12'], ['Bernard', 'Louis', '18'], ['Petit', 'Jeanne', '24'], ['Robert', 'Paul', '31'] ]
      // Never seed a database that already contains user patients.
      if (await this.database.patients.count() === 0) await this.database.patients.bulkAdd(samples.map(([lastName, firstName, room]) => ({ ...careDefaults(), id: crypto.randomUUID(), lastName, firstName, room, priority: '', demo: true, archived: false, createdAt: localDate() })))
      await this.database.settings.put({ key: 'initialized', value: 'yes' })
    })
  }
  async ensureDay(date: string): Promise<void> {
    if (!validDate(date)) throw new Error('Choisissez une date valide.')
    await this.database.transaction('rw', this.database.days, this.database.patients, this.database.orders, async () => {
      const patients = (await this.database.patients.toArray()).filter(p => !p.archived).sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'))
      const existing = await this.database.days.get(date)
      const template = await this.database.orders.get(parseDate(date).getDay())
      const day: Day = existing ?? { date, entries: {}, order: template?.order.slice() ?? [...SEPARATORS], mood: null, comment: '' }
      let changed = !existing
      for (const patient of patients) {
        if (!day.entries[patient.id]) { day.entries[patient.id] = { patient: { ...patient }, session: null, note: '' }; changed = true }
        if (!day.order.includes(patient.id)) { day.order.push(patient.id); changed = true }
      }
      const activeIds = new Set(patients.map(p => p.id))
      const filtered = day.order.filter(id => SEPARATORS.includes(id) || (day.entries[id] && (activeIds.has(id) || hasTrace(day.entries[id]))))
      if (filtered.length !== day.order.length) { day.order = filtered; changed = true }
      if (changed) await this.database.days.put(day)
    })
  }
  private async changeDay(date: string, update: (day: Day) => void): Promise<void> {
    await this.database.transaction('rw', this.database.days, async () => {
      const day = await this.database.days.get(date)
      if (!day) throw new Error('Cette journée n’est pas encore chargée.')
      update(day)
      await this.database.days.put(day)
    })
  }
  async setSession(date: string, id: string, session: 'A' | 'B'): Promise<void> { await this.changeDay(date, day => { day.entries[id].session = toggleSession(day.entries[id].session, session) }) }
  async setNote(date: string, id: string, note: string): Promise<void> { await this.changeDay(date, day => { day.entries[id].note = note }) }
  async setMood(date: string, mood: Mood): Promise<void> { await this.changeDay(date, day => { day.mood = mood }) }
  async setComment(date: string, comment: string): Promise<void> { await this.changeDay(date, day => { day.comment = comment }) }
  async reorder(date: string, order: string[]): Promise<void> {
    await this.database.transaction('rw', this.database.days, this.database.orders, async () => {
      const day = await this.database.days.get(date)
      if (!day || order.length !== day.order.length || new Set(order).size !== order.length || order.some(id => !day.order.includes(id))) throw new Error('L’ordre de la journée a changé. Réessayez.')
      day.order = order
      await this.database.days.put(day)
      await this.database.orders.put({ weekday: parseDate(date).getDay(), order })
    })
  }
  async addPatient(input: Pick<Identity, 'lastName' | 'firstName' | 'room' | 'priority'>): Promise<string> {
    if (!input.lastName.trim()) throw new Error('Le nom est obligatoire.')
    const id = crypto.randomUUID()
    await this.database.patients.add({ ...careDefaults(), ...input, lastName: input.lastName.trim(), firstName: input.firstName.trim(), id, demo: false, archived: false, createdAt: localDate() })
    return id
  }
  async updatePatient(id: string, patch: Partial<Pick<Patient, EditableField>>): Promise<void> {
    if (patch.lastName !== undefined && !patch.lastName.trim()) throw new Error('Le nom est obligatoire.')
    if (patch.prescriptionEnd && !validDate(patch.prescriptionEnd)) throw new Error('Date de fin d’ordonnance invalide.')
    const normalized = Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])) as Partial<Patient>
    if (await this.database.patients.update(id, normalized) === 0) throw new Error('Ce patient n’existe plus.')
  }
  async toggleFollowUp(id: string, kind: 'evalDates' | 'transDates', date: string): Promise<void> {
    await this.database.transaction('rw', this.database.patients, async () => {
      const patient = await this.database.patients.get(id)
      if (!patient) throw new Error('Ce patient n’existe plus.')
      await this.database.patients.put({ ...patient, [kind]: toggleDate(patient[kind] ?? [], date) })
    })
  }
  // Remplace tous les patients ; les journées gardent leurs snapshots, l’ordre repart alphabétique sous les repères.
  async replacePatients(imported: ImportedPatient[]): Promise<void> {
    if (!imported.length || imported.some(patient => !patient.lastName.trim())) throw new Error('Import vide ou nom manquant.')
    await this.database.transaction('rw', this.database.patients, this.database.orders, this.database.settings, async () => {
      await this.database.patients.clear()
      await this.database.orders.clear()
      await this.database.patients.bulkAdd(imported.map(patient => ({ ...careDefaults(), ...patient, id: crypto.randomUUID(), room: '', priority: '', demo: false, archived: false, createdAt: localDate() })))
      await this.database.settings.put({ key: 'initialized', value: 'yes' })
    })
  }
  async archivePatient(id: string, archived: boolean): Promise<void> { if (await this.database.patients.update(id, { archived }) === 0) throw new Error('Ce patient n’existe plus.') }
  async deletePatient(id: string): Promise<void> { await this.database.patients.delete(id) }
  async snapshot(): Promise<BackupData> {
    return this.database.transaction('r', this.database.patients, this.database.days, this.database.orders, this.database.settings, async () => ({
      patients: await this.database.patients.toArray(), days: await this.database.days.toArray(),
      orders: await this.database.orders.toArray(), settings: await this.database.settings.toArray(),
    }))
  }
  // Restauration complète : remplace patients, journées, ordres et réglages ; jamais de réinjection des fictifs ensuite.
  async restore(data: BackupData): Promise<void> {
    await this.database.transaction('rw', this.database.patients, this.database.days, this.database.orders, this.database.settings, async () => {
      await Promise.all([this.database.patients.clear(), this.database.days.clear(), this.database.orders.clear(), this.database.settings.clear()])
      await this.database.patients.bulkPut(data.patients)
      await this.database.days.bulkPut(data.days)
      await this.database.orders.bulkPut(data.orders)
      await this.database.settings.bulkPut([...data.settings.filter(item => item.key !== 'initialized'), { key: 'initialized', value: 'yes' }])
    })
  }
  async setSetting(key: string, value: string): Promise<void> { await this.database.settings.put({ key, value }) }
  async daysBetween(start: string, end: string): Promise<Day[]> {
    if (!validDate(start) || !validDate(end) || start > end) throw new Error('La date de début doit précéder ou être égale à la date de fin.')
    return this.database.days.where('date').between(start, end, true, true).toArray()
  }
}
export const repository = new TourRepository()
