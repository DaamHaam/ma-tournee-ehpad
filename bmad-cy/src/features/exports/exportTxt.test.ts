import { describe, expect, it } from 'vitest'
import type { Day, Entry, Identity } from '../../domain/model'
import { exportTxt } from './exportTxt'

const identity = (id: string, lastName: string, firstName: string, room = ''): Identity => ({ id, lastName, firstName, room, priority: '', demo: false })
const entry = (patient: Identity, session: Entry['session'], note = ''): Entry => ({ patient, session, note })

describe('export TXT', () => {
  it('respecte l’ordre historisé, la casse A/B et les non-vus commentés', () => {
    const day: Day = { date: '2026-09-24', mood: 2, comment: 'matin calme', order: ['b', 'separator:1', 'a', 'c'], entries: {
      a: entry(identity('a', 'Martin', 'Alice'), 'A', 'marche'),
      b: entry(identity('b', 'Bernard', 'Louis'), 'B'),
      c: entry(identity('c', 'Petit', 'Jeanne'), null, 'absente'),
    } }
    expect(exportTxt([day])).toBe('24/09/2026\n++ matin calme\nbernard Martin (marche)\nPas vus : Petit (absente)')
  })

  it('différencie les homonymes et conserve un commentaire seul', () => {
    const day: Day = { date: '2026-09-25', mood: 0, comment: ' relève  ', order: ['a', 'b'], entries: {
      a: entry(identity('a', 'Martin', 'Alice'), 'A'),
      b: entry(identity('b', 'Martin', 'Anne'), 'B'),
    } }
    expect(exportTxt([day])).toContain('Martin_alice martin_anne')
    expect(exportTxt([day]).split('\n')[1]).toBe('relève')
  })

  it('ne fabrique aucune ligne H pour un niveau neutre', () => {
    const patient = identity('a', 'Martin', 'Alice')
    const empty: Day = { date: '2026-09-26', mood: 0, comment: '', order: ['a'], entries: { a: entry(patient, null) } }
    expect(exportTxt([empty])).toBe('26/09/2026')
  })

  it('n’exporte que le premier mot d’un nom composé', () => {
    const day: Day = { date: '2026-09-27', mood: null, comment: '', order: ['a', 'b', 'c', 'd'], entries: {
      a: entry(identity('a', 'EXEMPLE COMPOSE', 'Beta Gamma'), 'A'),
      b: entry(identity('b', 'Fictif', 'Alpha'), 'B'),
      c: entry(identity('c', 'Essai', 'Delta Epsilon'), 'A'),
      d: entry(identity('d', 'Essai', ''), 'B'),
    } }
    expect(exportTxt([day])).toBe('27/09/2026\nExemple fictif Essai_delta essai')
  })
})
