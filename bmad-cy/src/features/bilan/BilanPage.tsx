import { useCallback, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { repository, type BilanSnapshot } from '../../storage/repository'
import { validDate, type Entry } from '../../domain/model'
import { useBilanCopy } from './useBilanCopy'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { appendText, bilanHtml, htmlToText } from './richText'
import { useDictation } from './useDictation'
import { DictationFooter, Icon, ScreenHeader } from './screen'
import { backTarget, ICONS, useBlockEdgeSwipe, useVisibleViewport } from './screenUtils'

// Bilan libre du jour en plein écran ; ne part pas dans l’export TXT.
export function BilanPage() {
  const { date = '', id = '' } = useParams()
  const target = backTarget(useLocation().state, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  if (!valid) return <Navigate replace to="/" />
  if (!day) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <BilanEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} />
}

const snapshotOf = (entry: Entry): BilanSnapshot => ({ bilan: entry.bilan, bilanHtml: entry.bilanHtml, bilanAt: entry.bilanAt, bilanCopied: entry.bilanCopied })

function BilanEditor({ date, id, back, label, entry }: { date: string; id: string; back: string; label: string; entry: Entry }) {
  const { run } = useSave()
  const navigate = useNavigate()
  const [initial] = useState(() => ({ html: bilanHtml(entry), snapshot: snapshotOf(entry) }))
  const [html, setHtml] = useState(initial.html)
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const { copied, copy } = useBilanCopy(date, id)
  const editor = useRef<RichEditorHandle>(null)
  const latest = useRef(initial.html)
  // Mode dictée par défaut : toucher le texte place le curseur sans ouvrir le clavier ; le bouton clavier l’ouvre pour taper.
  const [keyboard, setKeyboard] = useState(false)
  const viewport = useVisibleViewport()
  useBlockEdgeSwipe()
  const save = useCallback((value: string, text: string) => { latest.current = value; setHtml(value); void run(() => repository.setBilan(date, id, text, value)) }, [date, id, run])
  const dictation = useDictation(
    useCallback((text: string) => editor.current?.insertText(text), []),
    // Page quittée pendant la transcription : la dictée s’ajoute en fin de bilan.
    useCallback(async (text: string) => { const value = appendText(latest.current, text); latest.current = value; await run(() => repository.setBilan(date, id, htmlToText(value), value)) }, [date, id, run]),
  )
  const toggleKeyboard = (open: boolean) => { editor.current?.setKeyboard(open); setKeyboard(open) }
  // ✕ : quitte en remettant le bilan tel qu’il était à l’ouverture.
  const cancel = async () => {
    if (latest.current !== initial.html) await run(() => repository.restoreBilan(date, id, initial.snapshot))
    navigate(back)
  }
  return <div className={`bilan-page${keyboard ? ' keyboard-open' : ''}`} style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient} tools={<FormatButtons editor={editor} state={format} />}
      copied={copied} copyDisabled={!htmlToText(html).trim()} onCopy={() => void copy(html)} onCancel={() => void cancel()} />
    <RichEditor ref={editor} initialHtml={initial.html} label={`Bilan du jour pour ${entry.patient.lastName} ${entry.patient.firstName}`.trim()} keyboard={keyboard} onChange={save} onFormatState={setFormat} />
    {keyboard
      ? <button type="button" className="keyboard-hide" aria-label="Fermer le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(false)}><Icon d={ICONS.hide} /></button>
      : <DictationFooter dictation={dictation}
        left={<button type="button" className="round-button" aria-label="Aller à la ligne" title="Aller à la ligne" onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.insertLineBreak()}><Icon d={ICONS.newline} size={24} /></button>}
        right={<button type="button" className="round-button" aria-label="Ouvrir le clavier" title="Ouvrir le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(true)}><Icon d={ICONS.keyboard} /></button>} />}
  </div>
}
