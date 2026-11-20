import { useEffect, useRef, useState } from 'react'
import { TUG_STEPS, tugStepsFromMarks } from '../../domain/tug'
import { durationText, secondsValue } from './chronoFormat'

// Chronomètre unique des repères (TUG, TUG par étapes, Tinetti, assis-debout 30 s, 5 levers, station debout, 10 m, 6 min…) :
// un toucher le lance tout de suite ; « Arrêter » (ou « Étape suivante ») met la valeur directement dans le champ du test,
// ✕ annule et remet à zéro sans rien enregistrer. Secondes entières, tronquées. Un seul chronomètre à la fois.
export type ChronoSpec =
  | { mode: 'stopwatch'; label: string; key: string; text?: boolean }
  | { mode: 'countdown'; label: string; seconds: number }
  | { mode: 'tug'; label: string }
  | { mode: 'steps'; label: string }
export type ChronoState = { spec: ChronoSpec; start: number; marks: number[]; finished?: boolean } | null
export type ChronoResult = { key: string; value: string } | { tug: string; steps?: number[] }

// Bip de fin du compte à rebours. iOS n’autorise le son qu’après un geste : le contexte audio naît au toucher du départ.
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

export function useChrono(onResult: (result: ChronoResult) => void) {
  const [state, setState] = useState<ChronoState>(null)
  const [now, setNow] = useState(0)
  const audio = useRef<AudioContext | null>(null)
  const running = !!state && !state.finished
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(performance.now()), 200)
    return () => window.clearInterval(id)
  }, [running])
  // Fin du compte à rebours : bip et vibration ; la mesure (passages, distance) reste à saisir.
  const countdownEnd = state?.spec.mode === 'countdown' && !state.finished && now - state.start >= state.spec.seconds * 1000
  useEffect(() => {
    if (!countdownEnd) return
    setState(current => current && { ...current, finished: true })
    beep(audio.current)
    navigator.vibrate?.([300, 150, 300])
  }, [countdownEnd])
  useEffect(() => () => { void audio.current?.close() }, [])
  const start = (spec: ChronoSpec) => {
    if (spec.mode === 'countdown') { try { audio.current ??= new AudioContext(); void audio.current.resume() } catch { audio.current = null } }
    const time = performance.now()
    setNow(time); setState({ spec, start: time, marks: [] })
  }
  const elapsed = () => state ? performance.now() - state.start : 0
  const stop = () => {
    if (!state) return
    const { spec } = state
    if (spec.mode === 'stopwatch') onResult({ key: spec.key, value: spec.text ? durationText(elapsed()) : secondsValue(elapsed()) })
    if (spec.mode === 'tug') onResult({ tug: secondsValue(elapsed()) })
    setState(null)
  }
  const next = () => {
    if (state?.spec.mode !== 'steps') return
    const marks = [...state.marks, elapsed()]
    if (marks.length < TUG_STEPS.length) { setState({ ...state, marks }); return }
    const result = tugStepsFromMarks(marks)
    onResult({ tug: String(result.total), steps: result.steps })
    setState(null)
  }
  return { state, now, start, stop, next, cancel: () => setState(null) }
}
export type Chrono = ReturnType<typeof useChrono>
