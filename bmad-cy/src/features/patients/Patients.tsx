import { useMemo, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { dateLabel, fullName, hasTrace, type Patient } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'

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
    } else setFormError('Le patient n’a pas été ajouté. Consultez le message de sauvegarde puis réessayez.')
    setAdding(false)
  }

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">Base locale</p><h1>Patients</h1></div>
      <button className="primary" onClick={() => setFormOpen(value => !value)}>{formOpen ? 'Fermer' : 'Ajouter'}</button>
    </div>
    {formOpen && <form className="card patient-form" onSubmit={event => void add(event)}>
      <h2>Nouveau patient</h2>
      <div className="form-grid">
        <label>Nom <input name="lastName" autoComplete="off" required /></label>
        <label>Prénom <input name="firstName" autoComplete="off" required /></label>
        <label>Chambre <input name="room" autoComplete="off" inputMode="text" /></label>
        <label>Priorité <input name="priority" autoComplete="off" placeholder="ex. matin" /></label>
      </div>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <button className="primary" type="submit" disabled={adding}>{adding ? 'Ajout…' : 'Ajouter à la tournée'}</button>
    </form>}
    <label className="filter-toggle"><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} /> Afficher les patients archivés</label>
    {!patients ? <p>Chargement des patients…</p> : visible.length === 0 ? <div className="empty-state"><h2>{showArchived ? 'Aucun patient' : 'Aucun patient actif'}</h2><p>Ajoutez un patient pour le retrouver dans la prochaine journée ouverte.</p></div> : <ul className="patient-list">
      {visible.map(patient => <li key={patient.id}><Link to={`/patients/${patient.id}`}>
        <span><strong>{fullName(patient)}</strong>{patient.demo && <span className="tag">Fictif</span>}{patient.archived && <span className="tag muted">Archivé</span>}</span>
        <span className="patient-meta">{patient.room ? `Chambre ${patient.room}` : 'Chambre non renseignée'}{patient.priority ? ` · ${patient.priority}` : ''}</span>
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
    <h2>Identité utile</h2>
    <div className="form-grid">
      <label>Nom <input key={`${patient.id}-lastName-${patient.lastName}`} autoComplete="off" defaultValue={patient.lastName} required onBlur={event => void save('lastName', event.currentTarget)} /></label>
      <label>Prénom <input key={`${patient.id}-firstName-${patient.firstName}`} autoComplete="off" defaultValue={patient.firstName} required onBlur={event => void save('firstName', event.currentTarget)} /></label>
      <label>Chambre <input key={`${patient.id}-room-${patient.room}`} autoComplete="off" defaultValue={patient.room} onBlur={event => void save('room', event.currentTarget)} /></label>
      <label>Priorité <input key={`${patient.id}-priority-${patient.priority}`} autoComplete="off" defaultValue={patient.priority} onBlur={event => void save('priority', event.currentTarget)} /></label>
    </div>
    <p className="save-hint">Les champs sont enregistrés lorsque vous les quittez.</p>
  </section>
}

export function PatientDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const patient = useLiveQuery(async () => (await db.patients.get(id)) ?? null, [id])
  const history = useLiveQuery(async () => (await db.days.toArray())
    .filter(day => day.entries[id] && hasTrace(day.entries[id]))
    .sort((a, b) => b.date.localeCompare(a.date)), [id])
  const { run } = useSave()
  const remove = async () => {
    if (!patient || !window.confirm(`Supprimer définitivement la fiche de ${fullName(patient)} ? Les traces des journées passées resteront dans les exports.`)) return
    if (await run(() => repository.deletePatient(patient.id))) navigate('/patients')
  }
  if (patient === undefined) return <p>Chargement de la fiche…</p>
  if (!patient) return <div className="empty-state"><h1>Fiche introuvable</h1><p>Ce patient a peut-être été supprimé. Les anciennes traces restent conservées dans les journées.</p><Link className="button" to="/patients">Retour aux patients</Link></div>
  return <>
    <Link className="back-link" to="/patients">← Tous les patients</Link>
    <div className="page-heading patient-title"><div><p className="eyebrow">{patient.demo ? 'Patient fictif' : patient.archived ? 'Patient archivé' : 'Patient actif'}</p><h1>{fullName(patient)}</h1><p>{patient.room ? `Chambre ${patient.room}` : 'Chambre non renseignée'}</p></div></div>
    <EditableIdentity patient={patient} />
    <section className="card history"><div className="section-heading"><h2>Historique</h2><span>{history?.length ?? 0} trace{history?.length === 1 ? '' : 's'}</span></div>
      {!history ? <p>Chargement…</p> : history.length === 0 ? <p className="subtle">Aucune séance ni note enregistrée.</p> : <ol>{history.map(day => {
        const entry = day.entries[id]
        return <li key={day.date}><Link to={`/?date=${day.date}`}><time dateTime={day.date}>{dateLabel(day.date)}</time><span>{entry.session ? `Séance ${entry.session}` : 'Pas de séance'}{entry.note.trim() ? ` · ${entry.note}` : ''}</span></Link></li>
      })}</ol>}
    </section>
    <section className="card danger-zone"><h2>Gestion de la fiche</h2><p>{patient.archived ? 'Réactivez ce patient pour le remettre dans les nouvelles journées.' : 'L’archivage retire le patient des nouvelles journées sans effacer son historique.'}</p><div className="action-row"><button onClick={() => void run(() => repository.archivePatient(patient.id, !patient.archived))}>{patient.archived ? 'Réactiver' : 'Archiver'}</button><button className="danger" onClick={() => void remove()}>Supprimer la fiche</button></div></section>
  </>
}
