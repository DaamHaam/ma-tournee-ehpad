import { useEffect, useState } from 'react'
import type { Measure } from '../../domain/mesures'
import { chronoDisplay, secondsValue } from './chronoFormat'
import { shortDate } from './display'

// Chronomètre du TUG pendant le Tinetti. Lancé depuis la partie Marche, il reste affiché dans une barre fixe sous les onglets
// pendant que l’on fait défiler et cote la grille ; à l’arrêt, la valeur se corrige puis ✓ l’enregistre (rien sans ce toucher).
export type TugState = { mode: 'idle' } | { mode: 'running'; start: number } | { mode: 'stopped'; value: string }

export function TugButton({ saved, previous, disabled, onStart }: { saved?: string; previous?: Measure; disabled: boolean; onStart: () => void }) {
  return <div className="tug-start">
    <button type="button" className="tug-button" disabled={disabled} onClick={onStart}>⏱ TUG{saved ? ` · ${saved} s` : ''}</button>
    {previous && <span className={`previous-measure${previous.copied ? '' : ' pending'}`}><span className="previous-mark" aria-hidden="true">★</span> {previous.text} · {shortDate(previous.date)}</span>}
  </div>
}

export function TugBar({ state, saved, onStop, onChange, onSave, onRestart, onClose }: {
  state: TugState; saved?: string
  onStop: (value: string) => void; onChange: (value: string) => void; onSave: () => void; onRestart: () => void; onClose: () => void
}) {
  const [now, setNow] = useState(() => performance.now())
  const running = state.mode === 'running'
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setNow(performance.now()), 100)
    return () => window.clearInterval(timer)
  }, [running])
  if (state.mode === 'idle') return null
  if (state.mode === 'running') return <div className="tug-bar running" role="group" aria-label="Chronomètre du TUG">
    <span className="tug-label">⏱ TUG</span>
    <output className="tug-time" aria-live="off">{chronoDisplay(now - state.start)}</output>
    <button type="button" className="primary" onClick={() => onStop(secondsValue(performance.now() - state.start))}>Arrêter</button>
  </div>
  return <div className="tug-bar" role="group" aria-label="Chronomètre du TUG">
    <label className="tug-label">TUG <input type="text" inputMode="decimal" aria-label="Temps du TUG en secondes" value={state.value} onChange={event => onChange(event.target.value)} /> s</label>
    <button type="button" className="primary" aria-label={saved ? 'Remplacer le TUG enregistré' : 'Enregistrer le TUG'} disabled={!state.value.trim()} onClick={onSave}>✓</button>
    <button type="button" onClick={onRestart}>Recommencer</button>
    <button type="button" aria-label="Fermer le chronomètre sans enregistrer" onClick={onClose}>✕</button>
  </div>
}
