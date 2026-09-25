import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { localDate } from '../../domain/model'
import { repository } from '../../storage/repository'
import { exportTxt } from './exportTxt'
import { PatientImportPanel } from './PatientImportPanel'
import { BackupPanel } from './BackupPanel'
import { downloadFile } from './saveFile'

// Repli pour les navigateurs sans presse-papiers asynchrone (contexte non sécurisé, ancien Safari).
function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0'
  document.body.appendChild(area); area.select()
  try { return document.execCommand('copy') } finally { area.remove() }
}

export function ExportPage() {
  const today = localDate()
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [preview, setPreview] = useState('')
  const [previewRange, setPreviewRange] = useState({ start, end })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const requestRef = useRef(0)
  const file = useMemo(() => preview ? new File([preview], `tournee-${previewRange.start}-${previewRange.end}.txt`, { type: 'text/plain;charset=utf-8' }) : null, [preview, previewRange])

  const generate = useCallback(async () => {
    const request = ++requestRef.current
    const range = { start, end }
    setBusy(true); setMessage('')
    try {
      const days = await repository.daysBetween(range.start, range.end)
      const text = exportTxt(days)
      if (request !== requestRef.current) return
      setPreview(text)
      setPreviewRange(range)
      setMessage(text ? '' : 'Rien à exporter sur cette période.')
    } catch (cause) {
      if (request !== requestRef.current) return
      setPreview('')
      setMessage(cause instanceof Error ? cause.message : 'Impossible de préparer cet export.')
    } finally { if (request === requestRef.current) setBusy(false) }
  }, [end, start])
  useEffect(() => { void generate() }, [generate])

  const download = () => { if (file) downloadFile(file) }
  const copy = async () => {
    try { await navigator.clipboard.writeText(preview); setMessage('Copié.') }
    catch { setMessage(copyWithSelection(preview) ? 'Copié.' : 'Copie impossible.') }
  }
  const share = async () => {
    if (!file || !navigator.share) return
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: 'Export de tournée', files: [file] })
      else await navigator.share({ title: 'Export de tournée', text: preview })
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setMessage('Partage impossible.')
    }
  }

  return <>
    <div className="page-heading"><h1>Réglages / Export</h1></div>
    <section className="card export-controls"><h2>Période</h2><div className="date-range"><label>Du <input type="date" value={start} onChange={event => { setPreview(''); setStart(event.target.value) }} /></label><label>Au <input type="date" value={end} onChange={event => { setPreview(''); setEnd(event.target.value) }} /></label></div><button className="primary" disabled={busy} onClick={() => void generate()}>Actualiser</button><p className={message.startsWith('La date') || message.startsWith('Impossible') ? 'field-error' : 'save-hint'} role="status">{message}</p></section>
    {preview && <section className="card export-preview"><div className="section-heading"><h2>Aperçu TXT</h2></div>{preview && <pre>{preview}</pre>}<div className="action-row"><button disabled={!preview} onClick={() => void copy()}>Copier</button><button disabled={!preview} onClick={download}>Télécharger .txt</button>{typeof navigator.share === 'function' && <button className="primary" disabled={!preview} onClick={() => void share()}>Partager</button>}</div></section>}
    <BackupPanel />
    <PatientImportPanel />
    <p className="app-version">Version {__APP_VERSION__}</p>
  </>
}
