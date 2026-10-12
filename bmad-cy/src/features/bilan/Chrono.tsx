import { useEffect, useRef, useState } from 'react'
import { fieldOf, type Chrono } from '../../domain/marcheEquilibre'
import { chronoDisplay, countdownDisplay, durationText, secondsValue } from './chronoFormat'

// Bip de fin du compte à rebours. iOS n’autorise le son qu’après un geste : le contexte audio naît au toucher de « Démarrer ».
function beep(audio: AudioContext | null) {
  if (!audio) return
  for (const start of [0, 0.35, 0.7]) {
    const oscillator = audio.createOscillator(), gain = audio.createGain()
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.25, audio.currentTime + start)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + 0.25)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(audio.currentTime + start); oscillator.stop(audio.currentTime + start + 0.3)
  }
}

// Chronomètre d’un test minuté : le temps arrêté remplit le champ du test (secondes, ou durée pour un champ texte) ;
// compte à rebours (30 s, 6 min) avec signal de fin, la mesure (passages, distance) restant à saisir.
export function ChronoPanel({ chrono, disabled = false, onTime }: { chrono: Chrono; disabled?: boolean; onTime: (key: string, value: string) => void }) {
  const [state, setState] = useState<{ start: number | null; elapsed: number }>({ start: null, elapsed: 0 })
  const [now, setNow] = useState(0)
  const audio = useRef<AudioContext | null>(null)
  const running = state.start !== null
  const elapsed = running ? state.elapsed + now - state.start! : state.elapsed
  const countdown = chrono.mode === 'countdown' ? chrono.seconds * 1000 : 0
  const finished = chrono.mode === 'countdown' && elapsed >= countdown
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setNow(performance.now()), 100)
    return () => window.clearInterval(timer)
  }, [running])
  // Fin du compte à rebours : arrêt, bip et vibration (si l’appareil le permet).
  useEffect(() => {
    if (!running || !finished) return
    setState({ start: null, elapsed: countdown })
    beep(audio.current)
    navigator.vibrate?.([300, 150, 300])
  }, [running, finished, countdown])
  useEffect(() => () => { void audio.current?.close() }, [])
  const start = () => {
    try { audio.current ??= new AudioContext(); void audio.current.resume() } catch { audio.current = null }
    const time = performance.now()
    setNow(time)
    setState({ start: time, elapsed: chrono.mode === 'countdown' && finished ? 0 : state.elapsed })
  }
  const stop = () => {
    const total = state.elapsed + performance.now() - state.start!
    setState({ start: null, elapsed: total })
    if (chrono.mode === 'stopwatch') onTime(chrono.key, fieldOf(chrono.key)?.control.kind === 'text' ? durationText(total) : secondsValue(total))
  }
  const reset = () => setState({ start: null, elapsed: 0 })
  const shown = chrono.mode === 'countdown' ? countdownDisplay(countdown - elapsed) : chronoDisplay(elapsed)
  return <div className={`chrono${running ? ' running' : ''}${finished ? ' finished' : ''}`} role="group" aria-label={chrono.mode === 'countdown' ? 'Compte à rebours' : 'Chronomètre'}>
    <output className="chrono-time" aria-live={finished ? 'assertive' : 'off'}>{finished ? 'Terminé' : shown}</output>
    {running
      ? <button type="button" className="primary chrono-main" onClick={stop}>Arrêter</button>
      : <button type="button" className="primary chrono-main" disabled={disabled} onClick={start}>{state.elapsed && !finished ? 'Reprendre' : chrono.mode === 'countdown' ? `Démarrer ${countdownDisplay(countdown)}` : 'Démarrer'}</button>}
    {!running && state.elapsed > 0 && <button type="button" onClick={reset}>Remettre à zéro</button>}
  </div>
}
