import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../storage/database'
import { DEFAULT_MODEL, formatDuration, KEY_SETTING, MAX_DICTATION_SECONDS, MODEL_SETTING } from './dictation'
import { transcribe } from './openrouter'
import { useRecorder } from './useRecorder'

export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return online
}

// Dictée commune au bilan libre et aux tests : enregistrement, transcription OpenRouter, nouvel essai.
// insert reçoit le texte tant que la page est ouverte ; afterLeave le reçoit si elle a été quittée entre-temps.
export function useDictation(insert: (text: string) => void, afterLeave: (text: string) => Promise<void>) {
  const [transcribing, setTranscribing] = useState(false)
  const [pending, setPending] = useState<Blob | null>(null)
  const [error, setError] = useState('')
  const mounted = useRef(true)
  const handlers = useRef({ insert, afterLeave })
  useEffect(() => { handlers.current = { insert, afterLeave } }, [insert, afterLeave])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const online = useOnline()
  const settings = useLiveQuery(async () => ({ key: (await db.settings.get(KEY_SETTING))?.value ?? '', model: (await db.settings.get(MODEL_SETTING))?.value || DEFAULT_MODEL }), [])
  const send = useCallback(async (audio: Blob) => {
    if (!settings?.key) return
    setTranscribing(true); setError('')
    try {
      const spoken = await transcribe(audio, settings.key, settings.model)
      if (mounted.current) { handlers.current.insert(spoken); setPending(null) }
      else await handlers.current.afterLeave(spoken)
    } catch (cause) {
      if (mounted.current) { setPending(audio); setError(cause instanceof Error ? cause.message : 'Transcription impossible.') }
    } finally { if (mounted.current) setTranscribing(false) }
  }, [settings])
  const { recording, elapsed, start, stop } = useRecorder(MAX_DICTATION_SECONDS, audio => void send(audio))
  const toggle = async () => {
    if (recording) { stop(); return }
    setError(''); setPending(null)
    try { await start() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.') }
  }
  return {
    recording, transcribing, error, pending, toggle,
    retry: () => { if (pending) void send(pending) },
    dismiss: () => { setPending(null); setError('') },
    hasKey: !!settings?.key,
    disabled: !recording && (transcribing || !settings?.key || !online),
    hint: !settings ? '' : !settings.key ? 'Pour dicter ici, ajoutez une clé OpenRouter dans Réglages. Le micro du clavier reste disponible.' : !online ? 'Hors ligne : utilisez le micro du clavier.' : '',
    status: recording ? `Enregistrement ${formatDuration(elapsed)} / ${formatDuration(MAX_DICTATION_SECONDS)}` : transcribing ? 'Transcription…' : '',
  }
}
