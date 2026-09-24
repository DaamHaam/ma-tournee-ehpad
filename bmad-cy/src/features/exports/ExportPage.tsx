import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { localDate } from '../../domain/model'
import { repository } from '../../storage/repository'
import { exportTxt } from './exportTxt'

function firstDayOfMonth(date: string) { return `${date.slice(0, 7)}-01` }

export function ExportPage() {
  const today = localDate()
  const [start, setStart] = useState(firstDayOfMonth(today))
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
      setMessage(text ? `${days.length} journée${days.length === 1 ? '' : 's'} parcourue${days.length === 1 ? '' : 's'}.` : 'Aucune trace à exporter sur cette période.')
    } catch (cause) {
      if (request !== requestRef.current) return
      setPreview('')
      setMessage(cause instanceof Error ? cause.message : 'Impossible de préparer cet export.')
    } finally { if (request === requestRef.current) setBusy(false) }
  }, [end, start])
  useEffect(() => { void generate() }, [generate])

  const download = () => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url; link.download = file.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const share = async () => {
    if (!file || !navigator.share) return
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: 'Export de tournée', files: [file] })
      else await navigator.share({ title: 'Export de tournée', text: preview })
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setMessage('Le partage n’a pas abouti. Vous pouvez télécharger le fichier à la place.')
    }
  }

  return <>
    <div className="page-heading"><div><p className="eyebrow">Données locales</p><h1>Réglages / Export</h1></div></div>
    <section className="card export-controls"><h2>Période du pointage</h2><div className="date-range"><label>Du <input type="date" value={start} onChange={event => { setPreview(''); setStart(event.target.value) }} /></label><label>Au <input type="date" value={end} onChange={event => { setPreview(''); setEnd(event.target.value) }} /></label></div><button className="primary" disabled={busy} onClick={() => void generate()}>{busy ? 'Préparation…' : 'Actualiser l’aperçu'}</button><p className={message.startsWith('La date') || message.startsWith('Impossible') ? 'field-error' : 'save-hint'} role="status">{message}</p></section>
    <section className="card export-preview"><div className="section-heading"><h2>Aperçu TXT</h2>{preview && <span>{preview.length} caractères</span>}</div>{preview ? <pre>{preview}</pre> : <div className="empty-preview">L’aperçu apparaîtra ici dès qu’une journée contient une séance, une note ou un commentaire.</div>}<div className="action-row"><button disabled={!preview} onClick={download}>Télécharger .txt</button>{typeof navigator.share === 'function' && <button className="primary" disabled={!preview} onClick={() => void share()}>Partager</button>}</div></section>
    <section className="card local-info"><h2>Sur cet appareil</h2><p>Patients, journées et préférences restent dans le stockage local de ce navigateur. Cette première version ne synchronise rien vers un serveur.</p><p className="notice compact">Pour éviter une perte, ne supprimez pas les données de site de Safari et conservez régulièrement vos exports TXT.</p></section>
  </>
}
