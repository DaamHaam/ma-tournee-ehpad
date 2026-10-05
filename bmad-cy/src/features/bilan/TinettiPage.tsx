import { useCallback, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSave } from '../../app/SaveContext'
import { db } from '../../storage/database'
import { repository } from '../../storage/repository'
import { fullName, parseDate, validDate, type Entry } from '../../domain/model'
import { hasTestContent, previousTest, TINETTI, tinettiResultHtml, tinettiScore, type TestRecord } from '../../domain/tinetti'
import { useBilanCopy } from './useBilanCopy'
import { RichEditor, type RichEditorHandle } from './RichEditor'
import { appendText, htmlToText } from './richText'
import { testNotesHtml } from './display'
import { useDictation } from './useDictation'
import { DictationFooter, Icon, ScreenHeader } from './screen'
import { backTarget, ICONS, useVisibleViewport } from './screenUtils'

// Test de Tinetti en plein écran : volets Équilibre, Marche et Dictée à faire glisser, micro toujours accessible.
export function TinettiPage() {
  const { date = '', id = '' } = useParams()
  const target = backTarget(useLocation().state, date)
  const valid = validDate(date)
  const day = useLiveQuery(() => valid ? repository.dayView(date) : undefined, [date, valid])
  const previous = useLiveQuery(async () => valid ? { found: previousTest(await db.days.where('date').below(date).toArray(), id, date, 'tinetti') } : undefined, [date, id, valid])
  if (!valid) return <Navigate replace to="/" />
  if (!day || !previous) return null
  const entry = day.entries[id]
  if (!entry) return <Navigate replace to={`/?date=${date}`} />
  return <TinettiEditor key={`${date}-${id}`} date={date} id={id} {...target} entry={entry} previous={previous.found} />
}

function TinettiEditor({ date, id, back, label, entry, previous }: { date: string; id: string; back: string; label: string; entry: Entry; previous: { date: string; record: TestRecord } | null }) {
  const { run } = useSave()
  const navigate = useNavigate()
  const name = fullName(entry.patient)
  const [initial] = useState(() => entry.tests?.tinetti)
  const [scores, setScores] = useState<Record<string, number>>(initial?.scores ?? {})
  const [notesHtml, setNotesHtml] = useState(() => initial ? testNotesHtml(initial) : '')
  const [startNotes] = useState(notesHtml)
  const latestNotes = useRef(notesHtml)
  const changed = useRef(false)
  const editor = useRef<RichEditorHandle>(null)
  const panes = useRef<HTMLDivElement>(null)
  const [pane, setPane] = useState(0)
  const viewport = useVisibleViewport()
  const { copied, copy } = useBilanCopy(date, id, 'tinetti')
  const score = tinettiScore(scores)
  const choose = (row: string, value: number) => {
    const next = { ...scores }
    if (next[row] === value) delete next[row]
    else next[row] = value
    setScores(next); changed.current = true
    void run(() => repository.setTest(date, id, 'tinetti', { scores: next }))
  }
  const saveNotes = useCallback((html: string, text: string) => {
    latestNotes.current = html; setNotesHtml(html); changed.current = true
    void run(() => repository.setTest(date, id, 'tinetti', { notes: text, notesHtml: html }))
  }, [date, id, run])
  const dictation = useDictation(
    useCallback((text: string) => editor.current?.insertText(text), []),
    useCallback(async (text: string) => { const value = appendText(latestNotes.current, text); latestNotes.current = value; await run(() => repository.setTest(date, id, 'tinetti', { notes: htmlToText(value), notesHtml: value })) }, [date, id, run]),
  )
  // ✕ : quitte en remettant le test tel qu’il était à l’ouverture (absent s’il n’existait pas).
  const cancel = async () => {
    if (changed.current) await run(() => repository.restoreTest(date, id, 'tinetti', initial))
    navigate(back)
  }
  const goTo = (index: number) => { const box = panes.current; if (box) box.scrollTo({ left: index * box.clientWidth, behavior: 'smooth' }) }
  const tabs = [`Équilibre ${score.equilibre.score}/${score.equilibre.max}`, `Marche ${score.marche.score}/${score.marche.max}`, 'Dictée']
  const empty = !hasTestContent({ scores, notes: htmlToText(notesHtml) })
  return <div className="bilan-page tinetti-page" style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>
    <ScreenHeader back={back} backLabel={label} patient={entry.patient}
      tools={<span className="total-badge" aria-label={`Total ${score.total} sur ${score.max}`}>Tinetti {score.total}/{score.max}</span>}
      copied={copied} copyDisabled={empty} onCopy={() => void copy(tinettiResultHtml({ scores }, notesHtml))} onCancel={() => void cancel()} />
    <div className="pane-tabs" role="tablist" aria-label="Volets du test">
      {tabs.map((tab, index) => <button key={tab} type="button" role="tab" aria-selected={pane === index} onClick={() => goTo(index)}>{tab}</button>)}
    </div>
    {previous && <p className="previous-note">★ cotations du {parseDate(previous.date).toLocaleDateString('fr-FR')} : {tinettiScore(previous.record.scores).total}/28</p>}
    <div className="panes" ref={panes} onScroll={event => { const box = event.currentTarget; setPane(Math.round(box.scrollLeft / Math.max(1, box.clientWidth))) }}>
      {TINETTI.map(section => <section key={section.id} className="pane" aria-label={section.title}>
        <p className="pane-instructions">{section.instructions}</p>
        {section.items.map(item => <div key={item.number} className="test-item">
          <h3>{item.number}. {item.title}</h3>
          {item.rows.map(row => <div key={row.id} className="test-row" role="radiogroup" aria-label={`${item.number}. ${item.title}${row.sub ? ` – ${row.sub}` : ''}`}>
            {row.sub && <p className="row-sub">{row.sub}</p>}
            {row.options.map(option => <button key={option.score} type="button" role="radio" className="test-option" aria-checked={scores[row.id] === option.score} aria-label={`${option.score} – ${option.label}`} onClick={() => choose(row.id, option.score)}>
              <span className="option-score">{option.score}</span><span className="option-label">{option.label}</span>{previous?.record.scores[row.id] === option.score && <span className="previous-mark" title="Cotation précédente">★</span>}
            </button>)}
          </div>)}
        </div>)}
      </section>)}
      <section className="pane notes-pane" aria-label="Dictée">
        <RichEditor ref={editor} initialHtml={startNotes} label={`Observations Tinetti pour ${name}`} keyboard={false} onChange={saveNotes} />
      </section>
    </div>
    <DictationFooter dictation={dictation}
      left={pane === 2 ? <button type="button" className="round-button" aria-label="Aller à la ligne" title="Aller à la ligne" onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.insertLineBreak()}><Icon d={ICONS.newline} size={24} /></button> : undefined} />
  </div>
}
