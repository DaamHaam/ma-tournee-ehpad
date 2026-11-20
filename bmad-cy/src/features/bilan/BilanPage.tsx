import { useCallback, useEffect, useRef, useState } from 'react'
import { useTwoPanes } from './useTwoPanes'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { repository, type BilanSnapshot } from '../../storage/repository'
import { validDate, type Entry, type Sex } from '../../domain/model'
import { db } from '../../storage/database'
import { useAssistant } from './useAssistant'
import { anonymizeWithMap, correctionRequest, formatRequest, parseCorrectionReply } from './assistant'
import { filledMeasures, latestMeasures, MEASURE_RUBRICS, type Measure } from '../../domain/mesures'
import { pickRubric, rubricText, withoutRubric, type FlexInput } from '../../domain/marcheEquilibre'
import { blockHtml, catalogFor, formBlocks, formHash, NS_COMMENT, rubricOfTest, formPlan, formTitle, hasFormContent, previousFormLines, type BilanForm } from '../../domain/catalog'
import { useLatestCatalog } from '../../storage/catalogStore'
import { LastMeasures, RecognizedTests, type Recognized } from './RecognizedTests'
import { ReperesPane, type PreviousLines } from './Reperes'
import { useBilanCopy } from './useBilanCopy'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { appendText, bilanHtml, escapeHtml, htmlToText, sanitizeBilanHtml } from './richText'
import { useDictation } from './useDictation'
import { BarButton, DictationFooter, KeyboardBar, ScreenHeader } from './screen'
import { OpenBilansStrip } from './OpenBilans'
import { backTarget, ICONS, useBlockEdgeSwipe, useKeyboardLost, useOutsideText, useVisibleViewport } from './screenUtils'

// Bilan du jour en plein écran, en deux volets que l’on fait glisser : « Bilan » (on dicte et on écrit) et « Repères »
// (catalogue de l’organisateur de bilans, que l’on consulte et coche). Ne part pas dans l’export TXT.
export function BilanPage() {
  const { date = '', id = '' } = useParams()
  // Revenu d’un test ouvert depuis les dernières mesures : l’origine du bilan (journée ou onglet Bilans) suit dans l’adresse.
  const location = useLocation()
  const target = backTarget(location.state ?? { from: new URLSearchParams(location.search).get('from') }, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  const sex = useLiveQuery(async () => (await db.patients.get(id))?.sex ?? '', [id])
  const atcdKine = useLiveQuery(async () => (await db.patients.get(id))?.atcdKine ?? '', [id])
  const history = useLiveQuery(async () => {
    if (!valid) return undefined
    const days = await db.days.where('date').below(date).toArray()
    return { measures: latestMeasures(days, id, date), form: previousFormLines(days, id, date) }
  }, [date, id, valid])
  if (!valid) return <Navigate replace to="/" />
  if (!day || sex === undefined || atcdKine === undefined || !history) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <BilanEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} sex={sex} previous={history.measures} previousForm={history.form} atcdKine={atcdKine} initialTest={new URLSearchParams(location.search).get('test') ?? ''} />
}

const snapshotOf = (entry: Entry): BilanSnapshot => ({ bilan: entry.bilan, bilanHtml: entry.bilanHtml, bilanAt: entry.bilanAt, bilanCopied: entry.bilanCopied, bilanEditedAt: entry.bilanEditedAt, bilanMeasures: entry.bilanMeasures, bilanForm: entry.bilanForm })
const MEASURE_ORDER = MEASURE_RUBRICS.map(rubric => rubric.id)

function BilanEditor({ date, id, back, label, entry, sex, previous, previousForm, atcdKine, initialTest }: { date: string; id: string; back: string; label: string; entry: Entry; sex: Sex; previous: Record<string, Measure>; previousForm: PreviousLines | null; atcdKine: string; initialTest: string }) {
  const { run } = useSave()
  const navigate = useNavigate()
  const [initial] = useState(() => ({ html: bilanHtml(entry), snapshot: snapshotOf(entry) }))
  const [html, setHtml] = useState(initial.html)
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const { copied, copy } = useBilanCopy(date, id)
  const editor = useRef<RichEditorHandle>(null)
  const latest = useRef(initial.html)
  // Repères : la version du catalogue est notée au premier élément coché et reste celle du bilan ensuite.
  const latestCatalog = useLatestCatalog()
  const [form, setForm] = useState<BilanForm>(() => entry.bilanForm ?? { version: latestCatalog.number, choices: [], values: {} })
  const catalog = entry.bilanForm ? catalogFor(form.version) : latestCatalog.catalog
  const formChanged = useRef(false)
  const changeForm = (next: BilanForm) => {
    const value = hasFormContent(form) || hasFormContent(next) ? next : { ...next, version: latestCatalog.number }
    formChanged.current = true; setForm(value)
    void run(() => repository.setBilanForm(date, id, value))
  }
  // Clavier ouvert dès qu’on touche le texte ; la flèche le referme et la dictée continue au micro.
  const [keyboard, setKeyboard] = useState(false)
  const viewport = useVisibleViewport()
  useBlockEdgeSwipe()
  const remember = useOutsideText(bilanHtml(entry), value => editor.current?.setHtml(value))
  const save = useCallback((value: string, text: string) => { latest.current = value; setHtml(value); remember(bilanHtml({ bilan: text, bilanHtml: text.trim() ? value : undefined })); void run(() => repository.setBilan(date, id, text, value)) }, [date, id, run, remember])
  const appendHtml = (piece: string) => { const value = htmlToText(latest.current).trim() ? `${latest.current}<br>${piece}` : piece; editor.current?.setHtml(value) }
  const dictation = useDictation(
    useCallback((text: string) => editor.current?.insertDictation(text), []),
    // Page quittée pendant la transcription : la dictée s’ajoute en fin de bilan.
    useCallback(async (text: string) => { const value = appendText(latest.current, text); latest.current = value; await run(() => repository.setBilan(date, id, htmlToText(value), value)) }, [date, id, run]),
  )
  const toggleKeyboard = (open: boolean) => { editor.current?.setKeyboard(open); setKeyboard(open) }
  const { panes, tab, goTo, onScroll: scrollPanes } = useTwoPanes()
  // IA en une seule passe, texte anonymisé ; la version précédente reste récupérable (↶).
  // Sans repère coché : ✨ corrige le texte. Avec des repères : ✨ met en forme (fusion des lignes cochées et du texte).
  // La même réponse rapporte les tests standardisés du texte : seuls les nouveaux (absents ou différents de ceux déjà
  // enregistrés pour ce bilan) sont proposés à la validation.
  const assistant = useAssistant()
  const [correction, setCorrection] = useState<{ busy?: boolean; previous?: string; previousAi?: BilanForm['ai'] | null; error?: string }>({})
  const [recognized, setRecognized] = useState<Recognized | null>(null)
  const measuresChanged = useRef(false)
  const context = { catalog, form, sex }
  const blocks = formBlocks(context)
  // Commentaire commun des tests NS : une ligne de plus pour ✨ (et sans IA).
  const nsComment = (form.values[NS_COMMENT] ?? '').trim()
  const lines = [...blocks.map(blockHtml), ...(nsComment ? [`Commentaire : ${escapeHtml(nsComment)}`] : [])]
  const withForm = lines.length > 0
  const stale = withForm && form.ai?.hash !== formHash(form)
  const runAi = async () => {
    setCorrection({ busy: true }); setRecognized(null)
    try {
      const names = [entry.patient.lastName, entry.patient.firstName]
      const { text, found } = anonymizeWithMap(latest.current, names)
      const reply = withForm
        ? parseCorrectionReply((await assistant.ask('miseEnForme', formatRequest({ text, title: formTitle(context), plan: formPlan(context), lines, unchecked: (form.ai?.lines ?? []).filter(line => !lines.includes(line)) }, sex, names), true, form.preset)).content, found, sex)
        : parseCorrectionReply((await assistant.ask('correction', correctionRequest(text, sex), true)).content, found, sex)
      const before = latest.current
      editor.current?.setHtml(reply.html)
      setCorrection({ previous: before, previousAi: withForm ? form.ai ?? null : undefined })
      if (withForm) changeForm({ ...form, ai: { hash: formHash(form), lines } })
      const saved = entry.bilanMeasures ?? {}
      const tests = filledMeasures(reply.measures).filter(test => rubricText(test, reply.measures) !== rubricText(test, saved))
      if (tests.length) setRecognized({ measures: reply.measures, tests })
    } catch (cause) { setCorrection({ error: cause instanceof Error ? cause.message : 'Mise en forme impossible.' }) }
  }
  const undoCorrection = () => {
    if (correction.previous !== undefined) editor.current?.setHtml(correction.previous)
    if (correction.previousAi !== undefined) changeForm({ ...form, ai: correction.previousAi ?? undefined })
    setCorrection({}); setRecognized(null)
  }
  // ✨ sans IA (hors ligne, sans clé) : les lignes des repères s’ajoutent à la fin du texte, titre compris.
  const insertLines = () => {
    const title = formTitle(context)
    appendHtml(sanitizeBilanHtml([...(title && !htmlToText(latest.current).includes(title) ? [`<i><u>${title}</u></i>`] : []), ...lines].join('<br>')))
    changeForm({ ...form, ai: { hash: formHash(form), lines } })
    goTo(0)
  }
  const offline = !!assistant.unavailable && withForm
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
  useKeyboardLost(keyboard, () => toggleKeyboard(false))
  // ✕ : quitte en remettant le bilan tel qu’il était à l’ouverture (texte, repères, mesures).
  const cancel = async () => {
    if (latest.current !== initial.html || measuresChanged.current || formChanged.current) await run(() => repository.restoreBilan(date, id, initial.snapshot))
    navigate(back)
  }
  // ✨ : en bas de page, et à gauche du petit micro quand le clavier est ouvert ; pastille orange : repères changés depuis.
  const aiLabel = withForm ? (stale && form.ai ? 'Refaire la mise en forme (repères changés depuis)' : 'Mettre en forme avec les repères cochés') : 'Corriger avec l’IA'
  const aiButton = (size?: 'small') => <button type="button" className={`round-button ai-round${size ? ` ${size}` : ''}${stale && form.ai ? ' stale' : ''}`} aria-label={aiLabel} title={offline ? `${assistant.unavailable} ✨ ajoute les repères sans IA.` : assistant.unavailable || aiLabel} disabled={(!!assistant.unavailable && !offline) || correction.busy || (!htmlToText(html).trim() && !withForm)} onPointerDown={event => event.preventDefault()} onClick={() => { if (offline) insertLines(); else void runAi() }}>{correction.busy ? '…' : '✨'}</button>
  // Clavier ouvert : le panneau des tests reconnus attend sa fermeture ; un compteur le signale et le referme d’un toucher.
  const recognizedCount = recognized?.tests.length ?? 0
  // Copier pendant une dictée donnerait un texte incomplet, et la transcription arrivée ensuite retirerait la marque « copié ».
  const dictationBusy = dictation.recording || dictation.transcribing
  // Dernières mesures (et ★ de la fiche, par ?test=) : le test s’ouvre seul dans les repères de ce bilan.
  const [focus, setFocus] = useState(() => rubricOfTest(initialTest))
  useEffect(() => { if (focus) goTo(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const openMeasure = (test: string) => { setFocus(rubricOfTest(test)); goTo(1) }
  const checked = form.choices.length + Object.values(form.values).filter(value => value.trim()).length
  return <div className={`bilan-page${keyboard ? ' keyboard-open' : ''}`} style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient} tools={<FormatButtons editor={editor} state={format} />}
      copied={copied} done={!!entry.bilanCopied} copyDisabled={!htmlToText(html).trim() || dictationBusy} onCopy={() => void copy(html)} onCancel={() => void cancel()} />
    {!keyboard && <OpenBilansStrip date={date} id={id} kind="bilan" beforeLeave={dictation.finish} />}
    {!keyboard && <div className="pane-dots" role="tablist" aria-label="Volets">{['Bilan', checked ? `Repères · ${checked}` : 'Repères'].map((name, index) => <button key={index} type="button" role="tab" aria-label={name} aria-selected={tab === index} onClick={() => goTo(index)} />)}</div>}
    <div className="panes" ref={panes} onScroll={event => { scrollPanes(event); if (keyboard && event.currentTarget.scrollLeft > 20) toggleKeyboard(false) }}>
      <section className="pane notes-pane" role="tabpanel" aria-label="Bilan">
        {!keyboard && <LastMeasures measures={lastMeasures} onOpen={openMeasure} />}
        <RichEditor ref={editor} initialHtml={initial.html} label={`Bilan du jour pour ${entry.patient.lastName} ${entry.patient.firstName}`.trim()} onChange={save} onFocus={() => { setKeyboard(true); if (tab !== 0) goTo(0) }} onFormatState={setFormat} />
      </section>
      <ReperesPane key={focus} catalog={catalog} form={form} measures={previous} previous={previousForm} initialFocus={focus} atcdKine={atcdKine} onChange={changeForm} />
    </div>
    {keyboard
      ? <KeyboardBar dictation={dictation} left={<>{recognizedCount > 0 && <button type="button" className="recognized-count" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(false)}>{recognizedCount} {recognizedCount > 1 ? 'tests reconnus' : 'test reconnu'}</button>}{aiButton('small')}</>} onHide={() => toggleKeyboard(false)} />
      : <>{recognized && <RecognizedTests found={recognized} previous={previous} onSave={saveMeasures} onDismiss={() => setRecognized(null)} />}<DictationFooter dictation={dictation}
        extra={correction.error && <p className="field-error" role="alert">{correction.error}</p>}
        left={<>
          {aiButton()}
          {correction.previous !== undefined && <BarButton label={correction.previousAi !== undefined ? 'Annuler la mise en forme' : 'Annuler la correction'} icon={ICONS.undo} onClick={undoCorrection} />}
          <BarButton label="Aller à la ligne" icon={ICONS.newline} size={24} onClick={() => editor.current?.insertLineBreak()} />
        </>}
        /></>}
  </div>
}
