import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { careDefaults, SEPARATORS } from '../domain/model'
import { TourDatabase } from './database'
import { TourRepository } from './repository'

describe('stockage local', () => {
  let database: TourDatabase
  let repository: TourRepository

  beforeEach(() => {
    database = new TourDatabase(`test-tournee-${crypto.randomUUID()}`)
    repository = new TourRepository(database)
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
})
