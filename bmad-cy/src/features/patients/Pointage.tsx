import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { parseDate, shortName, type Day } from '../../domain/model'
import { pointageCounts, pointageDays, pointageEntries, pointageMonths, previousMonthStart } from '../../domain/pointage'
import { useSave } from '../../app/SaveContext'
import { useToday } from '../../app/useToday'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { exportPointage } from '../exports/exportTxt'
import { copyText } from '../exports/clipboard'
import { downloadFile } from '../exports/saveFile'

const monthLabel = (month: string) => parseDate(`${month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
const dayLabel = (date: string) => parseDate(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = (date: string) => parseDate(date).toLocaleDateString('fr-FR')

// Vue Pointage : jours passés (du plus récent au plus ancien), séances A en bleu et B en orange, note en petit dessous.
// Toucher un patient le retire du pointage de ce jour (barré) ; un second toucher le remet. Rien d’autre ne change.
export function Pointage() {
  const allDays = useLiveQuery(() => db.days.toArray(), [])
  const days = useMemo(() => pointageDays(allDays ?? []), [allDays])
  const months = useMemo(() => pointageMonths(days), [days])
  const { run } = useSave()
  if (!allDays) return null
  const jump = (month: string) => document.getElementById(`pointage-${month}`)?.scrollIntoView({ block: 'start' })
  return <>
    <PointageExport days={allDays} />
    {!days.length ? <div className="empty-state"><h2>Aucune séance pointée</h2></div> : <>
      <label className="pointage-month">Aller au mois <select value="" onChange={event => jump(event.target.value)}><option value="" disabled>Choisir…</option>{months.map(month => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></label>
      {months.map(month => <section key={month} id={`pointage-${month}`} className="pointage-month-block" aria-label={monthLabel(month)}>
        <h2 className="pointage-month-title">{monthLabel(month)}</h2>
        {days.filter(day => day.date.startsWith(month)).map(day => {
          const counts = pointageCounts(day)
          return <article key={day.date} className="pointage-day card">
            <header><h3>{dayLabel(day.date)}{day.pointageExportedAt && <span className="pointage-exported" title={`Exporté le ${shortDate(day.pointageExportedAt)}`}> ⇪<span className="sr-only"> (exporté le {shortDate(day.pointageExportedAt)})</span></span>}</h3><span className="pointage-count">{counts.a} A · {counts.b} B</span></header>
            <ul>{pointageEntries(day).map(({ id, entry }) => <li key={id}>
              <button type="button" className={`pointage-chip ${entry.session === 'A' ? 'a' : 'b'}${entry.unpointed ? ' removed' : ''}`} aria-pressed={!entry.unpointed} aria-label={`${shortName(entry.patient)}, séance ${entry.session}${entry.unpointed ? ', retiré du pointage' : ''}`} onClick={() => void run(() => repository.toggleUnpointed(day.date, id))}>
                <span className="pointage-name">{shortName(entry.patient)}</span>
                {entry.note.trim() && <span className="pointage-note">{entry.note.trim()}</span>}
              </button>
            </li>)}</ul>
          </article>
        })}
      </section>)}
    </>}
  </>
}

// Export du pointage sur une période : même format que l’export de la journée, sans les séances retirées.
// Copier, télécharger ou partager marque les jours exportés (⇪).
function PointageExport({ days }: { days: Day[] }) {
  const today = useToday()
  const [start, setStart] = useState(() => previousMonthStart(today))
  const [end, setEnd] = useState(today)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const valid = !!start && !!end && start <= end
  const inRange = useMemo(() => valid ? days.filter(day => day.date >= start && day.date <= end) : [], [days, start, end, valid])
  const text = useMemo(() => exportPointage(inRange), [inRange])
  const file = useMemo(() => text ? new File([text], `pointage-${start}-${end}.txt`, { type: 'text/plain;charset=utf-8' }) : null, [text, start, end])
  const markExported = () => repository.markPointageExported(pointageDays(inRange).map(day => day.date), today)
  const copy = async () => {
    if (!await copyText(text)) { setMessage('Copie impossible.'); return }
    setCopied(true); window.setTimeout(() => setCopied(false), 1500)
    await markExported()
  }
  const download = async () => { if (!file) return; downloadFile(file); await markExported() }
  const share = async () => {
    if (!file || !navigator.share) return
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: 'Pointage', files: [file] })
      else await navigator.share({ title: 'Pointage', text })
      await markExported()
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      setMessage('Partage impossible.')
    }
  }
  return <details className="card pointage-export">
    <summary>Exporter le pointage</summary>
    <div className="date-range"><label>Du <input type="date" value={start} onChange={event => { setStart(event.target.value); setMessage('') }} /></label><label>Au <input type="date" value={end} onChange={event => { setEnd(event.target.value); setMessage('') }} /></label></div>
    {!valid ? <p className="field-error" role="status">La date de début doit précéder ou être égale à la date de fin.</p> : !text ? <p className="save-hint" role="status">Rien à exporter sur cette période.</p> : <>
      <pre className="pointage-preview">{text}</pre>
      <div className="action-row"><button className={copied ? 'copied' : ''} onClick={() => void copy()}>{copied ? 'Copié ✓' : 'Copier'}</button><button onClick={() => void download()}>Télécharger .txt</button>{typeof navigator.share === 'function' && <button className="primary" onClick={() => void share()}>Partager</button>}</div>
    </>}
    {message && <p className="field-error" role="status">{message}</p>}
  </details>
}
