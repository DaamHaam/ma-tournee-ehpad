import { audioExtension, NETWORK_ERROR, OPENROUTER_API, transcriptionError } from './dictation'

type Fetch = typeof fetch
// Réseau qui ne répond plus (couloir sans couverture…) : l’attente est abandonnée au lieu de rester bloquée ; l’audio est gardé pour réessayer.
export const TIMEOUT_ERROR = 'Pas de réponse du service (réseau trop faible ?). Réessayez.'
async function withTimeout<T>(seconds: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), seconds * 1000)
  try { return await run(controller.signal) }
  catch (cause) { throw controller.signal.aborted ? new Error(TIMEOUT_ERROR) : cause }
  finally { clearTimeout(timer) }
}
async function call(fetcher: Fetch, path: string, key: string, init: RequestInit = {}): Promise<Response> {
  try { return await fetcher(`${OPENROUTER_API}${path}`, { ...init, headers: { Authorization: `Bearer ${key}` } }) }
  catch (cause) { if (init.signal?.aborted) throw cause; throw new Error(NETWORK_ERROR) }
}
async function detail(response: Response): Promise<string> {
  try { const body: unknown = await response.json(); const message = (body as { error?: { message?: unknown } })?.error?.message; return typeof message === 'string' ? message : '' }
  catch { return '' }
}

// Requête multipart au format OpenAI, acceptée par OpenRouter ; seul l’audio part, jamais l’identité du patient.
export async function transcribe(audio: Blob, key: string, model: string, fetcher: Fetch = fetch, seconds = 60): Promise<string> {
  const form = new FormData()
  form.append('file', audio, `dictee.${audioExtension(audio.type)}`)
  form.append('model', model)
  form.append('language', 'fr')
  return withTimeout(seconds, async signal => {
    const response = await call(fetcher, '/audio/transcriptions', key, { method: 'POST', body: form, signal })
    if (!response.ok) throw new Error(transcriptionError(response.status, await detail(response)))
    const body: unknown = await response.json().catch(() => { if (signal.aborted) throw new Error(TIMEOUT_ERROR); return null })
    const text = (body as { text?: unknown } | null)?.text
    if (typeof text !== 'string') throw new Error('Réponse de transcription illisible.')
    if (!text.trim()) throw new Error('Aucune parole reconnue.')
    return text.trim()
  })
}

// Vérifie la clé sans envoyer d’audio.
export async function checkKey(key: string, fetcher: Fetch = fetch): Promise<void> {
  const response = await call(fetcher, '/key', key)
  if (!response.ok) throw new Error(transcriptionError(response.status, await detail(response)))
}

export interface ChatResult { content: string; seconds: number; promptTokens?: number; completionTokens?: number; reasoningTokens?: number }
// Appel unique au modèle d’analyse (une seule passe) ; json demande une réponse au format JSON.
// Rapidité : réflexion du modèle désactivée (jetons de raisonnement inutiles ici) et hébergeur le plus réactif.
// Si le modèle impose sa réflexion et refuse l’option, l’appel est refait une fois sans elle.
// Réflexion du modèle : désactivée par défaut (réponse en 1 à 2 s) ; faible, moyenne ou forte pour un bilan difficile, plus lente.
export type Reasoning = 'none' | 'low' | 'medium' | 'high'
export async function chat(key: string, model: string, system: string, user: string, json: boolean, fetcher: Fetch = fetch, now: () => number = () => performance.now(), reasoning: Reasoning = 'none'): Promise<ChatResult> {
  const started = now()
  return withTimeout(reasoning === 'none' ? 90 : 240, async signal => {
  const send = async (fast: boolean) => {
    try {
      return await fetcher(`${OPENROUTER_API}/chat/completions`, {
        method: 'POST', signal, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model, temperature: 0.2, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          ...(json ? { response_format: { type: 'json_object' } } : {}),
          ...(fast ? { reasoning: reasoning === 'none' ? { enabled: false } : { effort: reasoning }, provider: { sort: 'latency' } } : {}),
        }),
      })
    } catch (cause) { if (signal.aborted) throw cause; throw new Error(NETWORK_ERROR) }
  }
  let response = await send(true)
  let error = response.ok ? '' : await detail(response)
  if (!response.ok && response.status === 400 && /reason/i.test(error)) { response = await send(false); error = response.ok ? '' : await detail(response) }
  if (!response.ok) throw new Error(transcriptionError(response.status, error).replace('Transcription impossible', 'Analyse impossible'))
  const body = await response.json().catch(() => { if (signal.aborted) throw new Error(TIMEOUT_ERROR); return null }) as { choices?: { message?: { content?: unknown } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } } } | null
  const content = body?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) throw new Error('Réponse de l’IA vide. Réessayez.')
  return { content, seconds: Math.round((now() - started) / 100) / 10, promptTokens: body?.usage?.prompt_tokens, completionTokens: body?.usage?.completion_tokens, reasoningTokens: body?.usage?.completion_tokens_details?.reasoning_tokens }
  })
}
