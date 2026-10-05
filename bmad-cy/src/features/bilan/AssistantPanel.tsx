import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { ANALYSIS_MODEL_SETTING, promptSetting } from './assistant'
import { KEY_SETTING } from './dictation'
import { chat } from './openrouter'
import { customPrompt, DEFAULT_PROMPTS, encodeCustomPrompt, PROMPT_LABEL, type PromptKind } from './prompts'
import { copyText } from '../exports/clipboard'

// Réglage de l’assistant de rédaction : modèle d’analyse (même clé que la dictée) et prompts modifiables.
export function AssistantPanel() {
  const { run } = useSave()
  const settings = useLiveQuery(async () => {
    const values = new Map((await db.settings.toArray()).map(item => [item.key, item.value]))
    return { key: values.get(KEY_SETTING) ?? '', model: values.get(ANALYSIS_MODEL_SETTING) ?? '', prompts: { tinetti: customPrompt('tinetti', values.get(promptSetting('tinetti'))) ?? '', correction: customPrompt('correction', values.get(promptSetting('correction'))) ?? '' } }
  }, [])
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  if (!settings) return null
  const saveModel = (value: string) => { if (value.trim() !== settings.model) void run(() => value.trim() ? repository.setSetting(ANALYSIS_MODEL_SETTING, value.trim()) : repository.deleteSetting(ANALYSIS_MODEL_SETTING)) }
  // Modification transitoire : elle s’efface d’elle-même quand une mise à jour change le prompt par défaut.
  const savePrompt = (kind: PromptKind, value: string) => {
    const custom = value.trim() && value.trim() !== DEFAULT_PROMPTS[kind].trim() ? value : ''
    if (custom !== settings.prompts[kind]) void run(() => custom ? repository.setSetting(promptSetting(kind), encodeCustomPrompt(kind, custom)) : repository.deleteSetting(promptSetting(kind)))
  }
  const copyPrompt = async (kind: PromptKind) => setStatus(await copyText(settings.prompts[kind] || DEFAULT_PROMPTS[kind]) ? { ok: true, text: 'Prompt copié.' } : { ok: false, text: 'Copie impossible.' })
  const test = async () => {
    setBusy(true); setStatus(null)
    try { const result = await chat(settings.key, settings.model, 'Réponds seulement : OK', 'Test de connexion.', false); setStatus({ ok: true, text: `Modèle joignable (réponse en ${result.seconds} s).` }) }
    catch (cause) { setStatus({ ok: false, text: cause instanceof Error ? cause.message : 'Test impossible.' }) }
    finally { setBusy(false) }
  }
  return <section className="card dictation assistant">
    <h2>Assistant de rédaction (IA)</h2>
    <p className="save-hint">Même clé OpenRouter que la dictée. Seuls la grille et le texte, sans nom ni prénom, sont envoyés au modèle. Une modification des prompts ci-dessous est transitoire : la prochaine mise à jour de l’application remet le prompt par défaut.</p>
    <label>Modèle d’analyse<input key={`model-${settings.model}`} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="ex. deepseek/…" defaultValue={settings.model} onBlur={event => saveModel(event.target.value)} /></label>
    <div className="action-row"><button type="button" disabled={!settings.key || !settings.model || busy} onClick={() => void test()}>{busy ? 'Test…' : 'Tester le modèle'}</button></div>
    {status && <p className={status.ok ? 'save-hint' : 'field-error'} role="status">{status.text}</p>}
    {(Object.keys(DEFAULT_PROMPTS) as PromptKind[]).map(kind => <details key={kind} className="prompt-editor">
      <summary>Prompt : {PROMPT_LABEL[kind]}{settings.prompts[kind] ? ' (modifié)' : ''}</summary>
      <textarea key={`${kind}-${settings.prompts[kind]}`} aria-label={`Prompt ${PROMPT_LABEL[kind]}`} rows={14} defaultValue={settings.prompts[kind] || DEFAULT_PROMPTS[kind]} onBlur={event => savePrompt(kind, event.target.value)} />
      <div className="action-row"><button type="button" onClick={() => void copyPrompt(kind)}>Copier</button><button type="button" disabled={!settings.prompts[kind]} onClick={() => void run(() => repository.deleteSetting(promptSetting(kind)))}>Rétablir le prompt par défaut</button></div>
    </details>)}
  </section>
}
