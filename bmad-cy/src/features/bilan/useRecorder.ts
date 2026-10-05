import { useCallback, useEffect, useRef, useState } from 'react'

const TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']

// Enregistre le micro jusqu’à l’arrêt ou la durée maximale ; l’audio reste en mémoire, jamais sur l’appareil.
export function useRecorder(maxSeconds: number, onAudio: (audio: Blob) => void) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const discard = useRef(false)
  const deliver = useRef(onAudio)
  useEffect(() => { deliver.current = onAudio }, [onAudio])
  const stop = useCallback(() => { if (recorder.current?.state === 'recording') recorder.current.stop() }, [])
  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Enregistrement audio non disponible sur cet appareil.')
    let stream: MediaStream
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) }
    catch { throw new Error('Accès au micro refusé. Autorisez-le dans les réglages de l’iPhone.') }
    const mimeType = TYPES.find(type => MediaRecorder.isTypeSupported?.(type))
    let media: MediaRecorder
    try { media = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64000 } : undefined) }
    catch { stream.getTracks().forEach(track => track.stop()); throw new Error('Enregistrement audio non disponible sur cet appareil.') }
    const chunks: Blob[] = []
    media.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    media.onstop = () => {
      stream.getTracks().forEach(track => track.stop())
      window.clearInterval(timer.current)
      recorder.current = null
      setRecording(false)
      if (!discard.current && chunks.length) deliver.current(new Blob(chunks, { type: media.mimeType || mimeType || 'audio/mp4' }))
    }
    discard.current = false
    recorder.current = media
    try { media.start() }
    catch { recorder.current = null; stream.getTracks().forEach(track => track.stop()); throw new Error('Enregistrement audio impossible. Réessayez.') }
    const began = Date.now()
    setElapsed(0)
    setRecording(true)
    timer.current = window.setInterval(() => {
      const seconds = Math.min(maxSeconds, Math.floor((Date.now() - began) / 1000))
      setElapsed(seconds)
      if (seconds >= maxSeconds) stop()
    }, 250)
  }, [maxSeconds, stop])
  // Quitter la page pendant l’enregistrement l’abandonne.
  useEffect(() => () => { discard.current = true; window.clearInterval(timer.current); if (recorder.current?.state === 'recording') recorder.current.stop() }, [])
  return { recording, elapsed, start, stop }
}
