import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../storage/database'
import { ANALYSIS_MODEL_SETTING, promptSetting } from './assistant'
import { KEY_SETTING } from './dictation'
import { chat } from './openrouter'
import { customPrompt, DEFAULT_PROMPTS, PROMPT_KINDS, type PromptKind } from './prompts'
import { useOnline } from './useDictation'

// Assistant de rédaction : même clé OpenRouter que la dictée, modèle et prompts choisis dans Réglages.
export function useAssistant() {
  const online = useOnline()
  const settings = useLiveQuery(async () => {
    const values = new Map((await db.settings.toArray()).map(item => [item.key, item.value]))
    const prompt = (kind: PromptKind) => customPrompt(kind, values.get(promptSetting(kind))) ?? DEFAULT_PROMPTS[kind]
    return { key: values.get(KEY_SETTING) ?? '', model: values.get(ANALYSIS_MODEL_SETTING)?.trim() ?? '', prompts: Object.fromEntries(PROMPT_KINDS.map(kind => [kind, prompt(kind)])) as Record<PromptKind, string> }
  }, [])
  const unavailable = !settings ? 'Chargement…' : !settings.key ? 'Ajoutez une clé OpenRouter dans Réglages.' : !settings.model ? 'Indiquez le modèle d’analyse dans Réglages.' : !online ? 'Hors ligne.' : ''
  const ask = (kind: PromptKind, user: string, json: boolean) => {
    if (!settings || unavailable) throw new Error(unavailable)
    return chat(settings.key, settings.model, settings.prompts[kind], user, json)
  }
  return { unavailable, ask }
}
