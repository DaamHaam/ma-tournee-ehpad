import { useState } from 'react'
import { useSave } from '../../app/SaveContext'
import { repository } from '../../storage/repository'
import { copyRich } from '../exports/clipboard'
import { htmlToText } from './richText'

// Copier un bilan (mise en forme comprise) le coche comme copié et vaut transmission du jour.
export function useBilanCopy(date: string, id: string) {
  const { run } = useSave()
  const [copied, setCopied] = useState<boolean | null>(null)
  const copy = async (html: string) => {
    const ok = await copyRich(html, htmlToText(html))
    setCopied(ok)
    window.setTimeout(() => setCopied(null), 1500)
    if (ok) await run(() => repository.markBilanCopied(date, id))
  }
  return { copied, copy }
}
