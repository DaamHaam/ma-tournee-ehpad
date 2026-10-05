import { audioExtension, NETWORK_ERROR, OPENROUTER_API, transcriptionError } from './dictation'

type Fetch = typeof fetch
async function call(fetcher: Fetch, path: string, key: string, init: RequestInit = {}): Promise<Response> {
  try { return await fetcher(`${OPENROUTER_API}${path}`, { ...init, headers: { Authorization: `Bearer ${key}` } }) }
  catch { throw new Error(NETWORK_ERROR) }
}
async function detail(response: Response): Promise<string> {
  try { const body: unknown = await response.json(); const message = (body as { error?: { message?: unknown } })?.error?.message; return typeof message === 'string' ? message : '' }
  catch { return '' }
}

// Requête multipart au format OpenAI, acceptée par OpenRouter ; seul l’audio part, jamais l’identité du patient.
export async function transcribe(audio: Blob, key: string, model: string, fetcher: Fetch = fetch): Promise<string> {
  const form = new FormData()
  form.append('file', audio, `dictee.${audioExtension(audio.type)}`)
  form.append('model', model)
  form.append('language', 'fr')
  const response = await call(fetcher, '/audio/transcriptions', key, { method: 'POST', body: form })
  if (!response.ok) throw new Error(transcriptionError(response.status, await detail(response)))
  const body: unknown = await response.json().catch(() => null)
  const text = (body as { text?: unknown } | null)?.text
  if (typeof text !== 'string') throw new Error('Réponse de transcription illisible.')
  if (!text.trim()) throw new Error('Aucune parole reconnue.')
  return text.trim()
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
export async function chat(key: string, model: string, system: string, user: string, json: boolean, fetcher: Fetch = fetch, now: () => number = () => performance.now()): Promise<ChatResult> {
  const started = now()
  const send = async (fast: boolean) => {
    try {
      return await fetcher(`${OPENROUTER_API}/chat/completions`, {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model, temperature: 0.2, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          ...(json ? { response_format: { type: 'json_object' } } : {}),
          ...(fast ? { reasoning: { enabled: false }, provider: { sort: 'latency' } } : {}),
        }),
      })
    } catch { throw new Error(NETWORK_ERROR) }
  }
  let response = await send(true)
  let error = response.ok ? '' : await detail(response)
  if (!response.ok && response.status === 400 && /reason/i.test(error)) { response = await send(false); error = response.ok ? '' : await detail(response) }
  if (!response.ok) throw new Error(transcriptionError(response.status, error).replace('Transcription impossible', 'Analyse impossible'))
  const body = await response.json().catch(() => null) as { choices?: { message?: { content?: unknown } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } } } | null
  const content = body?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) throw new Error('Réponse de l’IA vide. Réessayez.')
  return { content, seconds: Math.round((now() - started) / 100) / 10, promptTokens: body?.usage?.prompt_tokens, completionTokens: body?.usage?.completion_tokens, reasoningTokens: body?.usage?.completion_tokens_details?.reasoning_tokens }
}
