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

// Bas de page de dictée : messages, puis bouton gauche facultatif, micro, bouton droit facultatif.
export function DictationFooter({ dictation, left, right }: { dictation: ReturnType<typeof useDictation>; left?: ReactNode; right?: ReactNode }) {
  const { error, pending, transcribing, hint, hasKey, status, recording, disabled, toggle, retry, dismiss } = dictation
  return <footer className="bilan-dictation">
    {error && <p className="field-error" role="alert">{error}</p>}
    {pending && !transcribing && <div className="action-row"><button type="button" onClick={retry}>Réessayer la transcription</button><button type="button" onClick={dismiss}>Abandonner</button></div>}
    {hint && <p className="save-hint">{hint}{!hasKey && <> <Link to="/settings">Réglages</Link></>}</p>}
    <p className="dictation-status" role="status">{status}</p>
    <div className="dictation-bar">
      {left ?? <span className="bar-spacer" />}
      <button type="button" className={`mic${recording ? ' recording' : ''}`} aria-label={recording ? 'Arrêter la dictée' : 'Démarrer la dictée'} disabled={disabled} onClick={() => void toggle()}>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{recording ? <rect x="7" y="7" width="10" height="10" rx="1.5" /> : <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />}</svg>
      </button>
      {right ?? <span className="bar-spacer" />}
    </div>
  </footer>
}
