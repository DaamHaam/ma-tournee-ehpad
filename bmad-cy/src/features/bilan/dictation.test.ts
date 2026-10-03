import { describe, expect, it, vi } from 'vitest'
import { audioExtension, formatDuration, insertAtCursor, NETWORK_ERROR, transcriptionError } from './dictation'
import { checkKey, transcribe } from './openrouter'

describe('dictée des bilans', () => {
  it('insère à la position du curseur avec les espaces nécessaires', () => {
    expect(insertAtCursor('', 'Marche 10 m.', 0)).toEqual({ value: 'Marche 10 m.', cursor: 12 })
    expect(insertAtCursor('Début.', ' Suite. ', 6)).toEqual({ value: 'Début. Suite.', cursor: 13 })
    expect(insertAtCursor('Début. Fin.', 'Milieu.', 6)).toEqual({ value: 'Début. Milieu. Fin.', cursor: 14 })
    expect(insertAtCursor('Douleur EVA', '2', 7)).toEqual({ value: 'Douleur 2 EVA', cursor: 9 })
    expect(insertAtCursor('Texte\n', 'Ligne', 6)).toEqual({ value: 'Texte\nLigne', cursor: 11 })
  })
  it('remplace la sélection et borne un curseur hors du texte', () => {
    expect(insertAtCursor('Marche lente.', 'rapide', 7, 12)).toEqual({ value: 'Marche rapide.', cursor: 13 })
    expect(insertAtCursor('Fin', 'après', 99)).toEqual({ value: 'Fin après', cursor: 9 })
    expect(insertAtCursor('Rien', '   ', 2)).toEqual({ value: 'Rien', cursor: 2 })
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
    await expect(checkKey('k', async () => new Response('{}', { status: 401 }))).rejects.toThrow(/refusée/)
    await expect(checkKey('k', async () => Response.json({ data: {} }))).resolves.toBeUndefined()
  })
})
