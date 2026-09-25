import { describe, expect, it } from 'vitest'
import { careDefaults, SEPARATORS, type Day, type Patient } from '../../domain/model'
import { buildBackup, parseBackup } from './backup'

const patient: Patient = { ...careDefaults(), id: 'p1', lastName: 'FICTIF', firstName: 'Alpha', room: '', priority: '', demo: false, archived: false, createdAt: '2026-09-01', transDates: ['2026-09-20'] }
const day: Day = { date: '2026-09-21', mood: 1, comment: 'calme', order: [...SEPARATORS, 'p1'], entries: { p1: { patient, session: 'A', note: 'essai' } } }
const data = { patients: [patient], days: [day], orders: [{ weekday: 1, order: [...SEPARATORS, 'p1'] }], settings: [{ key: 'initialized', value: 'yes' }] }

describe('sauvegarde complète', () => {
  it('relit exactement ce qu’elle a écrit', () => {
    const backup = parseBackup(buildBackup(data, '2026-09-25T10:00:00.000Z'))
    expect(backup).toMatchObject({ format: 'ma-tournee-sauvegarde', version: 1, createdAt: '2026-09-25T10:00:00.000Z', ...data })
  })

  it('complète les champs absents d’un patient plus ancien', () => {
    const legacy = JSON.parse(buildBackup(data, ''))
    legacy.patients = [{ id: 'p2', lastName: 'ESSAI' }]
    expect(parseBackup(JSON.stringify(legacy)).patients[0]).toMatchObject({ id: 'p2', firstName: '', ...careDefaults() })
  })

  it('refuse un fichier étranger, abîmé ou trop récent', () => {
    expect(() => parseBackup('pas du json')).toThrow('pas une sauvegarde')
    expect(() => parseBackup(JSON.stringify({ format: 'autre', version: 1 }))).toThrow('pas une sauvegarde')
    const broken = JSON.parse(buildBackup(data, ''))
    broken.days[0].date = '2026-02-30'
    expect(() => parseBackup(JSON.stringify(broken))).toThrow('pas une sauvegarde')
    expect(() => parseBackup(JSON.stringify({ ...JSON.parse(buildBackup(data, '')), version: 99 }))).toThrow('plus récente')
  })
})
