import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { dateLabel, followUpLevel, fullName, lastFollowUp, localDate, moodSigns, parseDate, SEPARATORS, validDate, weekDate, type Mood, type Patient } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
function SortableRow({ id, enabled, label, children, onMove, first, last }: { id: string; enabled: boolean; label: string; children: ReactNode; onMove: (delta: number) => void; first: boolean; last: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !enabled })
  return <div ref={setNodeRef} className={isDragging ? 'dragging' : ''} style={{ transform: CSS.Transform.toString(transform), transition }}><div className="sortable-content">{children}{enabled && <div className="move-controls"><button className="drag-handle" {...attributes} {...listeners} aria-label={`Déplacer ${label}`}>⠿</button><button disabled={first} onClick={() => onMove(-1)} aria-label={`Monter ${label}`}>↑</button><button disabled={last} onClick={() => onMove(1)} aria-label={`Descendre ${label}`}>↓</button></div>}</div></div>
}
function FollowUpMark({ patient }: { patient?: Patient }) {
  const last = patient ? lastFollowUp(patient) : null
  const label = last ? `Dernière éval ou trans : ${parseDate(last).toLocaleDateString('fr-FR')}` : 'Éval ou trans : date inconnue'
  return <span className={`transmission ${followUpLevel(last, localDate())}`} role="img" aria-label={label} title={label}>▲</span>
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
    <div className="page-heading"><label className="date-heading"><h1 className="date-title">{dateLabel(date)}</h1><input type="date" aria-label="Date" value={date} onChange={e => changeDate(e.target.value)} /></label>{date !== localDate() && <button onClick={() => changeDate(localDate())}>Aujourd’hui</button>}</div>
    <section className="date-picker"><div className="weekday-tabs" aria-label="Jours de tournée">{[[1, 'Lundi'], [4, 'Jeudi'], [5, 'Vendredi']].map(([weekday, label]) => <button key={weekday} aria-pressed={parseDate(date).getDay() === weekday} onClick={() => changeDate(weekDate(date, Number(weekday)))}>{label}</button>)}</div></section>
    {day && <>
      <div className="section-heading"><h2>{seen} / {visibleEntries.length} patients vus</h2><button aria-pressed={arranging} onClick={() => setArranging(value => !value)}>{arranging ? 'Terminer l’ordre' : 'Réorganiser'}</button></div>
      {!visibleEntries.length && <div className="empty-state"><h2>Aucun patient</h2><Link className="button primary" to="/patients">Ajouter un patient</Link></div>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={day.order} strategy={verticalListSortingStrategy}><div className="tour-list">{day.order.map((id, index) => {
        const entry = day.entries[id]
        const isSeparator = SEPARATORS.includes(id)
        if ((!entry && !isSeparator) || (entry && date >= localDate() && (!active.has(id) || active.get(id)?.archived))) return null
        const patient = entry && (active.get(id) ?? entry.patient)
        const label = isSeparator ? `Repère ${SEPARATORS.indexOf(id) + 1}` : fullName(patient!)
        return <SortableRow key={id} id={id} enabled={arranging} label={label} first={index === 0} last={index === day.order.length - 1} onMove={delta => reorder(index, index + delta)}>{isSeparator ? <div className="separator"><span>{label}</span></div> : <article className="patient-row">
          <div className="patient-top"><FollowUpMark patient={active.get(id)} /><Link className="patient-name" to={`/patients/${id}`}><strong>{patient!.lastName} {patient!.firstName}{patient!.priority && <span className="priority"> {patient!.priority}</span>}</strong>{(patient!.room || !active.has(id) || active.get(id)?.archived) && <span className="patient-meta">{[patient!.room && `Ch. ${patient!.room}`, !active.has(id) ? 'Supprimé' : active.get(id)?.archived ? 'Archivé' : ''].filter(Boolean).join(' · ')}</span>}</Link><div className="session-buttons">{(['A', 'B'] as const).map(session => <button key={session} className={entry.session === session ? 'selected' : ''} aria-pressed={entry.session === session} aria-label={`${session} pour ${fullName(patient!)}`} onClick={() => void run(() => repository.setSession(date, id, session))}>{session}</button>)}</div></div>
          <input key={`${date}-${id}-note`} className="day-note" aria-label={`Note du jour pour ${fullName(patient!)}`} placeholder="Note" defaultValue={entry.note} onChange={e => { const value = e.target.value; void run(() => repository.setNote(date, id, value)) }} />
        </article>}</SortableRow>
      })}</div></SortableContext></DndContext>
      <section className="card day-summary"><fieldset><legend className="sr-only">Niveau H</legend><div className="mood-options">{([-3, -2, -1, 0, 1, 2, 3] as const).map(mood => <button key={mood} aria-pressed={day.mood === mood} onClick={() => void run(() => repository.setMood(date, day.mood === mood ? null : mood as Mood))}>H{moodSigns(mood)}</button>)}</div></fieldset><textarea key={date} aria-label="Commentaire général" rows={2} defaultValue={day.comment} placeholder="Commentaire" onChange={e => { const value = e.target.value; void run(() => repository.setComment(date, value)) }} /></section>
    </>}
  </>
}
