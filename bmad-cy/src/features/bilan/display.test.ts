import { describe, expect, it } from 'vitest'
import { testCopyHtml } from './display'

describe('texte d’un test à copier', () => {
  const base = { scores: { e1: 1 }, notes: 'marche lente', notesHtml: 'marche lente' }
  it('prend le texte retouché, sinon les observations de l’IA tant que la dictée n’a pas changé, sinon la dictée', () => {
    expect(testCopyHtml({ ...base, resultHtml: 'Texte <b>retouché</b>' })).toBe('Texte <b>retouché</b>')
    expect(testCopyHtml({ ...base, aiObservations: 'Marche <b>lente</b>.', aiSource: 'marche lente' })).toMatch(/<b>1\/28<\/b>.*Marche <b>lente<\/b>\.$/)
    expect(testCopyHtml({ ...base, aiObservations: 'Ancienne synthèse.', aiSource: 'autre dictée' })).toMatch(/marche lente$/)
    expect(testCopyHtml(base)).toMatch(/^<u><b>Tinetti<\/b><\/u> : <b>1\/28<\/b>/)
  })
})
