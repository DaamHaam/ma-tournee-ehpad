import { describe, expect, it } from 'vitest'
import type { DayBilan, Identity } from '../../domain/model'
import { clipboardContent, joinBilans, markLines, multiBilanGroups, testCopyHtml } from './display'
import { sanitizeBilanHtml } from './richText'

describe('texte d’un test à copier', () => {
  const base = { scores: { e1: 1 }, notes: 'marche lente', notesHtml: 'marche lente' }
  it('prend le texte retouché, sinon les observations de l’IA tant que la dictée n’a pas changé, sinon la dictée', () => {
    expect(testCopyHtml({ ...base, resultHtml: 'Texte <b>retouché</b>' })).toBe('Texte <b>retouché</b>')
    expect(testCopyHtml({ ...base, aiObservations: 'Marche <b>lente</b>.', aiSource: 'marche lente' })).toMatch(/<b>1\/28<\/b>.*Marche <b>lente<\/b>\.$/)
    expect(testCopyHtml({ ...base, aiObservations: 'Ancienne synthèse.', aiSource: 'autre dictée' })).toMatch(/marche lente$/)
    expect(testCopyHtml(base)).toMatch(/^<u><b>Tinetti<\/b><\/u> : <b>1\/28<\/b>/)
  })
  it('génère le bilan marche / équilibre et le copie en chasse fixe avec des fins de ligne CRLF', () => {
    const html = testCopyHtml({ scores: {}, notes: '', choices: ['marche.1'] }, 'marcheEquilibre')
    expect(html).toBe('<i><u>Évaluation kiné marche / équilibre</u></i><br><i>Marche</i> : possible seul')
    expect(testCopyHtml({ scores: {}, notes: '', choices: ['marche.1'], resultHtml: 'Retouché' }, 'marcheEquilibre')).toBe('Retouché')
    const copied = clipboardContent('marcheEquilibre', html)
    expect(copied.html).toMatch(/^<div style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;white-space:pre-wrap;"><i><u>Évaluation/)
    expect(copied.text).toBe('Évaluation kiné marche / équilibre\r\nMarche : possible seul')
    expect(clipboardContent('tinetti', 'a<br>b')).toEqual({ html: 'a<br>b', text: 'a\nb' })
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
  it('marque en marge les lignes complétées par l’IA, sans rien laisser dans le texte filtré', () => {
    const html = markLines([{ rubrics: [], html: 'Titre' }, { rubrics: ['marche', 'aideTechnique'], html: '<i>Marche</i> : seul' }, { rubrics: ['tug'], html: 'TUG' }], new Set(['aideTechnique']), new Set(['tug']))
    expect(html).toBe('Titre<br><span class="ai-line"><i>Marche</i> : seul</span><br><span class="ai-line doubt">TUG</span>')
    expect(sanitizeBilanHtml(html)).toBe('Titre<br><i>Marche</i> : seul<br>TUG')
  })
})
