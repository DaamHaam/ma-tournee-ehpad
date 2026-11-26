import { ALERT_LABEL, type AlertLevel } from '../../domain/model'

// « ! », « !! » ou « !!! » rouges devant le nom (niveau d’alerte de la fiche) ; le lecteur d’écran l’annonce après le nom.
export function WaitingMark({ level, reason }: { level?: AlertLevel; reason?: string }) {
  return level ? <span className={`waiting-mark level-${level}`} title={[ALERT_LABEL[level], reason].filter(Boolean).join(' : ')} aria-hidden="true">{'!'.repeat(level)}</span> : null
}
export function WaitingLabel({ level, reason }: { level?: AlertLevel; reason?: string }) {
  return level ? <span className="sr-only"> ({[ALERT_LABEL[level].toLocaleLowerCase('fr'), reason].filter(Boolean).join(' : ')})</span> : null
}
