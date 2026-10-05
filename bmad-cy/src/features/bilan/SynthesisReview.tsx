import { useRef, useState } from 'react'
import { TINETTI } from '../../domain/tinetti'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { Icon } from './screen'
import { ICONS } from './screenUtils'

// Consultation de la synthèse (facultative) : réponses (✨ cotées par l’IA, ⚠ à vérifier) et texte à copier, retouchable.
export function SynthesisReview({ scores, checks, filled, initialHtml, name, request, notice, onValidate, onCancel }: {
  scores: Record<string, number>; checks: { row: string; reason: string }[]; filled: string[]; initialHtml: string; name: string
  request?: string; notice?: string; onValidate: (html: string) => void; onCancel: () => void
}) {
  const editor = useRef<RichEditorHandle>(null)
  const [html, setHtml] = useState(initialHtml)
  const [keyboard, setKeyboard] = useState(false)
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const doubts = new Map(checks.map(check => [check.row, check.reason]))
  const byAi = new Set(filled)
  const items = TINETTI.flatMap(section => section.items)
  const missing = items.filter(item => item.rows.some(row => scores[row.id] === undefined)).map(item => item.number)
  const toggleKeyboard = (open: boolean) => { editor.current?.setKeyboard(open); setKeyboard(open) }
  return <div className="synthesis" role="dialog" aria-label="Synthèse du test">
    <div className="synthesis-scroll">
      {notice && <p className="synth-notice">{notice}</p>}
      <h2>Réponses</h2>
      <ul className="answer-list">{items.flatMap(item => item.rows.filter(row => scores[row.id] !== undefined).map(row => {
        const option = row.options.find(choice => choice.score === scores[row.id])!
        const doubt = doubts.get(row.id)
        return <li key={row.id} className={doubt !== undefined ? 'doubt' : ''}>
          <span className="answer-item">{item.number}. {item.title}{row.sub ? ` – ${row.sub}` : ''}</span>
          <span className="answer-choice"><b>{option.score}</b> {option.label}{byAi.has(row.id) && <span className="ai-mark" title="Cotée par l’IA d’après la dictée"> ✨ IA</span>}{doubt !== undefined && <span className="doubt-note"> ⚠ {doubt || 'à vérifier'}</span>}</span>
        </li>
      }))}</ul>
      {!!missing.length && <p className="save-hint">Non cotés : {missing.join(', ')}.</p>}
      <div className="synthesis-text-head"><h2>Texte à copier</h2><FormatButtons editor={editor} state={format} />
        <button type="button" className="icon-button" aria-label={keyboard ? 'Fermer le clavier' : 'Ouvrir le clavier'} onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(!keyboard)}><Icon d={keyboard ? ICONS.hide : ICONS.keyboard} size={20} /></button></div>
      <RichEditor ref={editor} initialHtml={initialHtml} label={`Texte final Tinetti pour ${name}`} keyboard={keyboard} placeholder="Texte final" onChange={value => setHtml(value)} onFormatState={setFormat} />
      {request && <details className="sent-data"><summary>Données envoyées à l’IA</summary><pre>{JSON.stringify(JSON.parse(request), null, 1)}</pre></details>}
    </div>
    <div className="action-row synthesis-actions"><button type="button" className="primary" onClick={() => onValidate(html)}>Enregistrer le texte</button><button type="button" onClick={onCancel}>Fermer</button></div>
  </div>
}
