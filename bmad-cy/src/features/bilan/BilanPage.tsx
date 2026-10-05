import { useCallback, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { repository, type BilanSnapshot } from '../../storage/repository'
import { validDate, type Entry, type Sex } from '../../domain/model'
import { db } from '../../storage/database'
import { useAssistant } from './useAssistant'
import { anonymizeWithMap, parseCorrection, restoreNames, sexLabel } from './assistant'
import { useBilanCopy } from './useBilanCopy'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { appendText, bilanHtml, htmlToText, sanitizeBilanHtml } from './richText'
import { useDictation } from './useDictation'
import { DictationFooter, Icon, ScreenHeader } from './screen'
import { backTarget, ICONS, useBlockEdgeSwipe, useVisibleViewport } from './screenUtils'

// Bilan libre du jour en plein écran ; ne part pas dans l’export TXT.
export function BilanPage() {
  const { date = '', id = '' } = useParams()
  const target = backTarget(useLocation().state, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  const sex = useLiveQuery(async () => (await db.patients.get(id))?.sex ?? '', [id])
  if (!valid) return <Navigate replace to="/" />
  if (!day || sex === undefined) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <BilanEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} sex={sex} />
}

const snapshotOf = (entry: Entry): BilanSnapshot => ({ bilan: entry.bilan, bilanHtml: entry.bilanHtml, bilanAt: entry.bilanAt, bilanCopied: entry.bilanCopied })

function BilanEditor({ date, id, back, label, entry, sex }: { date: string; id: string; back: string; label: string; entry: Entry; sex: Sex }) {
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
  // Correction par l’IA en une seule passe, texte anonymisé ; la version précédente reste récupérable.
  const assistant = useAssistant()
  const [correction, setCorrection] = useState<{ busy?: boolean; previous?: string; error?: string }>({})
  const correct = async () => {
    setCorrection({ busy: true })
    try {
      const { text, found } = anonymizeWithMap(latest.current, [entry.patient.lastName, entry.patient.firstName])
      const corrected = sanitizeBilanHtml(restoreNames(parseCorrection(await assistant.ask('correction', `Sexe : ${sexLabel(sex)}\n\nTexte :\n${text}`, false)), found))
      const previous = latest.current
      editor.current?.setHtml(corrected)
      setCorrection({ previous })
    } catch (cause) { setCorrection({ error: cause instanceof Error ? cause.message : 'Correction impossible.' }) }
  }
  const undoCorrection = () => { if (correction.previous !== undefined) editor.current?.setHtml(correction.previous); setCorrection({}) }
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
        extra={<>
          <div className="assist-row">
            <button type="button" className="synth-button" disabled={!!assistant.unavailable || correction.busy || !htmlToText(html).trim()} title={assistant.unavailable || 'Corriger avec l’IA'} onClick={() => void correct()}>{correction.busy ? 'Correction…' : '✨ Corriger'}</button>
            {correction.previous !== undefined && <button type="button" className="synth-button" onClick={undoCorrection}>Annuler la correction</button>}
          </div>
          {correction.error && <p className="field-error" role="alert">{correction.error}</p>}
        </>}
        left={<button type="button" className="round-button" aria-label="Aller à la ligne" title="Aller à la ligne" onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.insertLineBreak()}><Icon d={ICONS.newline} size={24} /></button>}
        right={<button type="button" className="round-button" aria-label="Ouvrir le clavier" title="Ouvrir le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(true)}><Icon d={ICONS.keyboard} /></button>} />}
  </div>
}
