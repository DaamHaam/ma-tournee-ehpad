import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { careDefaults, SEPARATORS } from '../domain/model'
import { TourDatabase } from './database'
import { TourRepository } from './repository'
import { exportTxt } from '../features/exports/exportTxt'

// Date du jour figée : les journées des tests sont aujourd’hui ou futures, sauf mention contraire.
const TODAY = '2026-09-01'

describe('stockage local', () => {
  let database: TourDatabase
  let repository: TourRepository

  beforeEach(() => {
    database = new TourDatabase(`test-tournee-${crypto.randomUUID()}`)
    repository = new TourRepository(database, () => TODAY)
  })
  afterEach(async () => { database.close(); await database.delete() })

  it('ne charge les patients fictifs qu’une seule fois, même après suppression', async () => {
    await repository.initialize()
    const initial = await database.patients.toArray()
    expect(initial).toHaveLength(4)
    await repository.deletePatient(initial[0].id)
    await repository.initialize()
    expect(await database.patients.count()).toBe(3)
  })

  it('crée une journée neuve vide et conserve ses snapshots après suppression', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-09-24')
    const patient = (await database.patients.toArray())[0]
    await repository.setSession('2026-09-24', patient.id, 'A')
    await repository.setNote('2026-09-24', patient.id, 'trace passée')
    await repository.deletePatient(patient.id)
    const day = await database.days.get('2026-09-24')
    expect(day?.entries[patient.id].patient.lastName).toBe(patient.lastName)
    expect(day?.entries[patient.id].session).toBe('A')
    expect(day?.order).toContain(patient.id)
    await repository.ensureDay('2026-09-25')
    expect((await database.days.get('2026-09-25'))?.entries[patient.id]).toBeUndefined()
  })

  it('persiste l’ordre comme modèle du même jour de semaine sans modifier l’ancien', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-09-24')
    const first = await database.days.get('2026-09-24')
    const reordered = [...first!.order].reverse()
    await repository.reorder('2026-09-24', reordered)
    await repository.ensureDay('2026-10-01')
    expect((await database.days.get('2026-09-24'))?.order).toEqual(reordered)
    expect((await database.days.get('2026-10-01'))?.order).toEqual(reordered)
    expect(reordered).toEqual(expect.arrayContaining(SEPARATORS))
  })

  it('refuse une plage inversée', async () => {
    await expect(repository.daysBetween('2026-10-01', '2026-09-01')).rejects.toThrow('date de début')
  })

  it('remplace les patients par un import sans toucher aux journées passées', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-09-24')
    const old = (await database.patients.toArray())[0]
    await repository.setSession('2026-09-24', old.id, 'A')
    await repository.replacePatients([{ ...careDefaults(), lastName: 'FICTIF', firstName: '', days: 'LV' }])
    const patients = await database.patients.toArray()
    expect(patients).toHaveLength(1)
    expect(patients[0]).toMatchObject({ lastName: 'FICTIF', days: 'LV', demo: false, archived: false })
    expect((await database.days.get('2026-09-24'))?.entries[old.id]).toMatchObject({ session: 'A', patient: { lastName: old.lastName } })
    expect(await database.orders.count()).toBe(0)
    await repository.initialize()
    expect(await database.patients.count()).toBe(1)
    await repository.ensureDay('2026-10-01')
    expect((await database.days.get('2026-10-01'))?.order).toEqual([...SEPARATORS, patients[0].id])
  })

  it('coche et décoche la trans du jour en conservant la précédente', async () => {
    const id = await repository.addPatient({ lastName: 'FICTIF', firstName: '', room: '', priority: '' })
    await repository.toggleFollowUp(id, 'transDates', '2026-09-01')
    await repository.toggleFollowUp(id, 'transDates', '2026-09-25')
    await repository.toggleFollowUp(id, 'transDates', '2026-09-25')
    expect((await database.patients.get(id))?.transDates).toEqual(['2026-09-01'])
  })

  it('migre une base v1 en ajoutant les champs de prise en charge', async () => {
    const name = `test-migration-${crypto.randomUUID()}`
    const legacy = new Dexie(name)
    legacy.version(1).stores({ patients: 'id, lastName', days: 'date', orders: 'weekday', settings: 'key' })
    await legacy.table('patients').add({ id: 'p1', lastName: 'Fictif', firstName: 'Alpha', room: '3', priority: '', demo: false, archived: false, createdAt: '2026-09-01' })
    legacy.close()
    const migrated = new TourDatabase(name)
    expect(await migrated.patients.get('p1')).toMatchObject({ lastName: 'Fictif', room: '3', ...careDefaults() })
    migrated.close(); await migrated.delete()
  })

  it('restaure une sauvegarde à l’identique et sans réinjecter les fictifs', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-09-21')
    const [first] = await database.patients.toArray()
    await repository.setSession('2026-09-21', first.id, 'B')
    await repository.setNote('2026-09-21', first.id, 'essai')
    const saved = await repository.snapshot()
    const other = new TourDatabase(`test-restore-${crypto.randomUUID()}`)
    const target = new TourRepository(other)
    await target.initialize()
    await target.restore(saved)
    expect(await target.snapshot()).toEqual({ ...saved, settings: expect.arrayContaining(saved.settings) })
    await target.initialize()
    expect(await other.patients.count()).toBe(saved.patients.length)
    expect((await other.days.get('2026-09-21'))?.entries[first.id]).toMatchObject({ session: 'B', note: 'essai' })
    other.close(); await other.delete()
  })

  it('ajoute le repère rouge aux ordres enregistrés avec trois repères', async () => {
    await repository.initialize()
    await database.orders.put({ weekday: 1, order: ['separator:1', 'separator:2', 'separator:3'] })
    await repository.ensureDay('2026-10-05')
    const day = await database.days.get('2026-10-05')
    expect(day?.order.slice(0, 4)).toEqual(SEPARATORS)
    expect(day?.order).toHaveLength(8)
  })
  it('ne crée ni ne modifie une journée passée simplement consultée', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-08-20')
    expect(await database.days.get('2026-08-20')).toBeUndefined()
    const draft = await repository.dayView('2026-08-20')
    expect(Object.keys(draft.entries)).toHaveLength(4)
    const [first] = await database.patients.toArray()
    await repository.setSession('2026-08-20', first.id, 'A')
    await repository.addPatient({ lastName: 'Nouveau', firstName: '', room: '', priority: '' })
    await repository.ensureDay('2026-08-20')
    const day = await database.days.get('2026-08-20')
    expect(Object.keys(day!.entries)).toHaveLength(4)
    expect(day!.entries[first.id].session).toBe('A')
  })

  it('garde dans les journées une identité minimale, mise à jour à partir d’aujourd’hui seulement', async () => {
    await repository.initialize()
    const [first] = await database.patients.toArray()
    await repository.setSession('2026-08-31', first.id, 'A')
    await repository.ensureDay(TODAY)
    await repository.ensureDay('2026-09-03')
    expect(Object.keys((await database.days.get(TODAY))!.entries[first.id].patient).sort()).toEqual(['demo', 'firstName', 'id', 'lastName', 'priority', 'room'])
    await repository.updatePatient(first.id, { lastName: 'Renommé' })
    expect((await database.days.get('2026-08-31'))!.entries[first.id].patient.lastName).toBe(first.lastName)
    expect((await database.days.get(TODAY))!.entries[first.id].patient.lastName).toBe('Renommé')
    expect((await database.days.get('2026-09-03'))!.entries[first.id].patient.lastName).toBe('Renommé')
  })

  it('remplace l’ancienne copie complète d’un patient par son identité à l’ouverture du jour', async () => {
    await repository.initialize()
    const [first] = await database.patients.toArray()
    await repository.ensureDay(TODAY)
    const day = (await database.days.get(TODAY))!
    day.entries[first.id].patient = { ...first }
    await database.days.put(day)
    await repository.ensureDay(TODAY)
    expect((await database.days.get(TODAY))!.entries[first.id].patient).not.toHaveProperty('evalDates')
  })

  it('reconnaît à l’import un patient déjà connu et n’en crée pas de doublon dans la journée', async () => {
    await repository.initialize()
    const martin = (await database.patients.toArray()).find(patient => patient.lastName === 'Martin')!
    await repository.toggleFollowUp(martin.id, 'evalDates', '2026-08-15')
    await repository.ensureDay(TODAY)
    await repository.setSession(TODAY, martin.id, 'A')
    await repository.replacePatients([{ ...careDefaults(), lastName: 'MARTIN', firstName: 'alice', evalDates: ['2026-08-30'] }, { ...careDefaults(), lastName: 'Fictif', firstName: 'Zoé' }])
    const patients = await database.patients.toArray()
    expect(patients).toHaveLength(2)
    expect(patients.find(patient => patient.id === martin.id)).toMatchObject({ lastName: 'MARTIN', room: martin.room, evalDates: ['2026-08-15', '2026-08-30'] })
    await repository.ensureDay(TODAY)
    expect(exportTxt(await repository.daysBetween(TODAY, TODAY))).toBe('01/09/2026\nMartin')
  })

  it('migre une base v2 en désactivant le groupe des patients existants', async () => {
    const name = `test-migration-v3-${crypto.randomUUID()}`
    const legacy = new Dexie(name)
    legacy.version(2).stores({ patients: 'id, lastName', days: 'date', orders: 'weekday', settings: 'key' })
    const { group: _ignored, ...v2Care } = careDefaults()
    void _ignored
    await legacy.table('patients').add({ ...v2Care, id: 'p1', lastName: 'Fictif', firstName: 'Beta', room: '', priority: '', demo: false, archived: false, createdAt: '2026-09-01', days: 'LV' })
    legacy.close()
    const migrated = new TourDatabase(name)
    expect(await migrated.patients.get('p1')).toMatchObject({ lastName: 'Fictif', days: 'LV', group: false })
    migrated.close(); await migrated.delete()
  })

  it('garde le réglage GRP d’un patient reconnu à l’import', async () => {
    await repository.initialize()
    const martin = (await database.patients.toArray()).find(patient => patient.lastName === 'Martin')!
    await repository.updatePatient(martin.id, { group: true })
    await repository.replacePatients([{ ...careDefaults(), lastName: 'Martin', firstName: 'Alice' }, { ...careDefaults(), lastName: 'Fictif', firstName: 'Zoé' }])
    const patients = await database.patients.toArray()
    expect(patients.find(patient => patient.id === martin.id)?.group).toBe(true)
    expect(patients.find(patient => patient.lastName === 'Fictif')?.group).toBe(false)
  })

  it('applique un nouvel ordre aux journées suivantes du même jour déjà ouvertes, pas aux autres jours', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-09-08')
    await repository.ensureDay('2026-09-15')
    await repository.ensureDay('2026-09-10')
    const thursday = (await database.days.get('2026-09-10'))!.order
    const reordered = [...(await database.days.get('2026-09-08'))!.order].reverse()
    await repository.reorder('2026-09-08', reordered)
    expect((await database.days.get('2026-09-15'))?.order).toEqual(reordered)
    expect((await database.days.get('2026-09-10'))?.order).toEqual(thursday)
    expect((await repository.dayView('2026-09-22')).order).toEqual(reordered)
  })

  it('réordonner une journée passée ne modifie pas l’ordre des journées passées suivantes', async () => {
    let now = TODAY
    const local = new TourRepository(database, () => now)
    await local.initialize()
    for (const date of ['2026-09-08', '2026-09-15', '2026-09-22']) await local.ensureDay(date)
    const past = (await database.days.get('2026-09-15'))!.order
    now = '2026-09-20'
    const reordered = [...(await database.days.get('2026-09-08'))!.order].reverse()
    await local.reorder('2026-09-08', reordered)
    expect((await database.days.get('2026-09-15'))?.order).toEqual(past)
    expect((await database.days.get('2026-09-22'))?.order).toEqual(reordered)
  })
})
