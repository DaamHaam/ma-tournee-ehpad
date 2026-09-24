import { db, type TourDatabase } from './database'
import { hasTrace, localDate, parseDate, SEPARATORS, toggleSession, validDate, type Day, type Identity, type Mood, type Patient } from '../domain/model'
export class TourRepository {
  private database: TourDatabase
  constructor(database = db) { this.database = database }
  async initialize(): Promise<void> {
    await this.database.transaction('rw', this.database.settings, this.database.patients, async () => {
      if (await this.database.settings.get('initialized')) return
      const samples = [ ['Martin', 'Alice', '12'], ['Bernard', 'Louis', '18'], ['Petit', 'Jeanne', '24'], ['Robert', 'Paul', '31'] ]
      // Never seed a database that already contains user patients.
      if (await this.database.patients.count() === 0) await this.database.patients.bulkAdd(samples.map(([lastName, firstName, room]) => ({ id: crypto.randomUUID(), lastName, firstName, room, priority: '', demo: true, archived: false, createdAt: localDate() })))
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
    if (!input.lastName.trim() || !input.firstName.trim()) throw new Error('Le nom et le prénom sont obligatoires.')
    const id = crypto.randomUUID()
    await this.database.patients.add({ ...input, lastName: input.lastName.trim(), firstName: input.firstName.trim(), id, demo: false, archived: false, createdAt: localDate() })
    return id
  }
  async updatePatient(id: string, patch: Partial<Pick<Patient, 'lastName' | 'firstName' | 'room' | 'priority'>>): Promise<void> {
    if ((patch.lastName !== undefined && !patch.lastName.trim()) || (patch.firstName !== undefined && !patch.firstName.trim())) throw new Error('Le nom et le prénom sont obligatoires.')
    const normalized = Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, value?.trim()]))
    if (await this.database.patients.update(id, normalized) === 0) throw new Error('Ce patient n’existe plus.')
  }
  async archivePatient(id: string, archived: boolean): Promise<void> { if (await this.database.patients.update(id, { archived }) === 0) throw new Error('Ce patient n’existe plus.') }
  async deletePatient(id: string): Promise<void> { await this.database.patients.delete(id) }
  async daysBetween(start: string, end: string): Promise<Day[]> {
    if (!validDate(start) || !validDate(end) || start > end) throw new Error('La date de début doit précéder ou être égale à la date de fin.')
    return this.database.days.where('date').between(start, end, true, true).toArray()
  }
}
export const repository = new TourRepository()
