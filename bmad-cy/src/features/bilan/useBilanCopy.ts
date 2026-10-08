import { useState } from 'react'
import { useSave } from '../../app/SaveContext'
import type { BilanKind, DayBilan } from '../../domain/model'
import { repository } from '../../storage/repository'
import { copyRich } from '../exports/clipboard'
import { clipboardContent, itemHtml, joinBilans } from './display'

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
  }
  return { copied, copy }
}
