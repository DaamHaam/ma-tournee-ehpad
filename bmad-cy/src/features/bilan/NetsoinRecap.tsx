import type { NetsoinRecap } from '../../domain/netsoin'
import { TUG_STEPS } from '../../domain/tug'

// Récapitulatif à recopier dans NetSoin : cotations du Tinetti en gros chiffres, par groupes de 5 dans l’ordre de NetSoin
// (item 9 à la fin), et durées du TUG par étapes à la seconde.
export function NetsoinPanel({ recap }: { recap: NetsoinRecap }) {
  return <div className="netsoin" aria-label="À recopier dans NetSoin">
    {recap.tinetti && <section aria-label="Cotations du Tinetti">
      <h3>Tinetti · {recap.tinetti.total}/28</h3>
      <ol className="netsoin-groups">{recap.tinetti.groups.map(group => <li key={group.from}><span className="netsoin-items">{group.from}–{group.to}</span><span className="netsoin-values">{group.values.join(' ')}</span></li>)}</ol>
    </section>}
    {recap.tug && <section aria-label="Étapes du TUG">
      <h3>TUG · {recap.tug.total} s</h3>
      <ol className="tug-steps">{TUG_STEPS.map((step, index) => <li key={step.key}>{step.label} <b>{recap.tug!.steps[index]} s</b></li>)}<li className="tug-total">Total <b>{recap.tug.total} s</b></li></ol>
    </section>}
  </div>
}
