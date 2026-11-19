import { useEffect, useState } from 'react'
import type { useTugTimer } from './useTugTimer'
import type { Measure } from '../../domain/mesures'
import { TUG_STEPS } from '../../domain/tug'
import { chronoDisplay } from './chronoFormat'
import { shortDate } from './display'

// Chronomètre du Timed Up and Go, simple ou par étapes (5 touches « Étape suivante »). Dans le Tinetti, le panneau s’affiche
// dans une barre fixe sous les onglets pendant que l’on cote la grille ; ailleurs, sous le titre du test.
// Rien n’est enregistré sans ✓ ; une étape touchée ne s’annule pas (Recommencer refait tout).
type Timer = ReturnType<typeof useTugTimer>

// stepsOnly : seulement « par étapes » (le test rapide du TUG a déjà son chronomètre simple).
export function TugButtons({ timer, saved, previous, disabled, stepsOnly = false }: { timer: Timer; saved?: string; previous?: Measure; disabled?: boolean; stepsOnly?: boolean }) {
  const busy = disabled || timer.state.mode !== 'idle'
  return <div className="tug-start">
    {!stepsOnly && <button type="button" className="tug-button" disabled={busy} onClick={timer.startSimple}>⏱ TUG{saved ? ` · ${saved} s` : ''}</button>}
    <button type="button" className="tug-button" disabled={busy} onClick={timer.startSteps}>⏱ TUG par étapes</button>
    {previous && <span className={`previous-measure${previous.copied ? '' : ' pending'}`}><span className="previous-mark" aria-hidden="true">★</span> {previous.text} · {shortDate(previous.date)}</span>}
  </div>
}

export function TugBar({ timer, saved }: { timer: Timer; saved?: string }) {
  const { state } = timer
  const [now, setNow] = useState(() => performance.now())
  const running = state.mode === 'running' || state.mode === 'steps'
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(performance.now()), 100)
    return () => window.clearInterval(id)
  }, [running])
  if (state.mode === 'idle') return null
  const actions = (label: string) => <>
    <button type="button" className="primary" aria-label={saved ? 'Remplacer le TUG enregistré' : label} onClick={timer.save}>✓</button>
    <button type="button" onClick={timer.restart}>Recommencer</button>
    <button type="button" aria-label="Fermer le chronomètre sans enregistrer" onClick={timer.close}>✕</button>
  </>
  if (state.mode === 'running') return <div className="tug-bar running" role="group" aria-label="Chronomètre du TUG">
    <span className="tug-label">⏱ TUG</span>
    <output className="tug-time" aria-live="off">{chronoDisplay(now - state.start)}</output>
    <button type="button" className="primary" onClick={timer.stop}>Arrêter</button>
  </div>
  if (state.mode === 'steps') {
    const step = TUG_STEPS[state.marks.length]
    return <div className="tug-bar running steps" role="group" aria-label="Chronomètre du TUG">
      <span className="tug-label">⏱ {state.marks.length + 1}/{TUG_STEPS.length} · {step.label}</span>
      <output className="tug-time" aria-live="off">{chronoDisplay(now - state.start)}</output>
      <button type="button" className="primary tug-next" onClick={timer.next}>{state.marks.length + 1 === TUG_STEPS.length ? 'Fin' : 'Étape suivante'}</button>
    </div>
  }
  if (state.mode === 'stepsDone') return <div className="tug-bar steps-done" role="group" aria-label="Chronomètre du TUG">
    <ol className="tug-steps">{TUG_STEPS.map((step, index) => <li key={step.key}>{step.label} <b>{state.result.steps[index]} s</b></li>)}<li className="tug-total">Total <b>{state.result.total} s</b></li></ol>
    <span className="tug-actions">{actions('Enregistrer le TUG')}</span>
  </div>
  return <div className="tug-bar" role="group" aria-label="Chronomètre du TUG">
    <label className="tug-label">TUG <input type="text" inputMode="decimal" aria-label="Temps du TUG en secondes" value={state.value} onChange={event => timer.edit(event.target.value)} /> s</label>
    {actions('Enregistrer le TUG')}
  </div>
}
