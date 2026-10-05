import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../storage/database'
import { dateLabel, dayBilans, fullName, shortName, validDate } from '../../domain/model'
import { useToday } from '../../app/useToday'
import { BilanActions } from './BilanActions'
import { bilanHtml } from './richText'

// Bilans d’une journée (aujourd’hui par défaut), repliés, à reporter un par un dans le logiciel de la résidence.
export function BilansPage() {
  const [params, setParams] = useSearchParams()
  const today = useToday()
  const raw = params.get('date')
  const date = raw && validDate(raw) ? raw : today
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const bilans = useLiveQuery(async () => { const day = await db.days.get(date); return day ? dayBilans(day) : [] }, [date])
  const copied = bilans?.filter(bilan => bilan.copied).length ?? 0
  return <>
    <div className="page-heading"><label className="date-heading"><h1 className="date-title">{dateLabel(date)}</h1><input type="date" aria-label="Date" value={date} onChange={event => { if (validDate(event.target.value)) setParams({ date: event.target.value }) }} /></label></div>
    {bilans && <>
      <div className="section-heading"><h2>{bilans.length ? `${copied} / ${bilans.length} bilans copiés` : 'Aucun bilan ce jour'}</h2></div>
      {!!bilans.length && <ol className="card bilan-list">{bilans.map(bilan => {
        const name = fullName(bilan.patient)
        const expanded = !!open[`${date}:${bilan.id}`]
        return <li key={bilan.id} className={bilan.copied ? 'copied' : ''}>
          <div className="bilan-row">
            <button type="button" className="bilan-summary" aria-expanded={expanded} onClick={() => setOpen(current => ({ ...current, [`${date}:${bilan.id}`]: !expanded }))}>
              <span className="triangle" aria-hidden="true" /><strong>{shortName(bilan.patient)}</strong>{bilan.copied && <span className="copied-mark" aria-label="copié">✓</span>}
            </button>
            <BilanActions date={date} id={bilan.id} name={name} html={bilanHtml({ bilan: bilan.text, bilanHtml: bilan.html })} />
          </div>
          {expanded && <div className="bilan-body"><p dangerouslySetInnerHTML={{ __html: bilanHtml({ bilan: bilan.text, bilanHtml: bilan.html }) }} /><Link to={`/bilan/${date}/${bilan.id}`} state={{ from: `/bilans?date=${date}` }}>Modifier</Link></div>}
        </li>
      })}</ol>}
    </>}
  </>
}
