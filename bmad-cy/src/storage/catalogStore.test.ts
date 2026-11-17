import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import seed from '../domain/catalogSeed.json'
import { latestCatalog } from '../domain/catalog'
import { CATALOG_SETTING, loadStoredCatalogs, refreshCatalog } from './catalogStore'
import { db } from './database'

const reply = (value: unknown, ok = true) => (async () => ({ ok, json: async () => ({ status: 'success', value }) })) as unknown as typeof fetch

describe('catalogue lu sur Convex', () => {
  it('démarre avec la version embarquée', () => {
    expect(latestCatalog().number).toBe(0)
  })

  it('ignore une réponse vide (aucune version publiée), abîmée ou hors ligne', async () => {
    expect(await refreshCatalog(reply(null))).toBeNull()
    expect(await refreshCatalog(reply({ number: 3, publishedAt: 1, catalog: { domains: 'x' } }))).toBeNull()
    expect(await refreshCatalog((async () => { throw new TypeError('hors ligne') }) as typeof fetch)).toBeNull()
    expect(latestCatalog().number).toBe(0)
  })

  it('garde une version plus récente sur l’appareil et la relit au démarrage suivant', async () => {
    let sent: RequestInit | undefined
    const fetcher = (async (_url: string, init: RequestInit) => { sent = init; return { ok: true, json: async () => ({ status: 'success', value: { ...seed, number: 1 } }) } }) as unknown as typeof fetch
    expect((await refreshCatalog(fetcher))?.number).toBe(1)
    // La requête ne porte aucune donnée de l’appareil.
    expect(JSON.parse(String(sent?.body))).toEqual({ path: 'catalog:published', args: {}, format: 'json' })
    expect(latestCatalog().number).toBe(1)
    expect(await db.settings.get(`${CATALOG_SETTING}1`)).toBeDefined()
    expect(await refreshCatalog(reply({ ...seed, number: 1 }))).toBeNull()
    await loadStoredCatalogs()
    expect(latestCatalog().number).toBe(1)
  })
})
