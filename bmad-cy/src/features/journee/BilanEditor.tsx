import { useState } from 'react'
import { useSave } from '../../app/SaveContext'
import { repository } from '../../storage/repository'
import { copyText } from '../exports/clipboard'

// Bilan libre du jour, dicté avec le micro du clavier ; ne part pas dans l'export TXT.
export function BilanEditor({ date, id, name, initial }: { date: string; id: string; name: string; initial: string }) {
  const { run } = useSave()
  const [text, setText] = useState(initial)
  const [copied, setCopied] = useState<boolean | null>(null)
  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation()
  const copy = async () => { setCopied(await copyText(text)); window.setTimeout(() => setCopied(null), 1500) }
  return <div className="bilan" onMouseDown={stop} onTouchStart={stop} onKeyDown={stop}>
    <textarea autoFocus rows={5} aria-label={`Bilan du jour pour ${name}`} placeholder="Bilan" value={text} onChange={event => { const value = event.target.value; setText(value); void run(() => repository.setBilan(date, id, value)) }} />
    <div className="action-row"><button type="button" className={copied ? 'copied' : ''} disabled={!text.trim()} onClick={() => void copy()}>{copied === null ? 'Copier' : copied ? 'Copié ✓' : 'Copie impossible'}</button></div>
  </div>
}
