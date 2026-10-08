import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../storage/database'
import { ANALYSIS_MODEL_SETTING, promptSetting, REASONING_SETTING } from './assistant'
import { KEY_SETTING } from './dictation'
import { chat, type Reasoning } from './openrouter'
import { repository } from '../../storage/repository'
import { customPrompt, DEFAULT_PROMPTS, PROMPT_KINDS, type PromptKind } from './prompts'
import { useOnline } from './useDictation'

// Assistant de rédaction : même clé OpenRouter que la dictée, modèle et prompts choisis dans Réglages.
export function useAssistant() {
  const online = useOnline()
  const settings = useLiveQuery(async () => {
    const values = new Map((await db.settings.toArray()).map(item => [item.key, item.value]))
    const prompt = (kind: PromptKind) => customPrompt(kind, values.get(promptSetting(kind))) ?? DEFAULT_PROMPTS[kind]
    const level = values.get(REASONING_SETTING)
    return { reasoning: (['low', 'medium', 'high'].includes(level ?? '') ? level : 'none') as Reasoning, key: values.get(KEY_SETTING) ?? '', model: values.get(ANALYSIS_MODEL_SETTING)?.trim() ?? '', prompts: Object.fromEntries(PROMPT_KINDS.map(kind => [kind, prompt(kind)])) as Record<PromptKind, string> }
  }, [])
  const unavailable = !settings ? 'Chargement…' : !settings.key ? 'Ajoutez une clé OpenRouter dans Réglages.' : !settings.model ? 'Indiquez le modèle d’analyse dans Réglages.' : !online ? 'Hors ligne.' : ''
  // La correction du bilan libre reste rapide ; la réflexion choisie dans le Résultat vaut pour l’intégration des tests.
  const ask = (kind: PromptKind, user: string, json: boolean) => {
    if (!settings || unavailable) throw new Error(unavailable)
    return chat(settings.key, settings.model, settings.prompts[kind], user, json, fetch, () => performance.now(), kind === 'correction' ? 'none' : settings.reasoning)
  }
  const setReasoning = (level: Reasoning) => repository.setSetting(REASONING_SETTING, level)
  return { unavailable, ask, reasoning: settings?.reasoning ?? 'none', setReasoning }
}
