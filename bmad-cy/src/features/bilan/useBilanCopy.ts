import { useState } from 'react'
import { useSave } from '../../app/SaveContext'
import { repository } from '../../storage/repository'
import { copyText } from '../exports/clipboard'

// Copier un bilan le coche comme copié et vaut transmission du jour ; le supprimer demande confirmation.
export function useBilanCopy(date: string, id: string) {
  const { run } = useSave()
  const [copied, setCopied] = useState<boolean | null>(null)
  const copy = async (text: string) => {
    const ok = await copyText(text)
    setCopied(ok)
    window.setTimeout(() => setCopied(null), 1500)
    if (ok) await run(() => repository.markBilanCopied(date, id))
  }
  return { copied, copy }
}
