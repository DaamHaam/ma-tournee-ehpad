import type { ReactNode } from 'react'
import { ICONS } from './screenUtils'
import { Link } from 'react-router-dom'
import type { useDictation } from './useDictation'

export function Icon({ d, size = 22, width = 1.9 }: { d: string; size?: number; width?: number }) { return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg> }

// En-tête compact des pages plein écran : retour, nom sur deux lignes, outils, copier, annuler.
export function ScreenHeader({ back, backLabel, patient, tools, copied, copyDisabled, onCopy, onCancel }: {
  back: string; backLabel: string; patient: { lastName: string; firstName: string }; tools?: ReactNode
  copied: boolean | null; copyDisabled: boolean; onCopy: () => void; onCancel: () => void
}) {
  return <header className="screen-header">
    <Link className="icon-link" to={back} aria-label={backLabel}><Icon d={ICONS.back} /></Link>
    <div className="screen-name"><strong>{patient.lastName}</strong>{patient.firstName && <span>{patient.firstName}</span>}</div>
    {tools}
    <button type="button" className={`icon-button${copied ? ' copied' : ''}`} aria-label={copied === null ? 'Copier' : copied ? 'Copié' : 'Copie impossible'} title="Copier" disabled={copyDisabled} onClick={onCopy}>{copied ? <span aria-hidden="true">✓</span> : <Icon d={ICONS.copy} size={20} />}</button>
    <button type="button" className="icon-button cancel" aria-label="Annuler et quitter" title="Annuler et quitter" onClick={onCancel}><Icon d={ICONS.close} size={20} width={2.4} /></button>
  </header>
}

function MicIcon({ recording, size }: { recording: boolean; size: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{recording ? <rect x="7" y="7" width="10" height="10" rx="1.5" /> : <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />}</svg>
}

// Bas de page de dictée : messages, puis boutons de gauche facultatifs, micro, boutons de droite facultatifs.
// floating : seul le micro, posé par-dessus le contenu (formulaire qui descend jusqu’en bas de l’écran).
export function DictationFooter({ dictation, left, right, extra, floating }: { dictation: ReturnType<typeof useDictation>; left?: ReactNode; right?: ReactNode; extra?: ReactNode; floating?: boolean }) {
  const { error, pending, transcribing, hint, hasKey, status, recording, disabled, toggle, retry, dismiss } = dictation
  return <footer className={`bilan-dictation${floating ? ' floating' : ''}`}>
    {extra}
    {error && <p className="field-error" role="alert">{error}</p>}
    {pending && !transcribing && <div className="action-row"><button type="button" onClick={retry}>Réessayer la transcription</button><button type="button" onClick={dismiss}>Abandonner</button></div>}
    {hint && !floating && <p className="save-hint">{hint}{!hasKey && <> <Link to="/settings">Réglages</Link></>}</p>}
    <p className="dictation-status" role="status">{status}</p>
    <div className="dictation-bar">
      {floating ? null : <span className="bar-group">{left ?? <span className="bar-spacer" />}</span>}
      <button type="button" className={`mic${recording ? ' recording' : ''}`} aria-label={recording ? 'Arrêter la dictée' : 'Démarrer la dictée'} disabled={disabled} onClick={() => void toggle()}><MicIcon recording={recording} size={30} /></button>
      {floating ? null : <span className="bar-group">{right ?? <span className="bar-spacer" />}</span>}
    </div>
  </footer>
}

// Clavier ouvert : petit micro (dicter tout en gardant le clavier) et flèche pour rentrer le clavier, au-dessus du clavier.
export function KeyboardBar({ dictation, onHide }: { dictation: ReturnType<typeof useDictation>; onHide: () => void }) {
  const { error, status, recording, disabled, toggle } = dictation
  return <div className="keyboard-bar">
    {error && <span className="field-error" role="alert">{error}</span>}
    <span className="dictation-status" role="status">{status}</span>
    <button type="button" className={`mic small${recording ? ' recording' : ''}`} aria-label={recording ? 'Arrêter la dictée' : 'Démarrer la dictée'} disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={() => void toggle()}><MicIcon recording={recording} size={18} /></button>
    <button type="button" className="keyboard-hide" aria-label="Fermer le clavier" onPointerDown={event => event.preventDefault()} onClick={onHide}><Icon d={ICONS.hide} /></button>
  </div>
}

// Petit bouton rond de la barre de dictée, qui ne retire pas le focus du texte.
export function BarButton({ label, icon, size = 22, onClick, disabled }: { label: string; icon: string; size?: number; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="round-button" aria-label={label} title={label} disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={onClick}><Icon d={icon} size={size} /></button>
}
