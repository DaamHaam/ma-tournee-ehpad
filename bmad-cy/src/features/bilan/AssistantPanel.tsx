import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { ANALYSIS_MODEL_SETTING, promptSetting } from './assistant'
import { KEY_SETTING } from './dictation'
import { chat } from './openrouter'
import { DEFAULT_PROMPTS, PROMPT_LABEL, type PromptKind } from './prompts'

// Réglage de l’assistant de rédaction : modèle d’analyse (même clé que la dictée) et prompts modifiables.
export function AssistantPanel() {
  const { run } = useSave()
  const settings = useLiveQuery(async () => {
    const values = new Map((await db.settings.toArray()).map(item => [item.key, item.value]))
    return { key: values.get(KEY_SETTING) ?? '', model: values.get(ANALYSIS_MODEL_SETTING) ?? '', prompts: { tinetti: values.get(promptSetting('tinetti')) ?? '', correction: values.get(promptSetting('correction')) ?? '' } }
  }, [])
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  if (!settings) return null
  const saveModel = (value: string) => { if (value.trim() !== settings.model) void run(() => value.trim() ? repository.setSetting(ANALYSIS_MODEL_SETTING, value.trim()) : repository.deleteSetting(ANALYSIS_MODEL_SETTING)) }
  // Un prompt identique au texte par défaut n’est pas enregistré : il suivra les améliorations des prochaines versions.
  const savePrompt = (kind: PromptKind, value: string) => {
    const custom = value.trim() && value.trim() !== DEFAULT_PROMPTS[kind].trim() ? value : ''
    if (custom !== settings.prompts[kind]) void run(() => custom ? repository.setSetting(promptSetting(kind), custom) : repository.deleteSetting(promptSetting(kind)))
  }
  const test = async () => {
    setBusy(true); setStatus(null)
    try { await chat(settings.key, settings.model, 'Réponds seulement : OK', 'Test de connexion.', false); setStatus({ ok: true, text: 'Modèle joignable.' }) }
    catch (cause) { setStatus({ ok: false, text: cause instanceof Error ? cause.message : 'Test impossible.' }) }
    finally { setBusy(false) }
  }
  return <section className="card dictation assistant">
    <h2>Assistant de rédaction (IA)</h2>
    <p className="save-hint">Même clé OpenRouter que la dictée. Seuls la grille et le texte, sans nom ni prénom, sont envoyés au modèle.</p>
    <label>Modèle d’analyse<input key={`model-${settings.model}`} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="ex. deepseek/…" defaultValue={settings.model} onBlur={event => saveModel(event.target.value)} /></label>
    <div className="action-row"><button type="button" disabled={!settings.key || !settings.model || busy} onClick={() => void test()}>{busy ? 'Test…' : 'Tester le modèle'}</button></div>
    {status && <p className={status.ok ? 'save-hint' : 'field-error'} role="status">{status.text}</p>}
    {(Object.keys(DEFAULT_PROMPTS) as PromptKind[]).map(kind => <details key={kind} className="prompt-editor">
      <summary>Prompt : {PROMPT_LABEL[kind]}{settings.prompts[kind] ? ' (modifié)' : ''}</summary>
      <textarea key={`${kind}-${settings.prompts[kind]}`} aria-label={`Prompt ${PROMPT_LABEL[kind]}`} rows={14} defaultValue={settings.prompts[kind] || DEFAULT_PROMPTS[kind]} onBlur={event => savePrompt(kind, event.target.value)} />
      <div className="action-row"><button type="button" disabled={!settings.prompts[kind]} onClick={() => void run(() => repository.deleteSetting(promptSetting(kind)))}>Rétablir le prompt par défaut</button></div>
    </details>)}
  </section>
}
