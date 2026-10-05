import { describe, expect, it } from 'vitest'
import { anonymize, anonymizeWithMap, restoreNames, parseCorrection, parseTinettiReply, sexLabel, tinettiRequest } from './assistant'

describe('assistant de rédaction', () => {
  it('retire nom et prénom sans tenir compte de la casse ni des accents', () => {
    expect(anonymize('Mme Lefèvre marche ; lefevre Hélène se lève, Hélène-Marie aussi. Lefèvrerie reste.', ['Lefèvre', 'Hélène']))
      .toBe('Mme [patient] marche ; [patient] [patient] se lève, [patient]-Marie aussi. Lefèvrerie reste.')
    expect(anonymize('Le Gall marche', ['Le Gall', ''])).toBe('[patient] [patient] marche')
    expect(anonymize('Texte', [''])).toBe('Texte')
    const { text, found } = anonymizeWithMap('Mme Lefèvre marche, Hélène sourit.', ['Lefèvre', 'Hélène'])
    expect(restoreNames(text.replace('marche', 'marche lentement'), found)).toBe('Mme Lefèvre marche lentement, Hélène sourit.')
    expect(restoreNames('[patient] seul', found)).toBe('[patient] seul')
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
    expect(reply).toEqual({ observations: 'Marche <b>lente</b>x<br>Aide', checks: [{ row: 'e1', reason: 'dit stable' }, { row: 'e2', reason: 'appui d’un bras' }], scores: { e2: 1 } })
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
})
