import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { DEFAULT_MODEL, KEY_SETTING, MODEL_SETTING, TRANSCRIPTION_MODELS } from './dictation'
import { checkKey } from './openrouter'

// Réglage de la dictée : la clé OpenRouter reste sur cet appareil et n’entre pas dans la sauvegarde.
export function DictationPanel() {
  const { run } = useSave()
  const settings = useLiveQuery(async () => ({ key: (await db.settings.get(KEY_SETTING))?.value ?? '', model: (await db.settings.get(MODEL_SETTING))?.value || DEFAULT_MODEL }), [])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (await run(() => repository.setSetting(KEY_SETTING, draft.trim()))) { setDraft(''); setStatus({ ok: true, text: 'Clé enregistrée sur cet appareil.' }) }
  }
  const erase = async () => {
    if (window.confirm('Effacer la clé OpenRouter de cet appareil ?') && await run(() => repository.deleteSetting(KEY_SETTING))) setStatus({ ok: true, text: 'Clé effacée.' })
  }
  const test = async () => {
    if (!settings?.key) return
    setBusy(true); setStatus(null)
    try { await checkKey(settings.key); setStatus({ ok: true, text: 'Clé valide.' }) }
    catch (cause) { setStatus({ ok: false, text: cause instanceof Error ? cause.message : 'Vérification impossible.' }) }
    finally { setBusy(false) }
  }
  if (!settings) return null
  const models: string[] = [...TRANSCRIPTION_MODELS]
  return <section className="card dictation">
    <h2>Dictée des bilans</h2>
    <p className="save-hint">{settings.key ? `Clé enregistrée sur cet appareil (…${settings.key.slice(-4)}).` : 'Aucune clé : utilisez le micro du clavier.'}</p>
    <form onSubmit={event => { event.preventDefault(); if (draft.trim()) void save() }}>
      <label>Clé OpenRouter<input type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} value={draft} placeholder={settings.key ? 'Remplacer la clé' : 'sk-or-…'} onChange={event => setDraft(event.target.value)} /></label>
      <label>Modèle de transcription<select value={settings.model} onChange={event => { const value = event.target.value; void run(() => repository.setSetting(MODEL_SETTING, value)) }}>{(models.includes(settings.model) ? models : [settings.model, ...models]).map(model => <option key={model} value={model}>{model}</option>)}</select></label>
      <div className="action-row">
        <button type="submit" className="primary" disabled={!draft.trim()}>Enregistrer</button>
        <button type="button" disabled={!settings.key || busy} onClick={() => void test()}>{busy ? 'Vérification…' : 'Tester la clé'}</button>
        <button type="button" className="danger" disabled={!settings.key} onClick={() => void erase()}>Effacer</button>
      </div>
    </form>
    {status && <p className={status.ok ? 'save-hint' : 'field-error'} role="status">{status.text}</p>}
    <p className="save-hint">L’audio des bilans est envoyé à OpenRouter pour transcription : ne prononcez aucun nom. La clé n’est pas incluse dans la sauvegarde.</p>
  </section>
}
