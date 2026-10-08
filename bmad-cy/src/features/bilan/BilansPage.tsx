import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../storage/database'
import { dateLabel, dayBilans, fullName, shortName, validDate } from '../../domain/model'
import { useToday } from '../../app/useToday'
import { BilanActions } from './BilanActions'
import { editPath, itemHtml, KIND_LABEL, KIND_SHORT, multiBilanGroups } from './display'
import { useBilanGroupCopy } from './useBilanCopy'
import { tinettiScore } from '../../domain/tinetti'

// Bilans d’une journée (aujourd’hui par défaut), repliés, à reporter un par un dans le logiciel de la résidence.
export function BilansPage() {
  const [params, setParams] = useSearchParams()
  const today = useToday()
  const raw = params.get('date')
  const date = raw && validDate(raw) ? raw : today
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const bilans = useLiveQuery(async () => { const day = await db.days.get(date); return day ? dayBilans(day) : [] }, [date])
  const copied = bilans?.filter(bilan => bilan.copied).length ?? 0
  const groups = bilans ? multiBilanGroups(bilans) : []
  const groupCopy = useBilanGroupCopy(date)
  return <>
    <div className="page-heading"><label className="date-heading"><h1 className="date-title">{dateLabel(date)}</h1><input type="date" aria-label="Date" value={date} onChange={event => { if (validDate(event.target.value)) setParams({ date: event.target.value }) }} /></label></div>
    {bilans && <>
      <div className="section-heading"><h2>{bilans.length ? `${copied} / ${bilans.length} bilans copiés` : 'Aucun bilan ce jour'}</h2></div>
      {!!groups.length && <ul className="copy-all-list" aria-label="Copier tous les bilans d’un patient">{groups.map(group => {
        const state = groupCopy.copied?.id === group.id ? groupCopy.copied.ok : null
        return <li key={group.id}><span><strong>{shortName(group.patient)}</strong> · {group.items.length} bilans</span><button type="button" className={state ? 'copied' : ''} aria-label={state === null ? `Tout copier pour ${fullName(group.patient)}` : state ? 'Tout copié' : 'Copie impossible'} onClick={() => void groupCopy.copy(group.id, group.items)}>{state === null ? 'Tout copier' : state ? 'Copié ✓' : 'Copie impossible'}</button></li>
      })}</ul>}
      {!!bilans.length && <ol className="card bilan-list">{bilans.map(bilan => {
        const name = fullName(bilan.patient)
        const key = `${date}:${bilan.id}:${bilan.kind}`
        const expanded = !!open[key]
        const html = itemHtml(bilan)
        const score = bilan.kind === 'tinetti' && bilan.record ? tinettiScore(bilan.record.scores) : null
        return <li key={key} className={bilan.copied ? 'copied' : ''}>
          <div className="bilan-row">
            <button type="button" className="bilan-summary" aria-expanded={expanded} onClick={() => setOpen(current => ({ ...current, [key]: !expanded }))}>
              <span className="triangle" aria-hidden="true" /><strong>{shortName(bilan.patient)}</strong>{bilan.kind !== 'bilan' && <span className="kind-tag" title={KIND_LABEL[bilan.kind]}>{KIND_SHORT[bilan.kind]}{score && ` ${score.total}/${score.max}`}</span>}{bilan.copied && <span className="copied-mark" aria-label="copié">✓</span>}
            </button>
            <BilanActions date={date} id={bilan.id} name={name} html={html} kind={bilan.kind} />
          </div>
          {expanded && <div className="bilan-body"><p dangerouslySetInnerHTML={{ __html: html }} /><Link to={editPath(bilan.kind, date, bilan.id)} state={{ from: `/bilans?date=${date}` }}>Modifier</Link></div>}
        </li>
      })}</ol>}
    </>}
  </>
}
