import { useMemo, useState, type FormEvent } from 'react'
import { BilanActions } from '../bilan/BilanActions'
import { bilanHtml } from '../bilan/richText'
import { itemHtml } from '../bilan/display'
import { hasTestContent } from '../../domain/tinetti'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { dateLabel, fullName, hasTrace, parseDate, validDate, type Patient } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { FollowUps, PatientCare } from './PatientCare'

function byName(a: Patient, b: Patient) {
  return a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' }) || a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' })
}

export function Patients() {
  const patients = useLiveQuery(() => db.patients.toArray(), [])
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [adding, setAdding] = useState(false)
  const { run } = useSave()
  const visible = useMemo(() => (patients ?? []).filter(patient => showArchived || !patient.archived).sort(byName), [patients, showArchived])

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (adding) return
    setAdding(true)
    setFormError('')
    const form = event.currentTarget
    const data = new FormData(form)
    const ok = await run(() => repository.addPatient({
      lastName: String(data.get('lastName') ?? ''),
      firstName: String(data.get('firstName') ?? ''),
      room: String(data.get('room') ?? ''),
      priority: String(data.get('priority') ?? ''),
    }))
    if (ok) {
      form.reset()
      setFormOpen(false)
    } else setFormError('Patient non ajouté.')
    setAdding(false)
  }

  return <>
    <div className="page-heading end">
      <h1 className="sr-only">Patients</h1>
      <button className="primary" onClick={() => setFormOpen(value => !value)}>{formOpen ? 'Fermer' : 'Ajouter'}</button>
    </div>
    {formOpen && <form className="card patient-form" onSubmit={event => void add(event)}>
      <div className="form-grid">
        <label>Nom <input name="lastName" autoComplete="off" required /></label>
        <label>Prénom <input name="firstName" autoComplete="off" /></label>
        <label>Chambre <input name="room" autoComplete="off" inputMode="text" /></label>
        <label>Priorité <input name="priority" autoComplete="off" /></label>
      </div>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <button className="primary" type="submit" disabled={adding}>Enregistrer</button>
    </form>}
    <label className="filter-toggle"><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} /> Archivés</label>
    {!patients ? null : visible.length === 0 ? <div className="empty-state"><h2>Aucun patient</h2></div> : <ul className="patient-list">
      {visible.map(patient => <li key={patient.id} className={patient.group ? 'group' : undefined}><Link to={`/patients/${patient.id}`}>
        <span><strong>{fullName(patient)}</strong>{patient.group && <span className="sr-only"> (groupe)</span>}{patient.archived && <span className="tag muted">Archivé</span>}</span>
        {(patient.room || patient.priority) && <span className="patient-meta">{[patient.room && `Chambre ${patient.room}`, patient.priority].filter(Boolean).join(' · ')}</span>}
      </Link></li>)}
    </ul>}
  </>
}

function EditableIdentity({ patient }: { patient: Patient }) {
  const { run } = useSave()
  const save = async (field: 'lastName' | 'firstName' | 'room' | 'priority', input: HTMLInputElement) => {
    const value = input.value.trim()
    if (value === patient[field]) { input.value = value; return }
    const ok = await run(() => repository.updatePatient(patient.id, { [field]: value }))
    input.value = ok ? value : patient[field]
  }
  return <section className="card">
    <div className="form-grid">
      <label>Nom <input key={`${patient.id}-lastName-${patient.lastName}`} autoComplete="off" defaultValue={patient.lastName} required onBlur={event => void save('lastName', event.currentTarget)} /></label>
      <label>Prénom <input key={`${patient.id}-firstName-${patient.firstName}`} autoComplete="off" defaultValue={patient.firstName} onBlur={event => void save('firstName', event.currentTarget)} /></label>
      <label>Chambre <input key={`${patient.id}-room-${patient.room}`} autoComplete="off" defaultValue={patient.room} onBlur={event => void save('room', event.currentTarget)} /></label>
      <label>Priorité <input key={`${patient.id}-priority-${patient.priority}`} autoComplete="off" defaultValue={patient.priority} onBlur={event => void save('priority', event.currentTarget)} /></label>
    </div>
  </section>
}

// Ouverte depuis une journée, la fiche y ramène (même date) ; sinon retour à la liste des patients.
function backTarget(state: unknown): { to: string; label: string } {
  const from = (state as { from?: unknown } | null)?.from
  const date = typeof from === 'string' && from.startsWith('/?date=') ? from.slice(7) : ''
  return validDate(date) ? { to: from as string, label: parseDate(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) } : { to: '/patients', label: 'Patients' }
}

export function PatientDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const back = backTarget(useLocation().state)
  const [historyOpen, setHistoryOpen] = useState(false)
  const patient = useLiveQuery(async () => (await db.patients.get(id)) ?? null, [id])
  const history = useLiveQuery(async () => (await db.days.toArray())
    .filter(day => day.entries[id] && hasTrace(day.entries[id]))
    .sort((a, b) => b.date.localeCompare(a.date)), [id])
  const { run } = useSave()
  const remove = async () => {
    if (!patient || !window.confirm(`Supprimer définitivement ${fullName(patient)} ?`)) return
    if (await run(() => repository.deletePatient(patient.id))) navigate(back.to)
  }
  if (patient === undefined) return null
  if (!patient) return <div className="empty-state"><h1>Fiche introuvable</h1><Link className="button" to="/patients">Patients</Link></div>
  return <>
    <Link className="back-link" to={back.to}>← {back.label}</Link>
    <div className="page-heading patient-title"><div><h1>{fullName(patient)}</h1>{(patient.room || patient.archived) && <p>{[patient.room && `Chambre ${patient.room}`, patient.archived && 'Archivé'].filter(Boolean).join(' · ')}</p>}</div></div>
    <FollowUps patient={patient} />
    <EditableIdentity patient={patient} />
    <PatientCare patient={patient} />
    {!!history?.length && <button type="button" className="history-toggle" aria-expanded={historyOpen} aria-controls="patient-history" onClick={() => setHistoryOpen(open => !open)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4" /></svg>Séances ({history.length})</button>}
    {!!history?.length && historyOpen && <section id="patient-history" className="card history" aria-label="Séances et notes">
      <ol>{history.map(day => {
        const entry = day.entries[id]
        return <li key={day.date}><Link to={`/?date=${day.date}`}><time dateTime={day.date}>{dateLabel(day.date)}</time><span>{entry.session ? `Séance ${entry.session}` : 'Pas de séance'}{entry.note.trim() ? ` · ${entry.note}` : ''}</span></Link>{entry.bilan?.trim() && <div className="history-bilan-row"><p className="history-bilan" dangerouslySetInnerHTML={{ __html: bilanHtml(entry) }} /><BilanActions date={day.date} id={id} name={fullName(patient)} html={bilanHtml(entry)} /></div>}
          {entry.tests?.tinetti && hasTestContent(entry.tests.tinetti) && <div className="history-bilan-row"><p className="history-bilan" dangerouslySetInnerHTML={{ __html: itemHtml({ kind: 'tinetti', text: entry.tests.tinetti.notes, record: entry.tests.tinetti }) }} /><BilanActions date={day.date} id={id} name={fullName(patient)} html={itemHtml({ kind: 'tinetti', text: entry.tests.tinetti.notes, record: entry.tests.tinetti })} kind="tinetti" /></div>}</li>
      })}</ol>
    </section>}
    <section className="danger-zone"><div className="action-row"><button onClick={() => void run(() => repository.archivePatient(patient.id, !patient.archived))}>{patient.archived ? 'Réactiver' : 'Archiver'}</button><button className="danger" onClick={() => void remove()}>Supprimer</button></div></section>
  </>
}
