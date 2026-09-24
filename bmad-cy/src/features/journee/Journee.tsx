import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { dateLabel, fullName, localDate, moodSigns, parseDate, SEPARATORS, validDate, weekDate, type Mood } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
function SortableRow({ id, enabled, label, children, onMove, first, last }: { id: string; enabled: boolean; label: string; children: ReactNode; onMove: (delta: number) => void; first: boolean; last: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !enabled })
  return <div ref={setNodeRef} className={isDragging ? 'dragging' : ''} style={{ transform: CSS.Transform.toString(transform), transition }}><div className="sortable-content">{children}{enabled && <div className="move-controls"><button className="drag-handle" {...attributes} {...listeners} aria-label={`Déplacer ${label}`}>⠿</button><button disabled={first} onClick={() => onMove(-1)} aria-label={`Monter ${label}`}>↑</button><button disabled={last} onClick={() => onMove(1)} aria-label={`Descendre ${label}`}>↓</button></div>}</div></div>
}
export function Journee() {
  const [params, setParams] = useSearchParams()
  const rawDate = params.get('date')
  const date = rawDate && validDate(rawDate) ? rawDate : localDate()
  const [arranging, setArranging] = useState(false)
  const { run } = useSave()
  const patients = useLiveQuery(() => db.patients.toArray(), [])
  const day = useLiveQuery(() => db.days.get(date), [date])
  const patientSignature = patients?.map(p => `${p.id}:${p.archived}`).sort().join(',')
  useEffect(() => { void run(() => repository.ensureDay(date)) }, [date, patientSignature, run])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const changeDate = (value: string) => { if (validDate(value)) setParams({ date: value }) }
  const reorder = (oldIndex: number, newIndex: number) => { if (day && oldIndex !== newIndex && newIndex >= 0 && newIndex < day.order.length) void run(() => repository.reorder(date, arrayMove(day.order, oldIndex, newIndex))) }
  const onDragEnd = ({ active, over }: DragEndEvent) => { if (day && over) reorder(day.order.indexOf(String(active.id)), day.order.indexOf(String(over.id))) }
  const active = new Map(patients?.map(p => [p.id, p]))
  const visibleEntries = day?.order.filter(id => day.entries[id] && (date < localDate() || (active.has(id) && !active.get(id)?.archived))) ?? []
  const seen = visibleEntries.filter(id => day?.entries[id].session).length
  return <>
    <div className="page-heading"><div><h1>Journée</h1><p className="date-title">{dateLabel(date)}</p></div><button onClick={() => changeDate(localDate())}>Aujourd’hui</button></div>
    <section className="date-picker card"><label htmlFor="day-date">Ouvrir une date</label><input id="day-date" type="date" value={date} onChange={e => changeDate(e.target.value)} /><div className="weekday-tabs" aria-label="Jours de tournée">{[[1, 'Lundi'], [4, 'Jeudi'], [5, 'Vendredi']].map(([weekday, label]) => <button key={weekday} aria-pressed={parseDate(date).getDay() === weekday} onClick={() => changeDate(weekDate(date, Number(weekday)))}>{label}</button>)}</div></section>
    {date < localDate() && <p className="notice">Journée passée : vous pouvez corriger les pointages et les notes.</p>}
    {patients?.some(p => p.demo && !p.archived) && <p className="demo-notice">Données d’essai : les patients fictifs peuvent être archivés ou supprimés dans leur fiche.</p>}
    {!day ? <p>Chargement de la journée…</p> : <>
      <div className="section-heading"><h2>{seen} / {visibleEntries.length} patients vus</h2><button aria-pressed={arranging} onClick={() => setArranging(value => !value)}>{arranging ? 'Terminer l’ordre' : 'Réorganiser'}</button></div>
      {arranging && <p className="subtle">Glissez la poignée ou utilisez les flèches. Cet ordre sera proposé pour les prochains {parseDate(date).toLocaleDateString('fr-FR', { weekday: 'long' })}s.</p>}
      {!visibleEntries.length && <div className="empty-state"><h2>Aucun patient actif</h2><p>Ajoutez un patient pour préparer votre tournée.</p><Link className="button primary" to="/patients">Ajouter un patient</Link></div>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={day.order} strategy={verticalListSortingStrategy}><div className="tour-list">{day.order.map((id, index) => {
        const entry = day.entries[id]
        const isSeparator = SEPARATORS.includes(id)
        if ((!entry && !isSeparator) || (entry && date >= localDate() && (!active.has(id) || active.get(id)?.archived))) return null
        const patient = entry && (active.get(id) ?? entry.patient)
        const label = isSeparator ? `Repère ${SEPARATORS.indexOf(id) + 1}` : fullName(patient!)
        return <SortableRow key={id} id={id} enabled={arranging} label={label} first={index === 0} last={index === day.order.length - 1} onMove={delta => reorder(index, index + delta)}>{isSeparator ? <div className="separator"><span>{label}</span></div> : <article className="patient-row">
          <div className="patient-top"><span className="transmission" role="img" aria-label="Transmission : date inconnue" title="Transmission : date inconnue">▲</span><Link className="patient-name" to={`/patients/${id}`}><strong>{patient!.lastName} {patient!.firstName}{patient!.priority && <span className="priority"> {patient!.priority}</span>}</strong><span className="patient-meta">{patient!.room ? `Ch. ${patient!.room}` : 'Chambre non renseignée'}{patient!.demo ? ' · Fictif' : ''}{!active.has(id) ? ' · Supprimé' : active.get(id)?.archived ? ' · Archivé' : ''}</span></Link><div className="session-buttons">{(['A', 'B'] as const).map(session => <button key={session} className={entry.session === session ? 'selected' : ''} aria-pressed={entry.session === session} aria-label={`${session} pour ${fullName(patient!)}`} onClick={() => void run(() => repository.setSession(date, id, session))}>{session}</button>)}</div></div>
          <input key={`${date}-${id}-note`} className="day-note" aria-label={`Note du jour pour ${fullName(patient!)}`} placeholder="Ajouter une note du jour…" defaultValue={entry.note} onChange={e => { const value = e.target.value; void run(() => repository.setNote(date, id, value)) }} />
        </article>}</SortableRow>
      })}</div></SortableContext></DndContext>
      <section className="card day-summary"><h2>Ressenti de la journée</h2><fieldset><legend>Niveau H</legend><div className="mood-options">{([-3, -2, -1, 0, 1, 2, 3] as const).map(mood => <button key={mood} aria-pressed={day.mood === mood} onClick={() => void run(() => repository.setMood(date, day.mood === mood ? null : mood as Mood))}>H{moodSigns(mood)}</button>)}</div></fieldset><label htmlFor="day-comment">Commentaire général</label><textarea key={date} id="day-comment" rows={2} defaultValue={day.comment} placeholder="Un commentaire sur cette journée…" onChange={e => { const value = e.target.value; void run(() => repository.setComment(date, value)) }} /></section>
    </>}
  </>
}
