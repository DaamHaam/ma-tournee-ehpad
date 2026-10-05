import { useState } from 'react'
import { useSave } from '../../app/SaveContext'
import type { BilanKind } from '../../domain/model'
import { repository } from '../../storage/repository'
import { copyRich } from '../exports/clipboard'
import { htmlToText } from './richText'

// Copier (mise en forme comprise) coche « copié » : transmission du jour pour un bilan libre, évaluation pour un test.
export function useBilanCopy(date: string, id: string, kind: BilanKind = 'bilan') {
  const { run } = useSave()
  const [copied, setCopied] = useState<boolean | null>(null)
  const copy = async (html: string) => {
    const ok = await copyRich(html, htmlToText(html))
    setCopied(ok)
    window.setTimeout(() => setCopied(null), 1500)
    if (ok) await run(() => kind === 'bilan' ? repository.markBilanCopied(date, id) : repository.markTestCopied(date, id, kind))
  }
  return { copied, copy }
}
