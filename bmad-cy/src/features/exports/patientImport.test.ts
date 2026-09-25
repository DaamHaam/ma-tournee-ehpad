import { describe, expect, it } from 'vitest'
import { parsePatientImport } from './patientImport'

const TODAY = '2026-09-25'
// Données fictives, collées comme depuis un tableur (tabulations), en-tête décalé et colonne « groupe » en trop.
const PASTED = [
  'prenom\tcouverture\tseances\tifd\tpointe\tfacture\teval\ttrans\tfin_ordo\tmedecin\tcotation\tgroupe',
  'FICTIF\tAlpha\tALD\tLJV\tnon\toui\toui\tnon\tnon\t19/05/2027\t\t\t1',
  '\t\t\t\t\t\t\t\t\t\t\t',
  'EXEMPLE COMPOSE\tBeta Gamma\tmutuelle\tLV\tLJ\tTRUE\tFALSE\toui\t\t07/11/2026\t?\tAMC 8,5 + AMC 8,5/2\t4',
  'ESSAI\t\t100% invalidité\tV\tnon\toui\toui\tnon\t12/09/2026\t30/09/2026\tDr Test\tRPE 8.5',
].join('\n')

describe('import patients par copier-coller', () => {
  it('lit les colonnes par position et ignore en-tête, lignes vides et colonnes en trop', () => {
    const { patients, errors } = parsePatientImport(PASTED, TODAY)
    expect(errors).toEqual([])
    expect(patients.map(p => p.lastName)).toEqual(['FICTIF', 'EXEMPLE COMPOSE', 'ESSAI'])
    expect(patients[0]).toMatchObject({ firstName: 'Alpha', coverage: 'ALD', days: 'LJV', ifd: '', pointed: true, billed: true, evalDates: [], transDates: [], prescriptionEnd: '2027-05-19', doctor: '', rating: '' })
    expect(patients[1]).toMatchObject({ firstName: 'Beta Gamma', coverage: 'Mutuelle', ifd: 'LJ', pointed: true, billed: false, evalDates: [TODAY], doctor: '?', rating: 'AMC 8,5 + AMC 8,5/2' })
    expect(patients[2]).toMatchObject({ firstName: '', coverage: '100% invalidité', transDates: ['2026-09-12'], prescriptionEnd: '2026-09-30' })
  })

  it('accepte le point-virgule et signale les valeurs illisibles avec leur ligne', () => {
    const { patients, errors } = parsePatientImport('FICTIF;Alpha;ALD;L;non;peut-être;oui;non;non;31/02/2027\n;Sans nom', TODAY)
    expect(patients).toEqual([])
    expect(errors[0]).toMatch(/^Ligne 1 : pointé « peut-être »/)
    expect(errors[0]).toContain('fin d’ordonnance « 31/02/2027 »')
    expect(errors[1]).toBe('Ligne 2 : nom manquant.')
  })

  it('refuse un texte sans patient', () => {
    expect(parsePatientImport('\n\t\t\n', TODAY).errors).toEqual(['Aucun patient trouvé.'])
  })
})
