// Dictée des bilans via OpenRouter : règles pures (insertion, format audio, erreurs) testées hors React.
export const KEY_SETTING = 'openrouterKey'
export const MODEL_SETTING = 'transcriptionModel'
export const TRANSCRIPTION_MODELS = ['openai/whisper-large-v3', 'openai/whisper-large-v3-turbo', 'openai/whisper-1'] as const
export const DEFAULT_MODEL = TRANSCRIPTION_MODELS[0]
export const MAX_DICTATION_SECONDS = 5 * 60
export const OPENROUTER_API = 'https://openrouter.ai/api/v1'

// Espaces à ajouter autour d’une dictée selon le texte qui la précède et celui qui la suit.
export function spacing(before: string, after: string): { lead: string; trail: string } {
  return { lead: before && !/\s$/.test(before) ? ' ' : '', trail: after && !/^[\s.,;:!?)]/.test(after) ? ' ' : '' }
}

// Extension attendue par OpenRouter selon le type produit par l’enregistreur (Safari iPhone : audio/mp4).
export function audioExtension(mimeType: string): string {
  const type = mimeType.toLowerCase()
  if (type.includes('webm')) return 'webm'
  if (type.includes('ogg')) return 'ogg'
  if (type.includes('wav')) return 'wav'
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3'
  if (type.includes('aac')) return 'aac'
  return 'm4a'
}

export function formatDuration(seconds: number): string { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }

export function transcriptionError(status: number, detail = ''): string {
  if (status === 401 || status === 403) return 'Clé OpenRouter refusée. Vérifiez-la dans Réglages.'
  if (status === 402) return 'Crédit OpenRouter insuffisant.'
  if (status === 413) return 'Enregistrement trop volumineux.'
  if (status === 408 || status === 429) return 'Service de transcription saturé. Réessayez dans un instant.'
  if (status >= 500) return 'Service de transcription indisponible. Réessayez.'
  return `Transcription impossible (${status}${detail ? ` : ${detail}` : ''}).`
}
export const NETWORK_ERROR = 'Connexion impossible. Réessayez ou utilisez le micro du clavier.'
