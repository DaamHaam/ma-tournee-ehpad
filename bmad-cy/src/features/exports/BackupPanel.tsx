import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { localDate, parseDate } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { buildBackup, parseBackup } from './backup'
import { saveFile } from './saveFile'

export function BackupPanel() {
  const { run } = useSave()
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const lastBackup = useLiveQuery(async () => (await db.settings.get('lastBackup'))?.value ?? '', [])
  const save = async () => {
    setMessage(''); setError('')
    try {
      const today = localDate()
      const file = new File([buildBackup(await repository.snapshot(), new Date().toISOString())], `ma-tournee-sauvegarde-${today}.json`, { type: 'application/json' })
      if (await saveFile(file, 'Sauvegarde Ma tournée')) await run(() => repository.setSetting('lastBackup', today))
    } catch { setError('Sauvegarde impossible.') }
  }
  const restore = async (file: File | undefined) => {
    setMessage(''); setError('')
    if (!file) return
    try {
      const backup = parseBackup(await file.text())
      const date = backup.createdAt ? ` du ${new Date(backup.createdAt).toLocaleDateString('fr-FR')}` : ''
      if (!window.confirm(`Remplacer toutes les données par la sauvegarde${date} (${backup.patients.length} patients, ${backup.days.length} journées) ?`)) return
      if (await run(() => repository.restore(backup))) setMessage('Sauvegarde restaurée.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Restauration impossible.') }
    finally { if (input.current) input.current.value = '' }
  }
  return <section className="card backup">
    <h2>Sauvegarde</h2>
    <div className="action-row">
      <button className="primary" onClick={() => void save()}>Sauvegarder</button>
      <button onClick={() => input.current?.click()}>Restaurer</button>
      <input ref={input} type="file" accept="application/json,.json" hidden aria-label="Fichier de sauvegarde" onChange={event => void restore(event.target.files?.[0])} />
    </div>
    {error ? <p className="field-error" role="alert">{error}</p> : <p className="save-hint" role="status">{message || (lastBackup ? `Dernière sauvegarde : ${parseDate(lastBackup).toLocaleDateString('fr-FR')}` : '')}</p>}
  </section>
}
