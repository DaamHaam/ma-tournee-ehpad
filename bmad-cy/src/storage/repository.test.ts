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

  it('migre une base v4 : « attend une séance » désactivé pour les patients existants', async () => {
    const name = `test-migration-v5-${crypto.randomUUID()}`
    const legacy = new Dexie(name)
    legacy.version(4).stores({ patients: 'id, lastName', days: 'date', orders: 'weekday', settings: 'key' })
    const { waiting: _ignored, ...v4Care } = careDefaults()
    void _ignored
    await legacy.table('patients').add({ ...v4Care, id: 'p1', lastName: 'Fictif', firstName: 'Gamma', room: '', priority: '', demo: false, archived: false, createdAt: '2026-09-01', group: true })
    legacy.close()
    const migrated = new TourDatabase(name)
    expect(await migrated.patients.get('p1')).toMatchObject({ lastName: 'Fictif', group: true, waiting: false })
    migrated.close(); await migrated.delete()
  })

  it('l’import garde l’attente d’un patient reconnu, un nouveau patient n’attend pas', async () => {
    await repository.initialize()
    const martin = (await database.patients.toArray()).find(patient => patient.lastName === 'Martin')!
    await repository.updatePatient(martin.id, { waiting: true })
    await repository.replacePatients([{ ...careDefaults(), lastName: 'Martin', firstName: 'Alice' }, { ...careDefaults(), waiting: true, lastName: 'Fictif', firstName: 'Zoé' } as never])
    const patients = await database.patients.toArray()
    expect(patients.find(patient => patient.id === martin.id)?.waiting).toBe(true)
    expect(patients.find(patient => patient.lastName === 'Fictif')?.waiting).toBe(false)
  })

  it('migre une base v5 : prescription vide, fin d’ordonnance existante conservée', async () => {
    const name = `test-migration-v6-${crypto.randomUUID()}`
    const legacy = new Dexie(name)
    legacy.version(5).stores({ patients: 'id, lastName', days: 'date', orders: 'weekday', settings: 'key' })
    const { prescriptionLabel: _a, prescriptionDate: _b, prescriptionDuration: _c, prescriptionUnit: _d, ...v5Care } = careDefaults()
    void [_a, _b, _c, _d]
    await legacy.table('patients').add({ ...v5Care, id: 'p1', lastName: 'Fictif', firstName: 'Delta', room: '', priority: '', demo: false, archived: false, createdAt: '2026-09-01', prescriptionEnd: '2026-12-15', waiting: true })
    legacy.close()
    const migrated = new TourDatabase(name)
    expect(await migrated.patients.get('p1')).toMatchObject({ waiting: true, prescriptionEnd: '2026-12-15', prescriptionLabel: '', prescriptionDate: '', prescriptionDuration: null, prescriptionUnit: 'months' })
    migrated.close(); await migrated.delete()
  })

  it('calcule la fin de prescription dès que la date est connue (1 an sans durée), sinon la laisse saisissable', async () => {
    const id = await repository.addPatient({ lastName: 'Fictif', firstName: 'Epsilon', room: '', priority: '' })
    await repository.updatePatient(id, { prescriptionEnd: '2026-11-30', prescriptionLabel: '  Rééducation à la marche ' })
    expect(await database.patients.get(id)).toMatchObject({ prescriptionEnd: '2026-11-30', prescriptionLabel: 'Rééducation à la marche' })
    await repository.updatePatient(id, { prescriptionDate: '2026-01-31' })
    expect((await database.patients.get(id))?.prescriptionEnd).toBe('2027-01-31')
    await repository.updatePatient(id, { prescriptionDuration: 1 })
    expect((await database.patients.get(id))?.prescriptionEnd).toBe('2026-02-28')
    await repository.updatePatient(id, { prescriptionUnit: 'weeks' })
    expect((await database.patients.get(id))?.prescriptionEnd).toBe('2026-02-07')
    await repository.updatePatient(id, { prescriptionUnit: 'years', prescriptionDuration: 2 })
    expect((await database.patients.get(id))?.prescriptionEnd).toBe('2028-01-31')
    await repository.updatePatient(id, { prescriptionDuration: null })
    expect((await database.patients.get(id))?.prescriptionEnd).toBe('2027-01-31')
    await repository.updatePatient(id, { prescriptionDate: '' })
    expect((await database.patients.get(id))?.prescriptionEnd).toBe('2027-01-31')
    await repository.updatePatient(id, { prescriptionEnd: '2026-03-01' })
    expect((await database.patients.get(id))?.prescriptionEnd).toBe('2026-03-01')
    await expect(repository.updatePatient(id, { prescriptionDuration: 0 })).rejects.toThrow('Durée')
    await expect(repository.updatePatient(id, { prescriptionDate: '2026-02-30' })).rejects.toThrow('Date de prescription')
  })

  it('migre une base v6 : une prescription datée sans durée finit 1 an plus tard', async () => {
    const name = `test-migration-v7-${crypto.randomUUID()}`
    const legacy = new Dexie(name)
    legacy.version(6).stores({ patients: 'id, lastName', days: 'date', orders: 'weekday', settings: 'key' })
    const base = { ...careDefaults(), firstName: 'Zêta', room: '', priority: '', demo: false, archived: false, createdAt: '2026-09-01' }
    await legacy.table('patients').bulkAdd([
      { ...base, id: 'p1', lastName: 'Fictif', prescriptionDate: '2026-10-01', prescriptionEnd: '' },
      { ...base, id: 'p2', lastName: 'Essai', prescriptionEnd: '2026-12-15' },
    ])
    legacy.close()
    const migrated = new TourDatabase(name)
    expect((await migrated.patients.get('p1'))?.prescriptionEnd).toBe('2027-10-01')
    expect((await migrated.patients.get('p2'))?.prescriptionEnd).toBe('2026-12-15')
    migrated.close(); await migrated.delete()
  })

  it('l’import garde la prescription d’un patient reconnu ; sa fin calculée l’emporte sur la fin importée', async () => {
    await repository.initialize()
    const all = await database.patients.toArray()
    const martin = all.find(patient => patient.lastName === 'Martin')!
    const petit = all.find(patient => patient.lastName === 'Petit')!
    await repository.updatePatient(martin.id, { prescriptionLabel: 'Marche', prescriptionDate: '2026-09-01', prescriptionDuration: 2 })
    await repository.updatePatient(petit.id, { prescriptionLabel: 'Équilibre' })
    await repository.replacePatients([
      { ...careDefaults(), lastName: 'Martin', firstName: 'Alice', prescriptionEnd: '2027-01-01' },
      { ...careDefaults(), lastName: 'Petit', firstName: 'Jeanne', prescriptionEnd: '2027-01-01' },
      { ...careDefaults(), lastName: 'Fictif', firstName: 'Zoé', prescriptionEnd: '2027-02-01' },
    ])
    const patients = await database.patients.toArray()
    expect(patients.find(patient => patient.id === martin.id)).toMatchObject({ prescriptionLabel: 'Marche', prescriptionDuration: 2, prescriptionEnd: '2026-11-01' })
    expect(patients.find(patient => patient.id === petit.id)).toMatchObject({ prescriptionLabel: 'Équilibre', prescriptionEnd: '2027-01-01' })
    expect(patients.find(patient => patient.lastName === 'Fictif')).toMatchObject({ prescriptionLabel: '', prescriptionDate: '', prescriptionEnd: '2027-02-01' })
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

  it('date le bilan à sa première saisie, le décoche s’il change, le supprime', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-09-08')
    const [alice] = (await database.patients.toArray()).filter(patient => patient.lastName === 'Martin')
    await repository.setBilan('2026-09-08', alice.id, 'Début', undefined, '2026-09-08T09:00:00Z')
    await repository.setBilan('2026-09-08', alice.id, 'Début suite', '<b>Début</b> suite', '2026-09-08T09:30:00Z')
    expect((await database.days.get('2026-09-08'))?.entries[alice.id]).toMatchObject({ bilan: 'Début suite', bilanHtml: '<b>Début</b> suite', bilanAt: '2026-09-08T09:00:00Z' })
    await repository.markBilanCopied('2026-09-08', alice.id)
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].bilanCopied).toBe(true)
    expect((await database.patients.get(alice.id))?.transDates).toEqual([TODAY])
    await repository.markBilanCopied('2026-09-08', alice.id)
    expect((await database.patients.get(alice.id))?.transDates).toEqual([TODAY])
    await repository.setBilan('2026-09-08', alice.id, 'Début suite modifiée')
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].bilanCopied).toBeUndefined()
    await repository.deleteBilan('2026-09-08', alice.id)
    const entry = (await database.days.get('2026-09-08'))?.entries[alice.id]
    expect(entry?.bilan).toBe('')
    expect(entry?.bilanAt).toBeUndefined()
    expect(entry?.bilanHtml).toBeUndefined()
    await expect(repository.markBilanCopied('2026-09-08', alice.id)).rejects.toThrow('Ce bilan n’existe plus.')
  })

  it('enregistre un Tinetti, le copie comme évaluation, l’annule ou le supprime', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-09-08')
    const [alice] = (await database.patients.toArray()).filter(patient => patient.lastName === 'Martin')
    await repository.setTest('2026-09-08', alice.id, 'tinetti', { scores: { e1: 1 } }, '2026-09-08T10:00:00Z')
    await repository.setTest('2026-09-08', alice.id, 'tinetti', { notes: 'Marche lente', notesHtml: '<b>Marche</b> lente' }, '2026-09-08T10:05:00Z')
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].tests?.tinetti).toEqual({ scores: { e1: 1 }, notes: 'Marche lente', notesHtml: '<b>Marche</b> lente', at: '2026-09-08T10:00:00Z' })
    await repository.setTest('2026-09-08', alice.id, 'tinetti', { resultHtml: '<b>Tinetti</b> 1/28' })
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].tests?.tinetti?.resultHtml).toBe('<b>Tinetti</b> 1/28')
    await repository.markTestCopied('2026-09-08', alice.id, 'tinetti')
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].tests?.tinetti?.copied).toBe(true)
    expect((await database.patients.get(alice.id))?.evalDates).toEqual([TODAY])
    expect((await database.patients.get(alice.id))?.transDates).toEqual([])
    await repository.setTest('2026-09-08', alice.id, 'tinetti', { scores: { e1: 0 } })
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].tests?.tinetti?.resultHtml).toBeUndefined()
    await repository.restoreTest('2026-09-08', alice.id, 'tinetti', undefined)
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].tests).toBeUndefined()
    await repository.setTest('2026-09-08', alice.id, 'tinetti', { scores: { e1: 0 } })
    await repository.setTest('2026-09-08', alice.id, 'tinetti', { scores: {} })
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].tests).toBeUndefined()
    await expect(repository.markTestCopied('2026-09-08', alice.id, 'tinetti')).rejects.toThrow('Ce test n’existe plus.')
  })

  it('annule un bilan en le remettant tel qu’à l’ouverture', async () => {
    await repository.initialize()
    await repository.ensureDay('2026-09-08')
    const [alice] = (await database.patients.toArray()).filter(patient => patient.lastName === 'Martin')
    await repository.setBilan('2026-09-08', alice.id, 'Avant', '<b>Avant</b>', '2026-09-08T09:00:00Z')
    await repository.markBilanCopied('2026-09-08', alice.id)
    const before = { ...(await database.days.get('2026-09-08'))!.entries[alice.id] }
    await repository.setBilan('2026-09-08', alice.id, 'Après')
    await repository.restoreBilan('2026-09-08', alice.id, { bilan: before.bilan, bilanHtml: before.bilanHtml, bilanAt: before.bilanAt, bilanCopied: before.bilanCopied })
    expect((await database.days.get('2026-09-08'))?.entries[alice.id]).toMatchObject({ bilan: 'Avant', bilanHtml: '<b>Avant</b>', bilanAt: '2026-09-08T09:00:00Z', bilanCopied: true })
    await repository.restoreBilan('2026-09-08', alice.id, {})
    expect((await database.days.get('2026-09-08'))?.entries[alice.id].bilan).toBeUndefined()
  })

  it('n’exporte pas la clé OpenRouter et la conserve lors d’une restauration', async () => {
    await repository.initialize()
    await repository.setSetting('openrouterKey', 'sk-or-secret')
    await repository.setSetting('transcriptionModel', 'openai/whisper-large-v3')
    const saved = await repository.snapshot()
    expect(JSON.stringify(saved)).not.toContain('sk-or-secret')
    expect(saved.settings).toContainEqual({ key: 'transcriptionModel', value: 'openai/whisper-large-v3' })
    await repository.setSetting('openrouterKey', 'sk-or-autre')
    await repository.restore({ ...saved, settings: [...saved.settings, { key: 'openrouterKey', value: 'sk-or-fichier' }] })
    expect((await database.settings.get('openrouterKey'))?.value).toBe('sk-or-autre')
    await repository.deleteSetting('openrouterKey')
    expect(await database.settings.get('openrouterKey')).toBeUndefined()
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
