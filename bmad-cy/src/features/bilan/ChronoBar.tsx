import { TUG_STEPS } from '../../domain/tug'
import { chronoDisplay, countdownDisplay, tenthsDisplay } from './chronoFormat'
import type { Chrono, ChronoSpec } from './useChrono'

// Bouton de départ, le même partout : un toucher lance tout de suite (gros bouton, libellé du test).
export function ChronoStart({ chrono, spec, children }: { chrono: Chrono; spec: ChronoSpec; children: string }) {
  return <button type="button" className="chrono-start" disabled={!!chrono.state} onClick={() => chrono.start(spec)}>⏱ {children}</button>
}

// Barre du chronomètre en cours, en haut du volet (visible pendant que l’on cote) : temps en secondes, « Arrêter »
// ou « Étape suivante », et ✕ pour annuler tout de suite.
export function ChronoBar({ chrono }: { chrono: Chrono }) {
  const { state, now } = chrono
  if (!state) return null
  const { spec } = state
  const elapsed = Math.max(0, now - state.start)
  const step = spec.mode === 'steps' ? TUG_STEPS[state.marks.length] : undefined
  const time = spec.mode === 'countdown' ? (state.finished ? 'Terminé' : countdownDisplay(spec.seconds * 1000 - elapsed)) : spec.mode === 'stopwatch' && spec.centi ? tenthsDisplay(elapsed) : chronoDisplay(elapsed)
  return <div className={`chrono-bar${state.finished ? ' finished' : ''}`} role="group" aria-label={`Chronomètre : ${spec.label}`}>
    <span className="chrono-bar-label">{spec.label}{step && ` · ${state.marks.length + 1}/${TUG_STEPS.length} ${step.label}`}</span>
    <output className="chrono-bar-time" aria-live={state.finished ? 'assertive' : 'off'}>{time}</output>
    {spec.mode === 'steps' && <button type="button" className="primary chrono-bar-main" onClick={chrono.next}>{state.marks.length + 1 === TUG_STEPS.length ? 'Fin' : 'Étape suivante'}</button>}
    {(spec.mode === 'stopwatch' || spec.mode === 'tug') && <button type="button" className="primary chrono-bar-main" onClick={chrono.stop}>Arrêter</button>}
    {spec.mode === 'countdown' && state.finished && <button type="button" className="primary chrono-bar-main" onClick={chrono.cancel}>OK</button>}
    <button type="button" className="chrono-bar-cancel" aria-label="Annuler le chronomètre" onClick={chrono.cancel}>✕</button>
  </div>
}
