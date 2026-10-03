import { db, PRIVATE_SETTINGS, type OrderTemplate, type Setting, type TourDatabase } from './database'
import { applyOrder, careDefaults, hasTrace, identityKey, identityOf, localDate, parseDate, SEPARATORS, toggleDate, toggleSession, validDate, type Day, type Identity, type Mood, type Patient, type PatientCare } from '../domain/model'
export interface BackupData { patients: Patient[]; days: Day[]; orders: OrderTemplate[]; settings: Setting[] }
// GRP n’est pas importé : un patient déjà connu garde son réglage, un nouveau part sans groupe.
export type ImportedPatient = Pick<Identity, 'lastName' | 'firstName'> & Omit<PatientCare, 'group'>
type EditableField = 'lastName' | 'firstName' | 'room' | 'priority' | 'coverage' | 'days' | 'ifd' | 'pointed' | 'billed' | 'prescriptionEnd' | 'doctor' | 'rating' | 'group'
export class TourRepository {
  private database: TourDatabase
  private today: () => string
  constructor(database = db, today: () => string = localDate) { this.database = database; this.today = today }
  async initialize(): Promise<void> {
    await this.database.transaction('rw', this.database.settings, this.database.patients, async () => {
      if (await this.database.settings.get('initialized')) return
      const samples = [ ['Martin', 'Alice', '12'], ['Bernard', 'Louis', '18'], ['Petit', 'Jeanne', '24'], ['Robert', 'Paul', '31'] ]
      // Never seed a database that already contains user patients.
      if (await this.database.patients.count() === 0) await this.database.patients.bulkAdd(samples.map(([lastName, firstName, room]) => ({ ...careDefaults(), id: crypto.randomUUID(), lastName, firstName, room, priority: '', demo: true, archived: false, createdAt: localDate() })))
      await this.database.settings.put({ key: 'initialized', value: 'yes' })
    })
  }
  private async activePatients(): Promise<Patient[]> {
    return (await this.database.patients.toArray()).filter(p => !p.archived).sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'))
  }
  // Journée non enregistrée : patients actifs rangés selon le modèle du même jour de semaine, sous les repères.
  private async draftDay(date: string): Promise<Day> {
    const patients = await this.activePatients()
    const activeIds = new Set(patients.map(p => p.id))
    const template = await this.database.orders.get(parseDate(date).getDay())
    const order = template?.order.filter(id => SEPARATORS.includes(id) || activeIds.has(id)) ?? [...SEPARATORS]
    for (const separator of SEPARATORS) if (!order.includes(separator)) order.push(separator)
    for (const patient of patients) if (!order.includes(patient.id)) order.push(patient.id)
    return { date, entries: Object.fromEntries(patients.map(patient => [patient.id, { patient: identityOf(patient), session: null, note: '' }])), order, mood: null, comment: '' }
  }
  // Journée à afficher : celle enregistrée, sinon un brouillon qui ne sera écrit qu’à la première saisie.
  async dayView(date: string): Promise<Day> {
    if (!validDate(date)) throw new Error('Choisissez une date valide.')
    return (await this.database.days.get(date)) ?? this.draftDay(date)
  }
  // Prépare aujourd’hui et les jours futurs ; une journée passée n’est modifiée que par une saisie explicite.
  async ensureDay(date: string): Promise<void> {
    if (!validDate(date)) throw new Error('Choisissez une date valide.')
    if (date < this.today()) return
    await this.database.transaction('rw', this.database.days, this.database.patients, this.database.orders, async () => {
      const existing = await this.database.days.get(date)
      if (!existing) { await this.database.days.put(await this.draftDay(date)); return }
      const patients = await this.activePatients()
      const day = existing
      let changed = false
      for (const separator of SEPARATORS) if (!day.order.includes(separator)) { day.order.push(separator); changed = true }
      for (const patient of patients) {
        const entry = day.entries[patient.id]
        if (!entry) { day.entries[patient.id] = { patient: identityOf(patient), session: null, note: '' }; changed = true }
        else if (JSON.stringify(entry.patient) !== JSON.stringify(identityOf(patient))) { entry.patient = identityOf(patient); changed = true }
        if (!day.order.includes(patient.id)) { day.order.push(patient.id); changed = true }
      }
      const activeIds = new Set(patients.map(p => p.id))
      const filtered = day.order.filter(id => SEPARATORS.includes(id) || (day.entries[id] && (activeIds.has(id) || hasTrace(day.entries[id]))))
      if (filtered.length !== day.order.length) { day.order = filtered; changed = true }
      if (changed) await this.database.days.put(day)
    })
  }
  // Une fiche modifiée met à jour l’identité retenue par aujourd’hui et les jours futurs ; le passé garde la sienne.
  private async refreshSnapshots(patients: Patient[]): Promise<void> {
    const byId = new Map(patients.map(patient => [patient.id, identityOf(patient)]))
    await this.database.days.where('date').aboveOrEqual(this.today()).modify(day => {
      for (const [id, entry] of Object.entries(day.entries)) { const identity = byId.get(id); if (identity) entry.patient = identity }
    })
  }
  private async changeDay(date: string, update: (day: Day) => void): Promise<void> {
    if (!validDate(date)) throw new Error('Choisissez une date valide.')
    await this.database.transaction('rw', this.database.days, this.database.patients, this.database.orders, async () => {
      const day = (await this.database.days.get(date)) ?? await this.draftDay(date)
      update(day)
      await this.database.days.put(day)
    })
  }
  private entry(day: Day, id: string) {
    const entry = day.entries[id]
    if (!entry) throw new Error('Ce patient ne figure pas dans cette journée.')
    return entry
  }
  async setSession(date: string, id: string, session: 'A' | 'B'): Promise<void> { await this.changeDay(date, day => { const entry = this.entry(day, id); entry.session = toggleSession(entry.session, session) }) }
  async setNote(date: string, id: string, note: string): Promise<void> { await this.changeDay(date, day => { this.entry(day, id).note = note }) }
  async setBilan(date: string, id: string, bilan: string): Promise<void> { await this.changeDay(date, day => { this.entry(day, id).bilan = bilan }) }
  async setMood(date: string, mood: Mood): Promise<void> { await this.changeDay(date, day => { day.mood = mood }) }
  async setComment(date: string, comment: string): Promise<void> { await this.changeDay(date, day => { day.comment = comment }) }
  async reorder(date: string, order: string[]): Promise<void> {
    if (!validDate(date)) throw new Error('Choisissez une date valide.')
    await this.database.transaction('rw', this.database.days, this.database.patients, this.database.orders, async () => {
      const day = (await this.database.days.get(date)) ?? await this.draftDay(date)
      if (order.length !== day.order.length || new Set(order).size !== order.length || order.some(id => !day.order.includes(id))) throw new Error('L’ordre de la journée a changé. Réessayez.')
      day.order = order
      await this.database.days.put(day)
      const weekday = parseDate(date).getDay()
      await this.database.orders.put({ weekday, order })
      // Les journées suivantes du même jour de semaine déjà ouvertes à l’avance suivent le nouvel ordre ; les journées passées gardent le leur.
      await this.database.days.where('date').above(date).and(later => later.date >= this.today()).modify(later => {
        if (parseDate(later.date).getDay() === weekday) later.order = applyOrder(order, later.order)
      })
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
    await this.database.transaction('rw', this.database.patients, this.database.days, async () => {
      if (await this.database.patients.update(id, normalized) === 0) throw new Error('Ce patient n’existe plus.')
      const patient = await this.database.patients.get(id)
      if (patient) await this.refreshSnapshots([patient])
    })
  }
  async toggleFollowUp(id: string, kind: 'evalDates' | 'transDates', date: string): Promise<void> {
    await this.database.transaction('rw', this.database.patients, async () => {
      const patient = await this.database.patients.get(id)
      if (!patient) throw new Error('Ce patient n’existe plus.')
      await this.database.patients.put({ ...patient, [kind]: toggleDate(patient[kind] ?? [], date) })
    })
  }
  // Remplace la liste des patients. Un patient importé déjà connu (même nom et prénom) garde son identifiant,
  // donc son historique, son ordre et ses dates d’éval/trans ; les autres sont supprimés, les journées passées gardent leurs snapshots.
  async replacePatients(imported: ImportedPatient[]): Promise<void> {
    if (!imported.length || imported.some(patient => !patient.lastName.trim())) throw new Error('Import vide ou nom manquant.')
    await this.database.transaction('rw', this.database.patients, this.database.days, this.database.settings, async () => {
      const known = new Map<string, Patient[]>()
      for (const patient of (await this.database.patients.toArray()).sort((a, b) => Number(a.archived) - Number(b.archived))) known.set(identityKey(patient), [...known.get(identityKey(patient)) ?? [], patient])
      const merge = (a: string[], b: string[]) => [...new Set([...a, ...b])].sort()
      const patients = imported.map(input => {
        const patient: Partial<Patient> & ImportedPatient = { ...input, lastName: input.lastName.trim(), firstName: input.firstName.trim() }
        delete patient.group
        const match = known.get(identityKey(patient))?.shift()
        if (!match) return { ...careDefaults(), ...patient, id: crypto.randomUUID(), room: '', priority: '', demo: false, archived: false, createdAt: localDate() }
        return { ...match, ...patient, evalDates: merge(match.evalDates ?? [], patient.evalDates), transDates: merge(match.transDates ?? [], patient.transDates), demo: false, archived: false }
      })
      await this.database.patients.clear()
      await this.database.patients.bulkAdd(patients)
      await this.refreshSnapshots(patients)
      await this.database.settings.put({ key: 'initialized', value: 'yes' })
    })
  }
  async archivePatient(id: string, archived: boolean): Promise<void> { if (await this.database.patients.update(id, { archived }) === 0) throw new Error('Ce patient n’existe plus.') }
  async deletePatient(id: string): Promise<void> { await this.database.patients.delete(id) }
  async snapshot(): Promise<BackupData> {
    return this.database.transaction('r', this.database.patients, this.database.days, this.database.orders, this.database.settings, async () => ({
      patients: await this.database.patients.toArray(), days: await this.database.days.toArray(),
      orders: await this.database.orders.toArray(), settings: (await this.database.settings.toArray()).filter(item => !PRIVATE_SETTINGS.includes(item.key)),
    }))
  }
  // Restauration complète : remplace patients, journées, ordres et réglages ; jamais de réinjection des fictifs ensuite.
  // Les réglages propres à l’appareil (clé OpenRouter) sont conservés et ceux du fichier ignorés.
  async restore(data: BackupData): Promise<void> {
    await this.database.transaction('rw', this.database.patients, this.database.days, this.database.orders, this.database.settings, async () => {
      const kept = (await this.database.settings.toArray()).filter(item => PRIVATE_SETTINGS.includes(item.key))
      await Promise.all([this.database.patients.clear(), this.database.days.clear(), this.database.orders.clear(), this.database.settings.clear()])
      await this.database.patients.bulkPut(data.patients)
      await this.database.days.bulkPut(data.days)
      await this.database.orders.bulkPut(data.orders)
      await this.database.settings.bulkPut([...data.settings.filter(item => item.key !== 'initialized' && !PRIVATE_SETTINGS.includes(item.key)), ...kept, { key: 'initialized', value: 'yes' }])
    })
  }
  async setSetting(key: string, value: string): Promise<void> { await this.database.settings.put({ key, value }) }
  async deleteSetting(key: string): Promise<void> { await this.database.settings.delete(key) }
  async daysBetween(start: string, end: string): Promise<Day[]> {
    if (!validDate(start) || !validDate(end) || start > end) throw new Error('La date de début doit précéder ou être égale à la date de fin.')
    return this.database.days.where('date').between(start, end, true, true).toArray()
  }
}
export const repository = new TourRepository()
