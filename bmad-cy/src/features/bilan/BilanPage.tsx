import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { fullName, parseDate, validDate } from '../../domain/model'
import { DEFAULT_MODEL, formatDuration, KEY_SETTING, MAX_DICTATION_SECONDS, MODEL_SETTING } from './dictation'
import { transcribe } from './openrouter'
import { useRecorder } from './useRecorder'
import { useBilanCopy } from './useBilanCopy'
import { RichEditor, type RichEditorHandle } from './RichEditor'
import { appendText, bilanHtml, htmlToText } from './richText'

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return online
}

// Zone réellement visible : sur iPhone, le clavier ouvert la réduit sans redimensionner la page.
function useVisibleViewport() {
  const [box, setBox] = useState<{ height: number; top: number } | null>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setBox({ height: viewport.height, top: viewport.offsetTop })
    update()
    viewport.addEventListener('resize', update); viewport.addEventListener('scroll', update)
    return () => { viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update) }
  }, [])
  return box
}

// Bilan libre du jour en plein écran ; ne part pas dans l’export TXT.
export function BilanPage() {
  const { date = '', id = '' } = useParams()
  const from = (useLocation().state as { from?: unknown } | null)?.from
  const back = typeof from === 'string' && from.startsWith('/') ? from : `/?date=${date}`
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  if (!valid) return <Navigate replace to="/" />
  if (!day) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <BilanEditor key={`${date}-${id}`} date={date} id={id} back={back} name={fullName(entry.patient)} initial={bilanHtml(entry)} />
}

function BilanEditor({ date, id, back, name, initial }: { date: string; id: string; back: string; name: string; initial: string }) {
  const { run } = useSave()
  const [html, setHtml] = useState(initial)
  const { copied, copy } = useBilanCopy(date, id)
  const [transcribing, setTranscribing] = useState(false)
  const [pending, setPending] = useState<Blob | null>(null)
  const [error, setError] = useState('')
  const editor = useRef<RichEditorHandle>(null)
  const latest = useRef(initial)
  const mounted = useRef(true)
  const online = useOnline()
  // Mode dictée par défaut : toucher le texte place le curseur sans ouvrir le clavier ; le bouton clavier l’ouvre pour taper.
  const [keyboard, setKeyboard] = useState(false)
  const viewport = useVisibleViewport()
  const settings = useLiveQuery(async () => ({ key: (await db.settings.get(KEY_SETTING))?.value ?? '', model: (await db.settings.get(MODEL_SETTING))?.value || DEFAULT_MODEL }), [])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const save = useCallback((value: string, text: string) => { latest.current = value; setHtml(value); void run(() => repository.setBilan(date, id, text, value)) }, [date, id, run])
  const send = useCallback(async (audio: Blob) => {
    if (!settings?.key) return
    setTranscribing(true); setError('')
    try {
      const spoken = await transcribe(audio, settings.key, settings.model)
      // Insertion à la position du curseur au moment où le texte revient ; page quittée entre-temps : ajout en fin de bilan.
      if (mounted.current && editor.current) { editor.current.insertText(spoken); setPending(null) }
      else { const value = appendText(latest.current, spoken); latest.current = value; await run(() => repository.setBilan(date, id, htmlToText(value), value)) }
    } catch (cause) {
      if (mounted.current) { setPending(audio); setError(cause instanceof Error ? cause.message : 'Transcription impossible.') }
    } finally { if (mounted.current) setTranscribing(false) }
  }, [date, id, run, settings])
  const { recording, elapsed, start, stop } = useRecorder(MAX_DICTATION_SECONDS, audio => void send(audio))
  const toggle = async () => {
    if (recording) { stop(); return }
    setError(''); setPending(null)
    try { await start() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.') }
  }
  const toggleKeyboard = () => { editor.current?.setKeyboard(!keyboard); setKeyboard(!keyboard) }
  const empty = !htmlToText(html).trim()
  const hint = !settings ? '' : !settings.key ? 'Pour dicter ici, ajoutez une clé OpenRouter dans Réglages. Le micro du clavier reste disponible.' : !online ? 'Hors ligne : utilisez le micro du clavier.' : ''
  const status = recording ? `Enregistrement ${formatDuration(elapsed)} / ${formatDuration(MAX_DICTATION_SECONDS)}` : transcribing ? 'Transcription…' : ''
  return <div className="bilan-page" style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>
    <header className="bilan-header">
      <Link className="bilan-back" to={back} aria-label={back.startsWith('/bilans') ? 'Retour aux bilans' : 'Retour à la journée'}>‹ {back.startsWith('/bilans') ? 'Bilans' : 'Journée'}</Link>
      <div className="bilan-title"><h1>{name}</h1><span>{parseDate(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <button type="button" className={copied ? 'copied' : ''} disabled={empty} onClick={() => void copy(html)}>{copied === null ? 'Copier' : copied ? 'Copié ✓' : 'Copie impossible'}</button>
    </header>
    <RichEditor ref={editor} initialHtml={initial} label={`Bilan du jour pour ${name}`} keyboard={keyboard} onChange={save} />
    <footer className="bilan-dictation">
      {error && <p className="field-error" role="alert">{error}</p>}
      {pending && !transcribing && <div className="action-row"><button type="button" onClick={() => void send(pending)}>Réessayer la transcription</button><button type="button" onClick={() => { setPending(null); setError('') }}>Abandonner</button></div>}
      {hint && <p className="save-hint">{hint}{!settings?.key && <> <Link to="/settings">Réglages</Link></>}</p>}
      <p className="dictation-status" role="status">{status}</p>
      <div className="dictation-bar">
        <button type="button" className="newline-button" aria-label="Aller à la ligne" title="Aller à la ligne" onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.insertLineBreak()}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 5v7a3 3 0 0 1-3 3H6M10 11l-4 4 4 4" /></svg>
        </button>
        <button type="button" className={`mic${recording ? ' recording' : ''}`} aria-label={recording ? 'Arrêter la dictée' : 'Démarrer la dictée'} disabled={!recording && (transcribing || !settings?.key || !online)} onClick={() => void toggle()}>
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{recording ? <rect x="7" y="7" width="10" height="10" rx="1.5" /> : <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />}</svg>
        </button>
        <button type="button" className="keyboard-toggle" aria-pressed={keyboard} aria-label={keyboard ? 'Fermer le clavier' : 'Ouvrir le clavier'} onPointerDown={event => event.preventDefault()} onClick={toggleKeyboard}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9" /></svg>
        </button>
      </div>
    </footer>
  </div>
}
