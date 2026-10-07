// « ! » rouge devant le nom d’un patient qui attend une séance ; le lecteur d’écran l’annonce après le nom.
export function WaitingMark({ waiting }: { waiting?: boolean }) {
  return waiting ? <span className="waiting-mark" title="Attend une séance" aria-hidden="true">!</span> : null
}
export function WaitingLabel({ waiting }: { waiting?: boolean }) {
  return waiting ? <span className="sr-only"> (attend une séance)</span> : null
}
