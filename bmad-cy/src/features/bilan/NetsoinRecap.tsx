import { useState } from 'react'
import { nsDone, type NetsoinRecap } from '../../domain/netsoin'
import { copyText } from '../exports/clipboard'
import { netsoinTugText } from '../netsoin/bookmarklet'
import type { NsTest, NsValidations } from '../../domain/model'

// Valeurs à recopier dans NetSoin (bouton « NS ») : en gros chiffres, dans l’ordre de NetSoin. Tinetti : 20 cotations par
// groupes de 5 (item 9 à la fin) ; TUG : 5 durées puis le total. Le commentaire commun des tests NS suit.
// ✓ vert par test, une fois recopié : replie, coche « Éval » et note le dernier test NS du résident.
export function NetsoinPanel({ recap, ns, onDone }: { recap: NetsoinRecap; ns?: NsValidations; onDone: (test: NsTest, fingerprint: string) => void }) {
  const done = (test: NsTest) => nsDone(recap, test, ns)
  // Les 5 durées du TUG pour le favori « Remplir TUG » de Chrome sur le Mac (presse-papiers partagé avec l’iPhone).
  const [tugCopied, setTugCopied] = useState<boolean | null>(null)
  const validate = (test: NsTest) => <button type="button" className={`ns-validate${done(test) ? ' done' : ''}`} aria-label={done(test) ? `${test === 'tug' ? 'TUG' : 'Tinetti'} recopié dans NetSoin` : `Valider : ${test === 'tug' ? 'TUG' : 'Tinetti'} recopié dans NetSoin`} onClick={() => onDone(test, recap[test]!.fingerprint)}>✓</button>
  return <div className="netsoin" aria-label="À recopier dans NetSoin">
    {recap.tinetti && <section aria-label="Cotations du Tinetti">
      <h3>Tinetti · {recap.tinetti.total}/28{done('tinetti') && <span className="ns-done"> · recopié</span>}</h3>
      <ol className="netsoin-groups">{recap.tinetti.groups.map(group => <li key={group.from}><span className="netsoin-items">{group.from}–{group.to}</span><span className="netsoin-values">{group.values.join(' ')}</span></li>)}</ol>
      {validate('tinetti')}
    </section>}
    {recap.tug && <section aria-label="Étapes du TUG">
      <h3>TUG · total {recap.tug.total} s{done('tug') && <span className="ns-done"> · recopié</span>}</h3>
      <p className="netsoin-values netsoin-tug">{recap.tug.steps.join(' ')}</p>
      <div className="netsoin-actions">{validate('tug')}<button type="button" className={tugCopied ? 'copied' : ''} onClick={async () => setTugCopied(await copyText(netsoinTugText(recap.tug!.steps)))}>{tugCopied === null ? 'Copier pour NetSoin' : tugCopied ? 'Copié ✓' : 'Copie impossible'}</button></div>
    </section>}
    {recap.comment && <p className="netsoin-comment"><span>Commentaire</span> {recap.comment}</p>}
  </div>
}
