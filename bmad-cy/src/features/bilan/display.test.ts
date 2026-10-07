import { describe, expect, it } from 'vitest'
import type { DayBilan, Identity } from '../../domain/model'
import { joinBilans, multiBilanGroups, testCopyHtml } from './display'

describe('texte d’un test à copier', () => {
  const base = { scores: { e1: 1 }, notes: 'marche lente', notesHtml: 'marche lente' }
  it('prend le texte retouché, sinon les observations de l’IA tant que la dictée n’a pas changé, sinon la dictée', () => {
    expect(testCopyHtml({ ...base, resultHtml: 'Texte <b>retouché</b>' })).toBe('Texte <b>retouché</b>')
    expect(testCopyHtml({ ...base, aiObservations: 'Marche <b>lente</b>.', aiSource: 'marche lente' })).toMatch(/<b>1\/28<\/b>.*Marche <b>lente<\/b>\.$/)
    expect(testCopyHtml({ ...base, aiObservations: 'Ancienne synthèse.', aiSource: 'autre dictée' })).toMatch(/marche lente$/)
    expect(testCopyHtml(base)).toMatch(/^<u><b>Tinetti<\/b><\/u> : <b>1\/28<\/b>/)
  })
})

describe('« Tout copier » les bilans d’un patient', () => {
  const who = (id: string, lastName: string): Identity => ({ id, lastName, firstName: 'Fictif', room: '', priority: '', demo: false })
  const item = (id: string, lastName: string, kind: string, text: string): DayBilan => ({ id, kind: kind as DayBilan['kind'], patient: who(id, lastName), text, copied: false })
  it('regroupe les patients d’au moins deux bilans, dans l’ordre d’affichage, quel que soit le type', () => {
    const list = [item('a', 'Alpha', 'tinetti', 't1'), item('b', 'Beta', 'bilan', 'b1'), item('a', 'Alpha', 'bilan', 'a1'), item('c', 'Gamma', 'bilan', 'c1'), item('a', 'Alpha', 'futur', 'f1'), item('c', 'Gamma', 'futur', 'c2')]
    const groups = multiBilanGroups(list)
    expect(groups.map(group => group.id)).toEqual(['a', 'c'])
    expect(groups[0].items.map(bilan => bilan.text)).toEqual(['t1', 'a1', 'f1'])
    expect(multiBilanGroups([item('a', 'Alpha', 'bilan', 'seul')])).toEqual([])
  })
  it('met les bilans bout à bout, séparés par une ligne vide, mise en forme comprise', () => {
    expect(joinBilans(['<b>Tinetti</b> : 20/28<br>Marche lente', 'Bilan libre.', '  '])).toEqual({ html: '<b>Tinetti</b> : 20/28<br>Marche lente<br><br>Bilan libre.', text: 'Tinetti : 20/28\nMarche lente\n\nBilan libre.' })
    expect(joinBilans(['Ligne finale<br>', 'Suite'])).toEqual({ html: 'Ligne finale<br><br>Suite', text: 'Ligne finale\n\nSuite' })
  })
})
