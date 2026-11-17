import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../storage/database'
import { ANALYSIS_MODEL_SETTING, promptSetting, REASONING_SETTING } from './assistant'
import { KEY_SETTING } from './dictation'
import { chat, type Reasoning } from './openrouter'
import { customPrompt, defaultPrompt, PROMPT_KINDS, type PromptKind } from './prompts'
import { catalogPrompt } from '../../domain/catalog'
import { useLatestCatalog } from '../../storage/catalogStore'
import { useOnline } from './useDictation'

// Assistant de rédaction : même clé OpenRouter que la dictée, modèle et prompts choisis dans Réglages.
export function useAssistant() {
  const online = useOnline()
  // Prompt de mise en forme : celui du catalogue publié (commun, ou propre au bilan prédéfini), retouché dans Réglages s’il y a lieu.
  const catalog = useLatestCatalog().catalog
  const settings = useLiveQuery(async () => {
    const values = new Map((await db.settings.toArray()).map(item => [item.key, item.value]))
    const prompt = (kind: PromptKind, base = defaultPrompt(kind, catalogPrompt(catalog))) => customPrompt(kind, values.get(promptSetting(kind)), base) ?? base
    const level = values.get(REASONING_SETTING)
    return { reasoning: (['low', 'medium', 'high'].includes(level ?? '') ? level : 'none') as Reasoning, key: values.get(KEY_SETTING) ?? '', model: values.get(ANALYSIS_MODEL_SETTING)?.trim() ?? '', prompts: Object.fromEntries(PROMPT_KINDS.map(kind => [kind, prompt(kind)])) as Record<PromptKind, string>, prompt }
  }, [catalog])
  const unavailable = !settings ? 'Chargement…' : !settings.key ? 'Ajoutez une clé OpenRouter dans Réglages.' : !settings.model ? 'Indiquez le modèle d’analyse dans Réglages.' : !online ? 'Hors ligne.' : ''
  // La correction du bilan libre reste rapide ; la réflexion choisie dans Réglages vaut pour l’intégration des tests.
  // preset : bilan prédéfini dont le prompt propre (s’il existe dans le catalogue) remplace le prompt commun de mise en forme.
  // La correction et la mise en forme du bilan restent rapides (sans réflexion) ; la réflexion vaut pour l’intégration des tests.
  const ask = (kind: PromptKind, user: string, json: boolean, preset?: string) => {
    if (!settings || unavailable) throw new Error(unavailable)
    const system = kind === 'miseEnForme' && preset ? settings.prompt(kind, defaultPrompt(kind, catalogPrompt(catalog, preset))) : settings.prompts[kind]
    return chat(settings.key, settings.model, system, user, json, fetch, () => performance.now(), kind === 'correction' || kind === 'miseEnForme' ? 'none' : settings.reasoning)
  }
  return { unavailable, ask }
}
