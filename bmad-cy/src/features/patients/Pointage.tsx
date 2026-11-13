import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { moodSigns, parseDate, shortName, type Day } from '../../domain/model'
import { pointageDays, pointageMonths, pointageView, previousMonthStart, type BelowKind, type ChipKind } from '../../domain/pointage'
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

const CHIP_LABEL: Record<ChipKind, string> = { A: 'séance A', B: 'séance B', red: 'prévu non vu, à dépointer' }
const BELOW_LABEL: Record<BelowKind, string> = { removed: 'retiré du pointage', done: 'dépointé', unplanned: 'non prévu' }
const chipClass: Record<ChipKind, string> = { A: 'a', B: 'b', red: 'red' }

// Vue Pointage (pointage définitif) : jours pointés du plus récent au plus ancien. En haut, A en bleu, B en orange et,
// en rouge, les patients prévus (L, J, V) mais pas vus, à dépointer ; toucher un patient le descend dans « Non pointés »,
// un second toucher le remonte. Les signes H et la capacité du jour (10 ± 1 sans signe) suivent la date.
export function Pointage() {
  const allDays = useLiveQuery(() => db.days.toArray(), [])
  const patients = useLiveQuery(async () => new Map((await db.patients.toArray()).map(patient => [patient.id, patient])), [])
  const days = useMemo(() => pointageDays(allDays ?? []), [allDays])
  const months = useMemo(() => pointageMonths(days), [days])
  const { run } = useSave()
  if (!allDays || !patients) return null
  const jump = (month: string) => document.getElementById(`pointage-${month}`)?.scrollIntoView({ block: 'start' })
  const toggle = (date: string, id: string) => void run(() => repository.toggleUnpointed(date, id))
  return <>
    <PointageExport days={allDays} />
    {!days.length ? <div className="empty-state"><h2>Aucune séance pointée</h2></div> : <>
      <label className="pointage-month">Aller au mois <select value="" onChange={event => jump(event.target.value)}><option value="" disabled>Choisir…</option>{months.map(month => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></label>
      {months.map(month => <section key={month} id={`pointage-${month}`} className="pointage-month-block" aria-label={monthLabel(month)}>
        <h2 className="pointage-month-title">{monthLabel(month)}</h2>
        {days.filter(day => day.date.startsWith(month)).map(day => {
          const view = pointageView(day, patients)
          const signs = moodSigns(day.mood)
          return <article key={day.date} className="pointage-day card">
            <header>
              <h3>{dayLabel(day.date)}{signs && <span className="pointage-mood"> {signs}</span>}{day.pointageExportedAt && <span className="pointage-exported" title={`Exporté le ${shortDate(day.pointageExportedAt)}`}> ⇪<span className="sr-only"> (exporté le {shortDate(day.pointageExportedAt)})</span></span>}</h3>
              <span className={`pointage-count${view.warning ? ' warning' : ''}`}>{view.a} A · {view.b} B{view.warning && <span className="pointage-warning" title={`Capacité ${view.capacity} ± 1`}> ⚠ {view.a + view.b} pour {view.capacity} ± 1</span>}</span>
            </header>
            {!!view.top.length && <ul className="pointage-chips">{view.top.map(({ id, entry, kind }) => <li key={id}>
              <button type="button" className={`pointage-chip ${chipClass[kind]}`} aria-label={`${shortName(entry.patient)}, ${CHIP_LABEL[kind]}`} onClick={() => toggle(day.date, id)}>
                <span className="pointage-name">{shortName(entry.patient)}</span>
                {(entry.note.trim() || entry.pause !== undefined) && <span className="pointage-note">{[entry.pause !== undefined && `Pause${entry.pause ? ` : ${entry.pause}` : ''}`, entry.note.trim()].filter(Boolean).join(' · ')}</span>}
              </button>
            </li>)}</ul>}
            {!!view.below.length && <div className="pointage-below"><span className="pointage-below-title">Non pointés</span>
              <ul>{view.below.map(({ id, entry, kind }) => <li key={id} className={kind}>
                {kind === 'unplanned' ? <span>{shortName(entry.patient)}</span> : <button type="button" aria-label={`${shortName(entry.patient)}, ${BELOW_LABEL[kind]}, remonter`} onClick={() => toggle(day.date, id)}>{shortName(entry.patient)}{kind === 'removed' && <span className="pointage-was"> ({entry.session})</span>}{kind === 'done' && <span className="pointage-was"> ✓</span>}</button>}
              </li>)}</ul>
            </div>}
          </article>
        })}
      </section>)}
    </>}
  </>
}

// Export du pointage définitif sur une période : format de l’export de la journée sans les signes H ni les séances retirées.
// Copier, télécharger ou partager marque les jours exportés (⇪), pour voir plus tard où l’on s’était arrêté.
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
    <summary>Exporter le pointage définitif</summary>
    <div className="date-range"><label>Du <input type="date" value={start} onChange={event => { setStart(event.target.value); setMessage('') }} /></label><label>Au <input type="date" value={end} onChange={event => { setEnd(event.target.value); setMessage('') }} /></label></div>
    {!valid ? <p className="field-error" role="status">La date de début doit précéder ou être égale à la date de fin.</p> : !text ? <p className="save-hint" role="status">Rien à exporter sur cette période.</p> : <>
      <pre className="pointage-preview">{text}</pre>
      <div className="action-row"><button className={copied ? 'copied' : ''} onClick={() => void copy()}>{copied ? 'Copié ✓' : 'Copier'}</button><button onClick={() => void download()}>Télécharger .txt</button>{typeof navigator.share === 'function' && <button className="primary" onClick={() => void share()}>Partager</button>}</div>
    </>}
    {message && <p className="field-error" role="status">{message}</p>}
  </details>
}
