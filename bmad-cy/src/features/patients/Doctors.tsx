import { useState, type FormEvent } from 'react'
import { type Doctor } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
import { repository } from '../../storage/repository'
import { useDoctors } from './useDoctors'

type Draft = Omit<Doctor, 'id'> & { id?: string }
const EMPTY: Draft = { name: '', specialty: '', phone: '', email: '', notes: '' }

// Téléphone et mail touchables, spécialité seulement si ce n’est pas un généraliste.
export function DoctorContacts({ doctor }: { doctor: Doctor }) {
  return <p className="doctor-contacts">
    {doctor.specialty && <span className="subtle">{doctor.specialty}</span>}
    {doctor.phone && <a href={`tel:${doctor.phone.replace(/[^\d+]/g, '')}`}>{doctor.phone}</a>}
    {doctor.email && <a href={`mailto:${doctor.email}`}>{doctor.email}</a>}
  </p>
}

// Carnet des médecins (Réglages) : nom obligatoire, contacts, informations libres derrière un petit bouton ;
// spécialité discrète, vide par défaut (généraliste).
export function DoctorsPanel() {
  const { run } = useSave()
  const doctors = useDoctors()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [error, setError] = useState('')
  const edit = (doctor: Draft) => { setDraft(doctor); setNotesOpen(!!doctor.notes); setError('') }
  const set = (field: keyof Omit<Draft, 'id'>, value: string) => setDraft(current => current && { ...current, [field]: value })
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return
    if (!draft.name.trim()) { setError('Le nom du médecin est obligatoire.'); return }
    if (await run(() => repository.saveDoctor(draft))) setDraft(null)
  }
  const remove = async () => {
    if (draft?.id && window.confirm(`Retirer ${draft.name} du carnet ? Les fiches gardent son nom.`) && await run(() => repository.deleteDoctor(draft.id!))) setDraft(null)
  }
  if (!doctors) return null
  return <section className="card doctors" aria-label="Carnet des médecins">
    <div className="section-heading"><h2>Carnet des médecins</h2>{!draft && <button type="button" onClick={() => edit(EMPTY)}>Ajouter</button>}</div>
    {draft && <form className="doctor-form" onSubmit={event => void submit(event)}>
      <label>Nom<input autoComplete="off" value={draft.name} placeholder="Dr Nom" onChange={event => set('name', event.target.value)} /></label>
      <div className="form-grid">
        <label>Téléphone<input type="tel" autoComplete="off" value={draft.phone} onChange={event => set('phone', event.target.value)} /></label>
        <label>Mail<input type="email" autoComplete="off" autoCapitalize="none" value={draft.email} onChange={event => set('email', event.target.value)} /></label>
      </div>
      <label className="doctor-specialty">Spécialité<input autoComplete="off" value={draft.specialty} placeholder="Généraliste" onChange={event => set('specialty', event.target.value)} /></label>
      {notesOpen
        ? <label>Informations<textarea rows={3} value={draft.notes} onChange={event => set('notes', event.target.value)} /></label>
        : <button type="button" className="link-button" onClick={() => setNotesOpen(true)}>+ Informations</button>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="action-row">
        <button type="submit" className="primary">Enregistrer</button>
        <button type="button" onClick={() => setDraft(null)}>Annuler</button>
        {draft.id && <button type="button" className="danger" onClick={() => void remove()}>Retirer</button>}
      </div>
    </form>}
    {!doctors.length && !draft && <p className="save-hint">Aucun médecin : ajoutez-les ici pour les choisir dans les fiches.</p>}
    {doctors.length > 0 && <ul className="doctor-list">{doctors.map(doctor => <li key={doctor.id}>
      <div><strong>{doctor.name}</strong><DoctorContacts doctor={doctor} />{doctor.notes && <p className="doctor-notes">{doctor.notes}</p>}</div>
      <button type="button" className="icon-button" aria-label={`Modifier ${doctor.name}`} onClick={() => edit(doctor)}>✎</button>
    </li>)}</ul>}
  </section>
}
