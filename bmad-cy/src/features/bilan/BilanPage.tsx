import { useCallback, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { repository, type BilanSnapshot } from '../../storage/repository'
import { validDate, type Entry, type Sex } from '../../domain/model'
import { db } from '../../storage/database'
import { useAssistant } from './useAssistant'
import { anonymizeWithMap, correctionRequest, parseCorrectionReply } from './assistant'
import { filledMeasures, latestMeasures, MEASURE_RUBRICS, TINETTI_MEASURE, type Measure } from '../../domain/mesures'
import { pickRubric, rubricText, withoutRubric, type FlexInput } from '../../domain/marcheEquilibre'
import { LastMeasures, RecognizedTests, type Recognized } from './RecognizedTests'
import { useBilanCopy } from './useBilanCopy'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { appendText, bilanHtml, htmlToText } from './richText'
import { useDictation } from './useDictation'
import { BarButton, DictationFooter, KeyboardBar, ScreenHeader } from './screen'
import { OpenBilansStrip } from './OpenBilans'
import { backTarget, ICONS, useBlockEdgeSwipe, useKeyboardLost, useOutsideText, useVisibleViewport } from './screenUtils'

// Bilan libre du jour en plein écran ; ne part pas dans l’export TXT.
export function BilanPage() {
  const { date = '', id = '' } = useParams()
  // Revenu d’un test ouvert depuis les dernières mesures : l’origine du bilan (journée ou onglet Bilans) suit dans l’adresse.
  const location = useLocation()
  const target = backTarget(location.state ?? { from: new URLSearchParams(location.search).get('from') }, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  const sex = useLiveQuery(async () => (await db.patients.get(id))?.sex ?? '', [id])
  const previous = useLiveQuery(async () => valid ? latestMeasures(await db.days.where('date').below(date).toArray(), id, date) : undefined, [date, id, valid])
  if (!valid) return <Navigate replace to="/" />
  if (!day || sex === undefined || !previous) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <BilanEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} sex={sex} previous={previous} />
}

const snapshotOf = (entry: Entry): BilanSnapshot => ({ bilan: entry.bilan, bilanHtml: entry.bilanHtml, bilanAt: entry.bilanAt, bilanCopied: entry.bilanCopied, bilanEditedAt: entry.bilanEditedAt, bilanMeasures: entry.bilanMeasures })
const MEASURE_ORDER = [...MEASURE_RUBRICS.map(rubric => rubric.id), TINETTI_MEASURE]

function BilanEditor({ date, id, back, label, entry, sex, previous }: { date: string; id: string; back: string; label: string; entry: Entry; sex: Sex; previous: Record<string, Measure> }) {
  const { run } = useSave()
  const navigate = useNavigate()
  const [initial] = useState(() => ({ html: bilanHtml(entry), snapshot: snapshotOf(entry) }))
  const [html, setHtml] = useState(initial.html)
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const { copied, copy } = useBilanCopy(date, id)
  const editor = useRef<RichEditorHandle>(null)
  const latest = useRef(initial.html)
  // Clavier ouvert dès qu’on touche le texte ; la flèche le referme et la dictée continue au micro.
  const [keyboard, setKeyboard] = useState(false)
  const viewport = useVisibleViewport()
  useBlockEdgeSwipe()
  const remember = useOutsideText(bilanHtml(entry), value => editor.current?.setHtml(value))
  const save = useCallback((value: string, text: string) => { latest.current = value; setHtml(value); remember(bilanHtml({ bilan: text, bilanHtml: text.trim() ? value : undefined })); void run(() => repository.setBilan(date, id, text, value)) }, [date, id, run, remember])
  const dictation = useDictation(
    useCallback((text: string) => editor.current?.insertDictation(text), []),
    // Page quittée pendant la transcription : la dictée s’ajoute en fin de bilan.
    useCallback(async (text: string) => { const value = appendText(latest.current, text); latest.current = value; await run(() => repository.setBilan(date, id, htmlToText(value), value)) }, [date, id, run]),
  )
  // Correction par l’IA en une seule passe, texte anonymisé ; la version précédente reste récupérable.
  // La même réponse rapporte les tests standardisés du texte : seuls les nouveaux (absents ou différents de ceux déjà
  // enregistrés pour ce bilan) sont proposés à la validation.
  const assistant = useAssistant()
  const [correction, setCorrection] = useState<{ busy?: boolean; previous?: string; error?: string }>({})
  const [recognized, setRecognized] = useState<Recognized | null>(null)
  const measuresChanged = useRef(false)
  const correct = async () => {
    setCorrection({ busy: true }); setRecognized(null)
    try {
      const { text, found } = anonymizeWithMap(latest.current, [entry.patient.lastName, entry.patient.firstName])
      const reply = parseCorrectionReply((await assistant.ask('correction', correctionRequest(text, sex), true)).content, found, sex)
      const before = latest.current
      editor.current?.setHtml(reply.html)
      setCorrection({ previous: before })
      const saved = entry.bilanMeasures ?? {}
      const tests = filledMeasures(reply.measures).filter(test => rubricText(test, reply.measures) !== rubricText(test, saved))
      if (tests.length || reply.tinetti) setRecognized({ measures: reply.measures, tests, tinetti: reply.tinetti })
    } catch (cause) { setCorrection({ error: cause instanceof Error ? cause.message : 'Correction impossible.' }) }
  }
  const undoCorrection = () => { if (correction.previous !== undefined) editor.current?.setHtml(correction.previous); setCorrection({}); setRecognized(null) }
  // Mesures validées : remplacent, test par test, celles déjà tirées de ce bilan.
  const saveMeasures = (measures: FlexInput, tests: string[]) => {
    let next: FlexInput = entry.bilanMeasures ?? { choices: [], values: {} }
    for (const test of tests) {
      const part = pickRubric(measures, test), rest = withoutRubric(next, test)
      next = { choices: [...rest.choices ?? [], ...part.choices ?? []], values: { ...rest.values, ...part.values } }
    }
    measuresChanged.current = true
    setRecognized(null)
    void run(() => repository.setBilanMeasures(date, id, next))
  }
  const lastMeasures = MEASURE_ORDER.filter(test => previous[test]).map(test => [test, previous[test]] as [string, Measure])
  const toggleKeyboard = (open: boolean) => { editor.current?.setKeyboard(open); setKeyboard(open) }
  useKeyboardLost(keyboard, () => toggleKeyboard(false))
  // ✕ : quitte en remettant le bilan tel qu’il était à l’ouverture.
  const cancel = async () => {
    if (latest.current !== initial.html || measuresChanged.current) await run(() => repository.restoreBilan(date, id, initial.snapshot))
    navigate(back)
  }
  // ✨ Corriger : en bas de page, et à gauche du petit micro quand le clavier est ouvert (correction sans le fermer).
  const aiButton = (size?: 'small') => <button type="button" className={`round-button ai-round${size ? ` ${size}` : ''}`} aria-label="Corriger avec l’IA" title={assistant.unavailable || 'Corriger avec l’IA'} disabled={!!assistant.unavailable || correction.busy || !htmlToText(html).trim()} onPointerDown={event => event.preventDefault()} onClick={() => void correct()}>{correction.busy ? '…' : '✨'}</button>
  // Clavier ouvert : le panneau des tests reconnus attend sa fermeture ; un compteur le signale et le referme d’un toucher.
  const recognizedCount = recognized ? recognized.tests.length + (recognized.tinetti ? 1 : 0) : 0
  // Copier pendant une dictée donnerait un texte incomplet, et la transcription arrivée ensuite retirerait la marque « copié ».
  const dictationBusy = dictation.recording || dictation.transcribing
  // Dernières mesures : toucher un test ouvre le test rapide du jour sur ce test (ou la grille du Tinetti) ; le retour ramène ici.
  const openMeasure = async (test: string) => {
    await dictation.finish()
    const here = `/bilan/${date}/${id}?from=${encodeURIComponent(back)}`
    navigate(test === TINETTI_MEASURE ? `/tinetti/${date}/${id}` : `/mesures/${date}/${id}?test=${test}`, { state: { from: here } })
  }
  return <div className={`bilan-page${keyboard ? ' keyboard-open' : ''}`} style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient} tools={<FormatButtons editor={editor} state={format} />}
      copied={copied} done={!!entry.bilanCopied} copyDisabled={!htmlToText(html).trim() || dictationBusy} onCopy={() => void copy(html)} onCancel={() => void cancel()} />
    {!keyboard && <OpenBilansStrip date={date} id={id} kind="bilan" beforeLeave={dictation.finish} />}
    {!keyboard && <LastMeasures measures={lastMeasures} onOpen={test => void openMeasure(test)} />}
    <RichEditor ref={editor} initialHtml={initial.html} label={`Bilan du jour pour ${entry.patient.lastName} ${entry.patient.firstName}`.trim()} onChange={save} onFocus={() => setKeyboard(true)} onFormatState={setFormat} />
    {keyboard
      ? <KeyboardBar dictation={dictation} left={<>{recognizedCount > 0 && <button type="button" className="recognized-count" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(false)}>{recognizedCount} {recognizedCount > 1 ? 'tests reconnus' : 'test reconnu'}</button>}{aiButton('small')}</>} onHide={() => toggleKeyboard(false)} />
      : <>{recognized && <RecognizedTests found={recognized} previous={previous} tinettiPath={`/tinetti/${date}/${id}`} onSave={saveMeasures} onDismiss={() => setRecognized(null)} />}<DictationFooter dictation={dictation}
        extra={correction.error && <p className="field-error" role="alert">{correction.error}</p>}
        left={<>
          {aiButton()}
          {correction.previous !== undefined && <BarButton label="Annuler la correction" icon={ICONS.undo} onClick={undoCorrection} />}
          <BarButton label="Aller à la ligne" icon={ICONS.newline} size={24} onClick={() => editor.current?.insertLineBreak()} />
        </>}
        /></>}
  </div>
}
