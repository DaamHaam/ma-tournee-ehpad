import { describe, expect, it } from 'vitest'
import seed from './catalogSeed.json'
import { accord, buildReport, catalogFor, choiceKey, formHash, formLines, formMeasures, formPlan, formValues, latestCatalog, orderedRubrics, otherOf, parsePublished, registerCatalog, TEST_OF_RUBRIC, type BilanForm } from './catalog'
import { htmlToText } from '../features/bilan/richText'
import { latestMeasures } from './mesures'

const published = parsePublished(seed)!
registerCatalog(published)
const catalog = published.catalog
const form = (patch: Partial<BilanForm>): BilanForm => ({ version: 0, choices: [], values: {}, ...patch })
const text = (lines: string[]) => lines.map(line => htmlToText(line)).join('\n')

describe('catalogue publié', () => {
  it('lit la version embarquée et refuse ce qui ne ressemble pas à un catalogue', () => {
    expect(published.number).toBe(0)
    expect(catalog.prompts.map(prompt => prompt.key)).toContain('mise_en_forme')
    expect(parsePublished(null)).toBeNull()
    expect(parsePublished({ number: 2, publishedAt: 1, catalog: { domains: [] } })).toBeNull()
    expect(parsePublished({ number: 2, publishedAt: 1, catalog: { ...catalog, fields: [{ key: 'x' }] } })).toBeNull()
  })

  it('accepte un catalogue sans prompts (antérieur à leur ajout)', () => {
    const rest: Record<string, unknown> = { ...catalog }
    delete rest.prompts
    expect(parsePublished({ number: 1, publishedAt: 1, catalog: rest })?.catalog.prompts).toEqual([])
  })

  it('relit un bilan avec la version notée, sinon avec la plus récente', () => {
    const next = { number: 5, publishedAt: 2, catalog: { ...catalog, presets: [] } }
    registerCatalog(next)
    expect(latestCatalog().number).toBe(5)
    expect(catalogFor(0)).toBe(catalog)
    expect(catalogFor(99).presets).toEqual([])
  })
})

describe('compte rendu fabriqué par l’application', () => {
  it('choix dans l’ordre où ils sont cochés, « Autre » à la suite, clés stables', () => {
    const lines = formLines({ catalog, sex: '', form: form({ choices: [choiceKey('contexte.contexte.contexte', 'chute_recente'), choiceKey('contexte.contexte.contexte', 'evaluation_de_suivi')], values: { [otherOf('contexte.contexte.contexte')]: 'demande de la famille' } }) })
    expect(text(lines)).toBe('Contexte : chute récente, évaluation de suivi, demande de la famille')
  })

  it('test des 10 m avec l’aide technique facultative', () => {
    const values = { 'marche.test_10m.temps': '18', 'marche.test_10m.pas': '33' }
    expect(text(formLines({ catalog, sex: '', form: form({ values }) }))).toContain('Test des 10m : 18sec et 33 pas')
    expect(text(formLines({ catalog, sex: '', form: form({ values, choices: [choiceKey('marche.test_10m.aides', 'rollator')] }) }))).toContain('Test des 10m : 18sec et 33 pas, avec rollator')
  })

  it('choix unique, nombre, sections et ordre du bilan prédéfini', () => {
    const lines = formLines({ catalog, sex: 'F', form: form({ preset: 'marche_equilibre', values: { 'contexte.atcd.atcd': 'HTA', 'transferts.tug.temps': '18', 'transferts.assis_debout_30s.passages': '8', 'transferts.assis_debout_30s.accoudoirs': 'sans_accoudoirs' } }) })
    expect(text(lines)).toContain('Antécédents : HTA\nObservations :')
    expect(text(lines)).toContain('Timed Up and Go : 18sec')
    expect(text(lines)).toContain('8, sans accoudoirs')
  })

  it('questions calculées : score du Tinetti à partir des lignes cotées', () => {
    const rows = catalog.fields.filter(field => field.rubricKey === 'equilibre.tinetti' && field.type === 'score')
    const values = Object.fromEntries(rows.map(field => [field.key, field.options.at(-1)!.key]))
    const lines = formLines({ catalog, sex: '', form: form({ values }) })
    expect(text(lines)).toContain('Tinetti : 28/28 (équilibre 16/16, marche 12/12)')
  })

  it('HTML échappé : un texte saisi ne devient jamais une balise', () => {
    expect(formLines({ catalog, sex: '', form: form({ values: { 'contexte.atcd.atcd': '<img src=x>' } }) })[0]).toContain('&lt;img')
  })

  it('accords selon la civilité', () => {
    expect(accord('Très demandeur(se)', 'F')).toBe('Très demandeuse')
    expect(accord('Très demandeur(se)', 'H')).toBe('Très demandeur')
    expect(accord('orienté(e)', 'F')).toBe('orientée')
    expect(accord('orienté(e)', '')).toBe('orienté(e)')
  })

  it('plan pour l’IA et empreinte du formulaire', () => {
    const plan = formPlan({ catalog, sex: '', form: form({ preset: 'post_chute' }) })
    expect(plan[0]).toBe(orderedRubrics(catalog, 'post_chute')[0].reportLabel)
    expect(plan).toContain('[Observations]')
    expect(formHash(form({ values: { a: '1' } }))).toBe(formHash(form({ values: { a: '1', b: ' ' } })))
    expect(formHash(form({ values: { a: '1' } }))).not.toBe(formHash(form({ values: { a: '2' } })))
  })

  it('valeurs lisibles : une proposition archivée reste lisible', () => {
    const archived = { ...catalog, fields: catalog.fields.map(field => field.key === 'contexte.contexte.contexte' ? { ...field, options: field.options.map(option => ({ ...option, archived: true })) } : field) }
    expect(formValues(form({ choices: [choiceKey('contexte.contexte.contexte', 'chute_recente')] }), archived)['contexte.contexte.contexte']).toEqual(['chute récente'])
    expect(buildReport(orderedRubrics(archived), archived, formValues(form({ choices: [choiceKey('contexte.contexte.contexte', 'chute_recente')] }), archived)).length).toBe(1)
  })
})

describe('tests standardisés et historique commun', () => {
  it('les tests du catalogue rejoignent les clés de l’application', () => {
    const measures = formMeasures(form({
      choices: [choiceKey('marche.perimetre.aides', 'rollator')],
      values: { 'transferts.tug.temps': '18', 'marche.perimetre.prefixe': 'oui', 'marche.perimetre.distance': '50', 'douleur.eva.eva': '4', 'transferts.assis_debout_30s.accoudoirs': 'avec_accoudoirs' },
    }), catalog)
    expect(measures.values).toMatchObject({ tug: '18', 'perimetre.prefixe': 'supérieur à', 'perimetre.distance': '50', eva: '4', 'assisDebout30s.accoudoirs': 'avec accoudoirs' })
    expect(measures.choices).toEqual(['perimetre.aides.1'])
    expect(TEST_OF_RUBRIC['transferts.tug']).toBe('tug')
    expect(TEST_OF_RUBRIC['equilibre.tinetti']).toBe('tinetti')
  })

  it('★ : un TUG coché dans les repères devient la dernière mesure', () => {
    const days = [{ date: '2026-11-10', entries: { p1: { bilanForm: form({ values: { 'transferts.tug.temps': '20' } }) } } }]
    expect(latestMeasures(days, 'p1', '2026-11-17').tug).toMatchObject({ date: '2026-11-10', text: '20sec', copied: false })
  })
})
