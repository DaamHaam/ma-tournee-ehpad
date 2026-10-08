import { describe, expect, it } from 'vitest'
import { choiceId, MARCHE_EQUILIBRE, marcheEquilibreHtml, marcheEquilibreText, previousMarcheEquilibre, rubricFilled } from './marcheEquilibre'
import { hasTestContent } from './tinetti'

// Identifiant d’un choix d’après son libellé, pour écrire les tests lisiblement.
function pick(key: string, label: string): string {
  for (const rubric of MARCHE_EQUILIBRE.flatMap(module => module.rubrics)) for (const control of rubric.controls) {
    if (control.kind === 'multi' && control.key === key) { const index = control.options.indexOf(label); if (index >= 0) return choiceId(key, index) }
  }
  throw new Error(`choix inconnu ${key} / ${label}`)
}
const TITLE = '<i><u>Évaluation kiné marche / équilibre</u></i>'

describe('bilan marche / équilibre', () => {
  it('reprend l’exemple de l’application d’origine, avec la mise en forme et la fusion des moyens', () => {
    const input = {
      choices: [pick('contexte', 'évaluation de suivi'), pick('aideTechnique', 'avec un rollator'), pick('marche', 'possible avec une surveillance'), pick('objectifs', 'sécuriser les déplacements'), pick('moyens', 'travail des réactions parachute'), pick('moyens', 'travail de l’équilibre')],
      values: { 'test10m.temps': '18', 'test10m.pas': '24' },
    }
    expect(marcheEquilibreHtml(input).split('<br>')).toEqual([
      TITLE,
      '<b><u>Contexte</u></b> : évaluation de suivi',
      '<i>Marche</i> : possible avec une surveillance, avec un rollator',
      'Test des 10m : 18sec et 24 pas',
      '<b><u>Objectifs kiné</u></b> : sécuriser les déplacements',
      '<b><u>Traitement kiné</u></b> : travail de l’équilibre et des réactions parachute',
    ])
    expect(marcheEquilibreText(input)).toBe('Évaluation kiné marche / équilibre\nContexte : évaluation de suivi\nMarche : possible avec une surveillance, avec un rollator\nTest des 10m : 18sec et 24 pas\nObjectifs kiné : sécuriser les déplacements\nTraitement kiné : travail de l’équilibre et des réactions parachute')
  })
  it('n’affiche que le titre pour un bilan vide et omet les rubriques vides', () => {
    expect(marcheEquilibreHtml({})).toBe(TITLE)
    expect(marcheEquilibreHtml({ values: { 'perimetre.commentaire': 'dans le parc', 'perimetre.lieu': 'Chambre', 'trajet.commentaire': 'lent' } })).toBe(TITLE)
  })
  it('compose les Observations dans l’ordre, en sous-lignes italiques, avec Mobilités, EVA et Verticalisation', () => {
    const input = {
      choices: [pick('douleur', 'à la mobilisation'), pick('raideurs', 'rétractions'), pick('verticalisation', 'avec aide légère'), pick('troublesComplementaires', 'déficit auditif')],
      values: { eva: '4', allongeAssis: 'réalisé seul', 'installation.autre': 'au fauteuil <roulant>' },
    }
    expect(marcheEquilibreHtml(input).split('<br>').slice(1)).toEqual([
      '<b><u>Observations</u></b>',
      '- <i>Troubles complémentaires</i> : déficit auditif',
      '- <i>Installation</i> : au fauteuil &lt;roulant&gt;',
      '- <i>Mobilités</i> : rétractions',
      '- <i>Douleur</i> : à la mobilisation',
      '- <i>EVA</i> : 4/10',
      '- <i>Verticalisation</i> : réalisée avec aide légère',
      '- <i>Passage allongé-assis au bord du lit</i> : réalisé seul',
    ])
    expect(marcheEquilibreHtml({ values: { eva: '4', 'eva.autre': 'non évaluable' } })).toContain('- <i>EVA</i> : non évaluable')
  })
  it('compose mesures, périmètre, trajet, escaliers et textes libres', () => {
    const input = {
      choices: [pick('perimetre.aides', 'rollator'), pick('perimetre.limites', 'limité par la fatigabilité'), pick('trajet.aides', 'canne simple'), pick('escaliers.pas', 'pas alternés'), pick('aideTechnique', 'avec une canne simple')],
      values: { assisDebout30s: '0', tug: '17,6', stationDebout: 'abc', 'perimetre.prefixe': 'supérieur à', 'perimetre.distance': '100', 'perimetre.lieu': 'RDC', 'perimetre.commentaire': 'pauses', 'trajet.duree': '2 min 30 s', 'test10m.pas': '30', test6min: '250', 'escaliers.marches': '12', 'escaliers.autre': 'avec la rampe', seances: '3', commentaires: 'ligne 1\nligne 2', atcd: 'PTH droite' },
    }
    expect(marcheEquilibreHtml(input).split('<br>').slice(1)).toEqual([
      '<b><u>Antécédents</u></b> : PTH droite',
      'Nombre de passages assis-debout en 30s : 0',
      'Timed Up and Go : 18sec',
      '<i>Aide technique</i> : avec une canne simple',
      'Périmètre de marche : supérieur à 100m, avec rollator, limité par la fatigabilité, lui permettant de marcher jusqu’au rez-de-chaussée, pauses',
      'Temps trajet chambre-RDC : 2 min 30 s, avec canne simple',
      'Test des 10m : 30 pas',
      'Évaluation endurance, test des 6min : 250m',
      '<i>Escaliers</i> : 12 marches montées, pas alternés, avec la rampe',
      '<i>Nombre de séances kiné par semaine</i> : 3',
      '<i>Autres commentaires</i> : ligne 1',
      'ligne 2',
    ])
  })
  it('suit l’ordre du catalogue et place « Autre » en fin de ligne', () => {
    expect(marcheEquilibreHtml({ choices: [pick('equilibre', 'impossible en unipodal'), pick('equilibre', 'impossible sans appui')], values: { 'equilibre.autre': 'oscillations' } })).toContain('<i>Équilibre</i> : impossible sans appui, impossible en unipodal, oscillations')
  })
  it('compte les rubriques renseignées et reconnaît un bilan non vide', () => {
    const perimetre = MARCHE_EQUILIBRE.flatMap(module => module.rubrics).find(rubric => rubric.id === 'perimetre')!
    const marche = MARCHE_EQUILIBRE.flatMap(module => module.rubrics).find(rubric => rubric.id === 'marche')!
    expect(rubricFilled(perimetre, { choices: [pick('perimetre.aides', 'rollator')] })).toBe(true)
    expect(rubricFilled(marche, { choices: [pick('perimetre.aides', 'rollator')] })).toBe(false)
    expect(hasTestContent({ scores: {}, notes: '', values: { tug: ' ' } })).toBe(false)
    expect(hasTestContent({ scores: {}, notes: '', choices: [pick('marche', 'impossible')] })).toBe(true)
  })
  it('retrouve le bilan précédent et la dernière mesure de chaque test standardisé', () => {
    const day = (date: string, values: Record<string, string>, choices: string[] = []) => ({ date, entries: { p: { tests: { marcheEquilibre: { scores: {}, notes: '', at: '', values, choices } } } } })
    const days = [day('2026-06-01', { tug: '20', 'test10m.temps': '15' }), day('2026-09-01', { tug: '18' }, [pick('marche', 'possible seul')]), day('2026-10-08', { tug: '12' })]
    const previous = previousMarcheEquilibre(days, 'p', '2026-10-08')
    expect(previous.last?.date).toBe('2026-09-01')
    expect(previous.measures).toEqual({ tug: { date: '2026-09-01', text: '18sec' }, test10m: { date: '2026-06-01', text: '15sec' } })
  })
})
