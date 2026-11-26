import { useState } from 'react'
import { copyText } from '../exports/clipboard'
import { TUG_BOOKMARKLET } from './bookmarklet'

// Réglages : favori Chrome « Remplir le TUG » pour NetSoin, à installer une fois sur le Mac.
export function NetsoinBookmarkletPanel() {
  const [status, setStatus] = useState('')
  return <section className="card netsoin-help" aria-label="Favori NetSoin">
    <h2>NetSoin : remplir le TUG d’un clic</h2>
    <ol>
      <li>Sur le Mac, dans Chrome : touchez « Copier le favori » ci-dessous depuis l’iPhone (le presse-papiers passe sur le Mac), ou ouvrez Ma tournée sur le Mac et cliquez-le.</li>
      <li>Chrome : menu Favoris → Gestionnaire de favoris → ⋮ → Ajouter un favori. Nom : « Remplir TUG » ; URL : collez (⌘V). Enregistrez, et affichez la barre des favoris (⌘⇧B).</li>
      <li>À chaque TUG : sur l’iPhone, onglet Bilans → NS → « Copier pour NetSoin » ; sur le Mac, ouvrez la page du TUG dans NetSoin et cliquez « Remplir TUG ». Les 5 durées se rangent dans les bonnes cases ; vérifiez avant d’enregistrer.</li>
    </ol>
    <p className="save-hint">Si Chrome demande l’accès au presse-papiers, autorisez-le ; sinon le favori vous demande de coller les durées.</p>
    <div className="action-row"><button type="button" onClick={async () => setStatus(await copyText(TUG_BOOKMARKLET) ? 'Favori copié.' : 'Copie impossible.')}>Copier le favori</button></div>
    {status && <p className="save-hint" role="status">{status}</p>}
  </section>
}
