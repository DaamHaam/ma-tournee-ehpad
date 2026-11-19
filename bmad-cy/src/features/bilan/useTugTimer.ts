import { useState } from 'react'
import { TUG_STEPS, tugStepsFromMarks, type TugSteps } from '../../domain/tug'
import { secondsValue } from './chronoFormat'

// État du chronomètre du Timed Up and Go (simple ou par étapes), partagé par le Tinetti, les tests rapides et les repères.
export type TugState =
  | { mode: 'idle' }
  | { mode: 'running'; start: number }
  | { mode: 'steps'; start: number; marks: number[] }
  | { mode: 'stopped'; value: string }
  | { mode: 'stepsDone'; result: TugSteps }
export interface TugResult { total: string; steps?: number[] }

export function useTugTimer(onSave: (result: TugResult) => void, saved?: string) {
  const [state, setState] = useState<TugState>({ mode: 'idle' })
  const startSimple = () => setState({ mode: 'running', start: performance.now() })
  const startSteps = () => setState({ mode: 'steps', start: performance.now(), marks: [] })
  const save = () => {
    const result: TugResult | null = state.mode === 'stopped' ? { total: state.value.trim().replace('.', ',') } : state.mode === 'stepsDone' ? { total: String(state.result.total), steps: state.result.steps } : null
    if (!result || !result.total) return
    if (saved && saved !== result.total && !window.confirm(`Remplacer le TUG déjà enregistré (${saved} s) par ${result.total} s ?`)) return
    setState({ mode: 'idle' }); onSave(result)
  }
  const next = () => {
    if (state.mode !== 'steps') return
    const marks = [...state.marks, performance.now() - state.start]
    setState(marks.length === TUG_STEPS.length ? { mode: 'stepsDone', result: tugStepsFromMarks(marks) } : { ...state, marks })
  }
  return {
    state, startSimple, startSteps, save, next,
    stop: () => { if (state.mode === 'running') setState({ mode: 'stopped', value: secondsValue(performance.now() - state.start) }) },
    edit: (value: string) => setState({ mode: 'stopped', value }),
    restart: () => setState(state.mode === 'stepsDone' || state.mode === 'steps' ? { mode: 'steps', start: performance.now(), marks: [] } : { mode: 'running', start: performance.now() }),
    close: () => setState({ mode: 'idle' }),
  }
}
