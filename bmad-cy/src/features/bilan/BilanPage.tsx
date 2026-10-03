import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { fullName, parseDate, validDate } from '../../domain/model'
import { copyText } from '../exports/clipboard'
import { DEFAULT_MODEL, formatDuration, insertAtCursor, KEY_SETTING, MAX_DICTATION_SECONDS, MODEL_SETTING } from './dictation'
import { transcribe } from './openrouter'
import { useRecorder } from './useRecorder'

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return online
}

// Bilan libre du jour en plein écran ; ne part pas dans l’export TXT.
export function BilanPage() {
  const { date = '', id = '' } = useParams()
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  if (!valid) return <Navigate replace to="/" />
  if (!day) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <BilanEditor key={`${date}-${id}`} date={date} id={id} name={fullName(entry.patient)} initial={entry.bilan ?? ''} />
}

function BilanEditor({ date, id, name, initial }: { date: string; id: string; name: string; initial: string }) {
  const { run } = useSave()
  const [text, setText] = useState(initial)
  const [copied, setCopied] = useState<boolean | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [pending, setPending] = useState<Blob | null>(null)
  const [error, setError] = useState('')
  const area = useRef<HTMLTextAreaElement>(null)
  const latest = useRef(initial)
  const mounted = useRef(true)
  const cursor = useRef<number | null>(initial.length)
  // Dernière position du curseur dans le texte : toucher le micro retire le focus et certains navigateurs oublient alors la sélection.
  const caret = useRef({ start: initial.length, end: initial.length })
  const online = useOnline()
  const settings = useLiveQuery(async () => ({ key: (await db.settings.get(KEY_SETTING))?.value ?? '', model: (await db.settings.get(MODEL_SETTING))?.value || DEFAULT_MODEL }), [])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  // Place le curseur après la dernière dictée (ou en fin de texte à l’ouverture) pour enchaîner les dictées.
  useLayoutEffect(() => { if (cursor.current !== null && area.current) { area.current.setSelectionRange(cursor.current, cursor.current); caret.current = { start: cursor.current, end: cursor.current }; cursor.current = null } }, [text])
  const track = () => { if (area.current) caret.current = { start: area.current.selectionStart, end: area.current.selectionEnd } }
  const save = useCallback((value: string) => { latest.current = value; setText(value); void run(() => repository.setBilan(date, id, value)) }, [date, id, run])
  const send = useCallback(async (audio: Blob) => {
    if (!settings?.key) return
    setTranscribing(true); setError('')
    try {
      const spoken = await transcribe(audio, settings.key, settings.model)
      // Insertion à la position du curseur au moment où le texte revient ; page quittée entre-temps : ajout en fin de bilan.
      if (mounted.current && document.activeElement === area.current) track()
      const result = mounted.current ? insertAtCursor(latest.current, spoken, caret.current.start, caret.current.end) : insertAtCursor(latest.current, spoken, latest.current.length)
      if (mounted.current) { cursor.current = result.cursor; save(result.value); setPending(null) }
      else { latest.current = result.value; await run(() => repository.setBilan(date, id, result.value)) }
    } catch (cause) {
      if (mounted.current) { setPending(audio); setError(cause instanceof Error ? cause.message : 'Transcription impossible.') }
    } finally { if (mounted.current) setTranscribing(false) }
  }, [date, id, run, save, settings])
  const { recording, elapsed, start, stop } = useRecorder(MAX_DICTATION_SECONDS, audio => void send(audio))
  const toggle = async () => {
    if (recording) { stop(); return }
    setError(''); setPending(null)
    try { await start() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.') }
  }
  const copy = async () => { setCopied(await copyText(text)); window.setTimeout(() => setCopied(null), 1500) }
  const hint = !settings ? '' : !settings.key ? 'Pour dicter ici, ajoutez une clé OpenRouter dans Réglages. Le micro du clavier reste disponible.' : !online ? 'Hors ligne : utilisez le micro du clavier.' : ''
  const status = recording ? `Enregistrement ${formatDuration(elapsed)} / ${formatDuration(MAX_DICTATION_SECONDS)}` : transcribing ? 'Transcription…' : ''
  return <div className="bilan-page">
    <header className="bilan-header">
      <Link className="bilan-back" to={`/?date=${date}`} aria-label="Retour à la journée">‹ Journée</Link>
      <div className="bilan-title"><h1>{name}</h1><span>{parseDate(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <button type="button" className={copied ? 'copied' : ''} disabled={!text.trim()} onClick={() => void copy()}>{copied === null ? 'Copier' : copied ? 'Copié ✓' : 'Copie impossible'}</button>
    </header>
    <textarea ref={area} className="bilan-text" aria-label={`Bilan du jour pour ${name}`} placeholder="Bilan" value={text} onChange={event => { save(event.target.value); track() }} onSelect={track} />
    <footer className="bilan-dictation">
      {error && <p className="field-error" role="alert">{error}</p>}
      {pending && !transcribing && <div className="action-row"><button type="button" onClick={() => void send(pending)}>Réessayer la transcription</button><button type="button" onClick={() => { setPending(null); setError('') }}>Abandonner</button></div>}
      {hint && <p className="save-hint">{hint}{!settings?.key && <> <Link to="/settings">Réglages</Link></>}</p>}
      <p className="dictation-status" role="status">{status}</p>
      <button type="button" className={`mic${recording ? ' recording' : ''}`} aria-label={recording ? 'Arrêter la dictée' : 'Démarrer la dictée'} disabled={!recording && (transcribing || !settings?.key || !online)} onClick={() => void toggle()}>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{recording ? <rect x="7" y="7" width="10" height="10" rx="1.5" /> : <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />}</svg>
      </button>
    </footer>
  </div>
}
