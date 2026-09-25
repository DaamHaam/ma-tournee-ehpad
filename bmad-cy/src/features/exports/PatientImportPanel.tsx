import { useState } from 'react'
import { localDate } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { parsePatientImport } from './patientImport'

export function PatientImportPanel() {
  const { run } = useSave()
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const submit = async () => {
    setMessage('')
    const { patients, errors } = parsePatientImport(text, localDate())
    setErrors(errors)
    if (errors.length) return
    const current = await db.patients.count()
    if (!window.confirm(`Remplacer les ${current} patients actuels par ${patients.length} patients importés ?`)) return
    if (await run(() => repository.replacePatients(patients))) { setText(''); setMessage(`${patients.length} patients importés.`) }
  }
  return <section className="card patient-import">
    <h2>Importer des patients</h2>
    <textarea aria-label="Données patients" rows={6} value={text} placeholder="Coller le tableau ici" spellCheck={false} onChange={event => { setText(event.target.value); setErrors([]); setMessage('') }} />
    {errors.length > 0 && <ul className="field-error" role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    <div className="action-row"><p className="save-hint" role="status">{message}</p><button className="primary" disabled={!text.trim()} onClick={() => void submit()}>Importer</button></div>
  </section>
}
