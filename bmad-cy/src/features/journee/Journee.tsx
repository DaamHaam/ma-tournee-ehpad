import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { dateLabel, followUpLevel, fullName, lastFollowUp, localDate, moodSigns, parseDate, SEPARATORS, validDate, weekDate, type Mood, type Patient } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
// Toute la carte se déplace après un appui long (toucher ou souris) ; les appuis courts restent aux boutons.
function SortableRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return <div ref={node => { setNodeRef(node); setActivatorNodeRef(node) }} className={`sortable-row${isDragging ? ' dragging' : ''}`} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} role={undefined} aria-label={`Déplacer ${label}`}>{children}</div>
}
function NoteToggle({ patient, name, open, onToggle }: { patient?: Patient; name: string; open: boolean; onToggle: () => void }) {
  const last = patient ? lastFollowUp(patient) : null
  const followUp = last ? `dernière éval ou trans le ${parseDate(last).toLocaleDateString('fr-FR')}` : 'éval ou trans : date inconnue'
  return <button type="button" className={`transmission ${followUpLevel(last, localDate())}${open ? ' open' : ''}`} aria-expanded={open} aria-label={`Note pour ${name}, ${followUp}`} title={followUp} onClick={onToggle}><span aria-hidden="true">▶</span></button>
}
// Le clic natif émis au relâchement ouvrirait la fiche : il est bloqué pendant le glisser et juste après.
function stopClick(event: MouseEvent) { event.preventDefault(); event.stopPropagation() }
function blockClicks() { window.addEventListener('click', stopClick, true) }
function releaseClicks() { window.setTimeout(() => window.removeEventListener('click', stopClick, true), 300) }
export function Journee() {
  const [params, setParams] = useSearchParams()
  const rawDate = params.get('date')
  const date = rawDate && validDate(rawDate) ? rawDate : localDate()
  const [noteOverrides, setNoteOverrides] = useState<Record<string, boolean>>({})
  const { run } = useSave()
  const patients = useLiveQuery(() => db.patients.toArray(), [])
  const day = useLiveQuery(() => db.days.get(date), [date])
  const patientSignature = patients?.map(p => `${p.id}:${p.archived}`).sort().join(',')
  useEffect(() => { void run(() => repository.ensureDay(date)) }, [date, patientSignature, run])
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { delay: 350, tolerance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const changeDate = (value: string) => { if (validDate(value)) setParams({ date: value }) }
  const reorder = (oldIndex: number, newIndex: number) => { if (day && oldIndex !== newIndex && newIndex >= 0 && newIndex < day.order.length) void run(() => repository.reorder(date, arrayMove(day.order, oldIndex, newIndex))) }
  const onDragEnd = ({ active, over }: DragEndEvent) => { releaseClicks(); if (day && over) reorder(day.order.indexOf(String(active.id)), day.order.indexOf(String(over.id))) }
  const active = new Map(patients?.map(p => [p.id, p]))
  const visibleEntries = day?.order.filter(id => day.entries[id] && (date < localDate() || (active.has(id) && !active.get(id)?.archived))) ?? []
  const seen = visibleEntries.filter(id => day?.entries[id].session).length
  return <>
    <div className="page-heading"><label className="date-heading"><h1 className="date-title">{dateLabel(date)}</h1><input type="date" aria-label="Date" value={date} onChange={e => changeDate(e.target.value)} /></label></div>
    <section className="date-picker"><div className="weekday-tabs" aria-label="Jours de tournée">{[[1, 'Lundi'], [4, 'Jeudi'], [5, 'Vendredi']].map(([weekday, label]) => <button key={weekday} aria-pressed={parseDate(date).getDay() === weekday} onClick={() => changeDate(weekDate(date, Number(weekday)))}>{label}</button>)}</div></section>
    {day && <>
      <div className="section-heading"><h2>{seen} / {visibleEntries.length} patients vus</h2></div>
      {!visibleEntries.length && <div className="empty-state"><h2>Aucun patient</h2><Link className="button primary" to="/patients">Ajouter un patient</Link></div>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={blockClicks} onDragEnd={onDragEnd} onDragCancel={releaseClicks}><SortableContext items={day.order} strategy={verticalListSortingStrategy}><div className="tour-list">{day.order.map(id => {
        const entry = day.entries[id]
        const isSeparator = SEPARATORS.includes(id)
        if ((!entry && !isSeparator) || (entry && date >= localDate() && (!active.has(id) || active.get(id)?.archived))) return null
        const patient = entry && (active.get(id) ?? entry.patient)
        const label = isSeparator ? `Repère ${SEPARATORS.indexOf(id) + 1}` : fullName(patient!)
        const noteKey = `${date}:${id}`
        const noteOpen = entry ? noteOverrides[noteKey] ?? entry.note.trim() !== '' : false
        return <SortableRow key={id} id={id} label={label}>{isSeparator ? <div className="separator" role="separator" aria-label={label} /> : <article className="patient-row">
          <div className="patient-top"><NoteToggle patient={active.get(id)} name={label} open={noteOpen} onToggle={() => setNoteOverrides(current => ({ ...current, [noteKey]: !noteOpen }))} /><Link className="patient-name" draggable={false} to={`/patients/${id}`}><strong>{patient!.lastName} {patient!.firstName}{patient!.priority && <span className="priority"> {patient!.priority}</span>}</strong>{(patient!.room || !active.has(id) || active.get(id)?.archived) && <span className="patient-meta">{[patient!.room && `Ch. ${patient!.room}`, !active.has(id) ? 'Supprimé' : active.get(id)?.archived ? 'Archivé' : ''].filter(Boolean).join(' · ')}</span>}</Link><div className="session-buttons">{(['A', 'B'] as const).map(session => <button key={session} className={entry.session === session ? 'selected' : ''} aria-pressed={entry.session === session} aria-label={`${session} pour ${fullName(patient!)}`} onClick={() => void run(() => repository.setSession(date, id, session))}>{session}</button>)}</div></div>
 {noteOpen && <input key={`${date}-${id}-note`} className="day-note" onMouseDown={event => event.stopPropagation()} onTouchStart={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()} autoFocus={noteOverrides[noteKey] === true} aria-label={`Note du jour pour ${fullName(patient!)}`} placeholder="Note" defaultValue={entry.note} onChange={e => { const value = e.target.value; void run(() => repository.setNote(date, id, value)) }} />}
        </article>}</SortableRow>
      })}</div></SortableContext></DndContext>
      <section className="card day-summary"><fieldset><legend className="sr-only">Niveau H</legend><div className="mood-options">{([-3, -2, -1, 0, 1, 2, 3] as const).map(mood => <button key={mood} aria-pressed={day.mood === mood} onClick={() => void run(() => repository.setMood(date, day.mood === mood ? null : mood as Mood))}>H{moodSigns(mood)}</button>)}</div></fieldset><textarea key={date} aria-label="Commentaire général" rows={2} defaultValue={day.comment} placeholder="Commentaire" onChange={e => { const value = e.target.value; void run(() => repository.setComment(date, value)) }} /></section>
    </>}
  </>
}
