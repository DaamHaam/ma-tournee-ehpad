import { describe, expect, it } from 'vitest'
import { anonymize, anonymizeWithMap, finishAiText, marcheRequest, parseMarcheReply, restoreNames, parseCorrection, parseTinettiReply, sexLabel, tinettiRequest } from './assistant'

describe('assistant de rédaction', () => {
  it('retire nom et prénom sans tenir compte de la casse ni des accents', () => {
    expect(anonymize('Mme Lefèvre marche ; lefevre Hélène se lève, Hélène-Marie aussi. Lefèvrerie reste.', ['Lefèvre', 'Hélène']))
      .toBe('Mme [patient] marche ; [patient] [patient] se lève, [patient]-Marie aussi. Lefèvrerie reste.')
    expect(anonymize('Le Gall marche, le pas de Gall est lent. Mme de la Tour ou la tour ?', ['Le Gall', ''])).toBe('[patient] marche, le pas de [patient] est lent. Mme de la Tour ou la tour ?')
    expect(anonymize('Mme de La Tour marche ; La Tour sourit, la marche est lente.', ['de La Tour', 'Anne'])).toBe('Mme [patient] marche ; La [patient] sourit, la marche est lente.')
    expect(anonymize('Texte', [''])).toBe('Texte')
    const { text, found } = anonymizeWithMap('Mme Lefèvre marche, Hélène sourit.', ['Lefèvre', 'Hélène'])
    expect(restoreNames(text.replace('marche', 'marche lentement'), found)).toBe('Mme Lefèvre marche lentement, Hélène sourit.')
    expect(restoreNames('[patient] seul', found)).toBe('[patient] seul')
    // Texte de l’IA : la civilité (jamais le nom), rien derrière une civilité déjà écrite ; sexe inconnu, les mots dictés ; monsieur/madame abrégés.
    expect(finishAiText('Que [patient] comprend. Mme [patient] marche, madame sourit.', ['Lefèvre', 'Lefèvre'], 'F')).toBe('Que Mme comprend. Mme marche, Mme sourit.')
    expect(finishAiText('[patient] marche avec Monsieur Durand.', ['Lefèvre'], 'H')).toBe('Mr marche avec Mr Durand.')
    expect(finishAiText('Que [patient] comprend.', ['Lefèvre'], '')).toBe('Que Lefèvre comprend.')
  })
  it('envoie la grille cochée et la dictée, sans identité', () => {
    const request = JSON.parse(tinettiRequest({ e1: 1 }, 'Marche lente', 'F'))
    expect(request.patient).toBe('patiente')
    expect(request.grille).toHaveLength(20)
    expect(request.grille[0]).toMatchObject({ ligne: 'e1', partie: 'Équilibre', cotation: 1 })
    expect(request.grille[0].options).toBeUndefined()
    expect(request.grille[0].libelle).toBe('position assise stable et sûre')
    expect(request.grille[1].cotation).toBeNull()
    expect(request.grille[1].options).toHaveLength(3)
    expect(request.dictee).toBe('Marche lente')
    expect(sexLabel('')).toBe('patient(e)')
  })
  it('lit la réponse JSON, filtre le HTML et ignore les lignes non cotées', () => {
    const reply = parseTinettiReply('```json\n{"cotations":{"e1":1,"e2":1,"e3":5,"zz":1},"observations":"Marche <b>lente</b><script>x</script>\\nAide","a_verifier":[{"ligne":"e1","raison":"dit stable"},{"ligne":"e2","raison":"appui d’un bras"},{"ligne":"e4","raison":"non coté"},{"ligne":"zz"}]}\n```', { e1: 0 })
    // e1 reste à la cotation du kinésithérapeute ; e2 est cotée par l’IA ; e3 (hors options) et zz (inconnue) sont ignorées.
    expect(reply).toEqual({ observations: 'Marche <b>lente</b>x<br>Aide', checks: [{ row: 'e1', reason: 'dit stable' }, { row: 'e2', reason: 'appui d’un bras' }, { row: 'e4', reason: 'non coté' }], scores: { e2: 1 } })
    expect(() => parseTinettiReply('pas de json', {})).toThrow('illisible')
  })
  it('nettoie un texte corrigé', () => {
    expect(parseCorrection('```\nMarche <b>lente</b>.\nDouleur 2/10.\n```')).toBe('Marche <b>lente</b>.<br>Douleur 2/10.')
    expect(parseCorrection('"Texte corrigé."')).toBe('Texte corrigé.')
  })
})

describe('prompts modifiés dans l’app', () => {
  it('ne valent que pour le prompt par défaut dont ils sont partis', async () => {
    const { customPrompt, encodeCustomPrompt } = await import('./prompts')
    expect(customPrompt('tinetti', encodeCustomPrompt('tinetti', 'Mon prompt'))).toBe('Mon prompt')
    expect(customPrompt('tinetti', JSON.stringify({ base: 'ancienne-version', text: 'Mon prompt' }))).toBeNull()
    expect(customPrompt('tinetti', 'ancien format texte')).toBeNull()
    expect(customPrompt('correction', undefined)).toBeNull()
  })
  it('bilan marche / équilibre : envoie les cochés en libellés et les options libres avec leur identifiant', () => {
    const request = JSON.parse(marcheRequest({ choices: ['contexte.1'], values: { tug: '18' } }, 'Marche avec rollator', 'H'))
    expect(request.patient).toBe('patient')
    expect(request.dictee).toBe('Marche avec rollator')
    const contexte = request.formulaire.find((rubric: { rubrique: string }) => rubric.rubrique === 'Contexte')
    expect(contexte.sous_module).toBe('Contexte')
    expect(contexte.champs[0]).toMatchObject({ id: 'contexte', type: 'choix multiples', coches: ['évaluation de suivi'] })
    expect(contexte.champs[0].a_cocher['contexte.1']).toBeUndefined()
    expect(contexte.champs[0].a_cocher['contexte.6']).toBe('chute récente')
    const tug = request.formulaire.find((rubric: { rubrique: string }) => rubric.rubrique === 'Timed Up and Go')
    expect(tug.champs[0]).toEqual({ id: 'tug', titre: 'Temps', type: 'nombre', unite: 'sec', valeur: '18' })
  })
  it('bilan marche / équilibre : ne garde que des ajouts sur ce qui est libre et rattache les voyants à leur rubrique', () => {
    const reply = parseMarcheReply('```json\n' + JSON.stringify({
      cocher: ['marche.3', 'aideTechnique.8', 'contexte.1', 'marche.99', 'inconnu.1', 'marche.3'],
      valeurs: { tug: '20', 'test10m.temps': 22, 'test10m.pas': 'trente', eva: '11', seances: '2', 'commentaires.ia': '[patient] souriante.', 'trajet.duree': '2 min 30 s', inconnu: 'x', 'marche.1': 'x' },
      a_verifier: [{ champ: 'marche.3', raison: 'surveillance ou guidance ?' }, { champ: 'perimetre.distance', raison: 'distance estimée' }, { champ: 'zz', raison: 'x' }],
    }) + '\n```', { choices: ['contexte.1'], values: { tug: '18' } }, 'F')
    expect(reply.choices).toEqual(['marche.3', 'aideTechnique.8'])
    expect(reply.values).toEqual({ 'test10m.temps': '22', seances: '2', 'commentaires.ia': 'Mme souriante.', 'trajet.duree': '2 min 30 s' })
    expect(reply.checks).toEqual([{ row: 'marche', reason: 'surveillance ou guidance ?' }, { row: 'perimetre', reason: 'distance estimée' }])
    expect(() => parseMarcheReply('rien', {}, 'F')).toThrow('illisible')
  })
})
