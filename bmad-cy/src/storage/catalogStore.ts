import { useSyncExternalStore } from 'react'
import seed from '../domain/catalogSeed.json'
import { latestCatalog, parsePublished, registerCatalog, subscribeCatalogs, type PublishedCatalog } from '../domain/catalog'
import { db } from './database'

// Catalogue des bilans : version embarquée, versions déjà reçues (réglages `catalog.<numéro>`), puis la dernière version publiée
// sur Convex, lue sans compte (requête publique `catalog:published`) à chaque ouverture, en arrière-plan.
// Rien n’est jamais envoyé à Convex : la requête ne porte aucune donnée de l’appareil.
export const CATALOG_URL = 'https://keen-pig-304.eu-west-1.convex.cloud'
export const CATALOG_SETTING = 'catalog.'

const embedded = parsePublished(seed)
if (!embedded) throw new Error('Catalogue embarqué illisible')
registerCatalog(embedded)

export async function loadStoredCatalogs(): Promise<void> {
  for (const item of await db.settings.where('key').startsWith(CATALOG_SETTING).toArray()) {
    try { const published = parsePublished(JSON.parse(item.value)); if (published) registerCatalog(published) } catch { /* version abîmée : ignorée */ }
  }
}

// Dernière version publiée ; gardée seulement si elle est plus récente que la version actuelle et bien formée.
// Hors ligne ou en cas d’erreur, l’application continue avec ce qu’elle a.
export async function refreshCatalog(fetcher: typeof fetch = fetch, url = CATALOG_URL): Promise<PublishedCatalog | null> {
  try {
    const response = await fetcher(`${url}/api/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: 'catalog:published', args: {}, format: 'json' }) })
    if (!response.ok) return null
    const body = await response.json() as { status?: string; value?: unknown }
    const published = body.status === 'success' ? parsePublished(body.value) : null
    if (!published || published.number <= latestCatalog().number) return null
    await db.settings.put({ key: `${CATALOG_SETTING}${published.number}`, value: JSON.stringify(published) })
    registerCatalog(published)
    return published
  } catch { return null }
}

export function useLatestCatalog(): PublishedCatalog { return useSyncExternalStore(subscribeCatalogs, latestCatalog) }
