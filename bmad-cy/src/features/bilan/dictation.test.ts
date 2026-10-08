import { describe, expect, it, vi } from 'vitest'
import { audioExtension, formatDuration, NETWORK_ERROR, spacing, transcriptionError } from './dictation'
import { checkKey, TIMEOUT_ERROR, transcribe } from './openrouter'

describe('dictée des bilans', () => {
  it('ajoute les espaces nécessaires autour d’une dictée', () => {
    expect(spacing('', '')).toEqual({ lead: '', trail: '' })
    expect(spacing('Début.', 'Fin.')).toEqual({ lead: ' ', trail: ' ' })
    expect(spacing('Douleur ', ', EVA')).toEqual({ lead: '', trail: '' })
    expect(spacing('Texte\n', ' suite')).toEqual({ lead: '', trail: '' })
  })
  it('déduit l’extension audio et formate la durée', () => {
    expect(audioExtension('audio/mp4')).toBe('m4a')
    expect(audioExtension('audio/webm;codecs=opus')).toBe('webm')
    expect(audioExtension('')).toBe('m4a')
    expect(formatDuration(300)).toBe('5:00')
    expect(formatDuration(42)).toBe('0:42')
  })
  it('traduit les erreurs OpenRouter', () => {
    expect(transcriptionError(401)).toMatch(/Clé OpenRouter refusée/)
    expect(transcriptionError(402)).toMatch(/Crédit/)
    expect(transcriptionError(503)).toMatch(/indisponible/)
    expect(transcriptionError(400, 'format')).toBe('Transcription impossible (400 : format).')
  })
  it('envoie l’audio en multipart avec le modèle et le français, puis lit le texte', async () => {
    const fetcher = vi.fn(async () => Response.json({ text: ' Marche 10 m en 12 s. ' }))
    const text = await transcribe(new Blob(['son'], { type: 'audio/mp4' }), 'sk-or-test', 'openai/whisper-large-v3', fetcher)
    expect(text).toBe('Marche 10 m en 12 s.')
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://openrouter.ai/api/v1/audio/transcriptions')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ Authorization: 'Bearer sk-or-test' })
    const form = init.body as FormData
    expect(form.get('model')).toBe('openai/whisper-large-v3')
    expect(form.get('language')).toBe('fr')
    expect((form.get('file') as File).name).toBe('dictee.m4a')
  })
  it('signale une clé refusée, une réponse vide ou l’absence de réseau', async () => {
    const audio = new Blob(['son'], { type: 'audio/mp4' })
    await expect(transcribe(audio, 'k', 'm', async () => Response.json({ error: { message: 'No auth' } }, { status: 401 }))).rejects.toThrow(/Clé OpenRouter refusée/)
    await expect(transcribe(audio, 'k', 'm', async () => Response.json({ text: '  ' }))).rejects.toThrow('Aucune parole reconnue.')
    await expect(transcribe(audio, 'k', 'm', async () => { throw new TypeError('offline') })).rejects.toThrow(NETWORK_ERROR)
    // Réseau muet : l’attente s’arrête au lieu de rester sur « Transcription… ».
    const silent = (_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('abandon', 'AbortError'))))
    await expect(transcribe(audio, 'k', 'm', silent as typeof fetch, 0.05)).rejects.toThrow(TIMEOUT_ERROR)
    await expect(checkKey('k', async () => new Response('{}', { status: 401 }))).rejects.toThrow(/refusée/)
    await expect(checkKey('k', async () => Response.json({ data: {} }))).resolves.toBeUndefined()
  })
})

describe('appel au modèle d’analyse', () => {
  it('demande une réponse rapide (sans réflexion, hébergeur réactif) et mesure durée et jetons', async () => {
    const { chat } = await import('./openrouter')
    let clock = 1000
    const fetcher = vi.fn(async () => { clock += 3200; return Response.json({ choices: [{ message: { content: '{"ok":1}' } }], usage: { prompt_tokens: 900, completion_tokens: 120, completion_tokens_details: { reasoning_tokens: 0 } } }) })
    const result = await chat('k', 'deepseek/x', 'système', 'texte', true, fetcher, () => clock)
    expect(result).toEqual({ content: '{"ok":1}', seconds: 3.2, promptTokens: 900, completionTokens: 120, reasoningTokens: 0 })
    const body = JSON.parse((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body).toMatchObject({ model: 'deepseek/x', reasoning: { enabled: false }, provider: { sort: 'latency' }, response_format: { type: 'json_object' } })
  })
  it('refait l’appel sans l’option si le modèle impose sa réflexion', async () => {
    const { chat } = await import('./openrouter')
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: { message: 'Reasoning is mandatory for this endpoint' } }, { status: 400 }))
      .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: 'Texte' } }] }))
    expect((await chat('k', 'm', 's', 'u', false, fetcher)).content).toBe('Texte')
    expect(JSON.parse(fetcher.mock.calls[1][1].body).reasoning).toBeUndefined()
  })
})
