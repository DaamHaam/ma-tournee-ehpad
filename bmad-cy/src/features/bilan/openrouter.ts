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
