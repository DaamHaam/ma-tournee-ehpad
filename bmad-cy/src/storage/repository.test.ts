import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SEPARATORS } from '../domain/model'
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
})
