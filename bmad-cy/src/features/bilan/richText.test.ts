import { describe, expect, it } from 'vitest'
import { appendText, bilanHtml, htmlToText, sanitizeBilanHtml, textToHtml } from './richText'

describe('texte enrichi des bilans', () => {
  it('garde gras, italique, souligné et retours à la ligne, sans attributs', () => {
    expect(sanitizeBilanHtml('<strong>TUG</strong> 12 s, <em>lent</em>, <u style="x">aide</u><br/>Suite')).toBe('<b>TUG</b> 12 s, <i>lent</i>, <u>aide</u><br>Suite')
    expect(sanitizeBilanHtml('<b class="x" onclick="alert(1)">gras</b>')).toBe('<b>gras</b>')
  })
  it('transforme les paragraphes de Safari en retours à la ligne', () => {
    expect(sanitizeBilanHtml('Ligne 1<div>Ligne 2</div><div><br></div><div>Ligne 4</div>')).toBe('Ligne 1<br>Ligne 2<br><br>Ligne 4')
    expect(sanitizeBilanHtml('<div>Seule</div>')).toBe('Seule')
  })
  it('retire balises dangereuses et chevrons orphelins', () => {
    expect(sanitizeBilanHtml('a<script>x</script>b<img src=x onerror=alert(1)>c<span style="color:red">d</span>')).toBe('axbcd')
    expect(sanitizeBilanHtml('fin <img src=x onerror=alert(1)')).toBe('fin ')
    expect(sanitizeBilanHtml('3 &lt; 5 et 2 > 1')).toBe('3 &lt; 5 et 2 &gt; 1')
  })
  it('convertit texte brut et HTML dans les deux sens', () => {
    expect(textToHtml('Marche <10 m>\nDouleur & raideur')).toBe('Marche &lt;10 m&gt;<br>Douleur &amp; raideur')
    expect(htmlToText('<b>Marche</b> &lt;10 m&gt;<br>Douleur&nbsp;&amp; raideur')).toBe('Marche <10 m>\nDouleur & raideur')
    expect(bilanHtml({ bilan: 'Ancien\nbilan' })).toBe('Ancien<br>bilan')
    expect(bilanHtml({ bilan: 'x', bilanHtml: '<b>Nouveau</b>' })).toBe('<b>Nouveau</b>')
  })
  it('ajoute une dictée en fin de bilan', () => {
    expect(appendText('', ' Début ')).toBe('Début')
    expect(appendText('<b>Début</b>', 'suite <1>')).toBe('<b>Début</b> suite &lt;1&gt;')
    expect(appendText('Ligne<br>', 'suite')).toBe('Ligne<br>suite')
  })
})
