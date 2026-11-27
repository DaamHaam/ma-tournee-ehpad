import { useState } from 'react'
import { useSave } from '../../app/SaveContext'
import type { BilanKind, DayBilan } from '../../domain/model'
import { repository } from '../../storage/repository'
import { copyRich } from '../exports/clipboard'
import { clipboardContent, itemHtml, joinBilans } from './display'
import { db } from '../../storage/database'
import { netsoinRecap, nsDone } from '../../domain/netsoin'
import type { NsTest } from '../../domain/model'

const NS_NAME: Record<NsTest, string> = { tinetti: 'Tinetti', tug: 'TUG' }
// Après la copie d’un bilan libre contenant des tests NS pas encore validés : « Recopié dans NetSoin ? ». Oui vaut le ✓ vert
// du panneau NS (date du test NS, Éval cochée) ; non ne change rien, le test reste « à recopier ».
async function askNs(date: string, id: string, run: ReturnType<typeof useSave>['run']) {
  const entry = (await db.days.get(date))?.entries[id]
  if (!entry?.bilanForm) return
  const recap = netsoinRecap({ kind: 'bilan', form: entry.bilanForm })
  const pending = (['tinetti', 'tug'] as const).filter(test => recap[test] && !nsDone(recap, test, entry.ns))
  if (!pending.length || !window.confirm(`${pending.map(test => NS_NAME[test]).join(' et ')} : recopié dans NetSoin ?`)) return
  for (const test of pending) await run(() => repository.validateNs(date, id, test, recap[test]!.fingerprint))
}

// Copier (mise en forme comprise) coche « copié » : transmission du jour pour un bilan libre, évaluation pour un test.
export function useBilanCopy(date: string, id: string, kind: BilanKind = 'bilan') {
  const { run } = useSave()
  const [copied, setCopied] = useState<boolean | null>(null)
  const copy = async (html: string) => {
    const content = clipboardContent(kind, html)
    const ok = await copyRich(content.html, content.text)
    setCopied(ok)
    window.setTimeout(() => setCopied(null), 1500)
    if (ok) await run(() => kind === 'bilan' ? repository.markBilanCopied(date, id) : repository.markTestCopied(date, id, kind))
    if (ok && kind === 'bilan') await askNs(date, id, run)
  }
  return { copied, copy }
}

// « Tout copier » : les bilans du patient bout à bout ; chacun est ensuite marqué copié comme une copie individuelle.
export function useBilanGroupCopy(date: string) {
  const { run } = useSave()
  const [copied, setCopied] = useState<{ id: string; ok: boolean } | null>(null)
  const copy = async (id: string, items: DayBilan[]) => {
    const { html, text } = joinBilans(items.map(itemHtml))
    const ok = await copyRich(html, text)
    setCopied({ id, ok })
    window.setTimeout(() => setCopied(null), 1500)
    if (ok) for (const item of items) await run(() => item.kind === 'bilan' ? repository.markBilanCopied(date, item.id) : repository.markTestCopied(date, item.id, item.kind))
    if (ok && items.some(item => item.kind === 'bilan')) await askNs(date, id, run)
  }
  return { copied, copy }
}
