import { useRef, useState, type RefObject } from 'react'
import { TINETTI } from '../../domain/tinetti'
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { DictationFooter, Icon } from './screen'
import { ICONS } from './screenUtils'
import type { useDictation } from './useDictation'
import type { ChatResult } from './openrouter'

// Écran 1 de la synthèse : uniquement ce qui est catégorisé dans le formulaire (✨ coté par l’IA, ⚠ à vérifier).
export function ReviewAnswers({ stats, scores, checks, filled, request, notice, onBack, onNext }: {
  stats?: ChatResult | null; scores: Record<string, number>; checks: { row: string; reason: string }[]; filled: string[]
  request?: string; notice?: string; onBack: () => void; onNext: () => void
}) {
  const doubts = new Map(checks.map(check => [check.row, check.reason]))
  const byAi = new Set(filled)
  const items = TINETTI.flatMap(section => section.items)
  const missing = items.filter(item => item.rows.some(row => scores[row.id] === undefined)).map(item => item.number)
  return <div className="synthesis" role="dialog" aria-label="Synthèse du test">
    <div className="synthesis-scroll">
      {notice && <p className="synth-notice">{notice}</p>}
      <h2>Réponses</h2>
      <ul className="answer-list">{items.flatMap(item => item.rows.filter(row => scores[row.id] !== undefined).map(row => {
        const option = row.options.find(choice => choice.score === scores[row.id])!
        const doubt = doubts.get(row.id)
        return <li key={row.id} className={doubt !== undefined ? 'doubt' : ''}>
          <span className="answer-item">{item.number}. {item.title}{row.sub ? ` – ${row.sub}` : ''}</span>
          <span className="answer-choice"><b>{option.score}</b> {option.label}{byAi.has(row.id) && <span className="ai-mark" title="Cotée par l’IA d’après la dictée"> ✨</span>}{doubt !== undefined && <span className="doubt-note"> ⚠ {doubt || 'à vérifier'}</span>}</span>
        </li>
      }))}</ul>
      {!!missing.length && <p className="save-hint">Non cotés : {missing.join(', ')}.</p>}
      {request && <details className="sent-data"><summary>Données envoyées à l’IA</summary>{stats && <p className="save-hint">Réponse en {String(stats.seconds).replace('.', ',')} s · {stats.promptTokens ?? '?'} jetons envoyés, {stats.completionTokens ?? '?'} reçus{stats.reasoningTokens ? `, dont ${stats.reasoningTokens} de réflexion` : ''}.</p>}<pre>{JSON.stringify(JSON.parse(request), null, 1)}</pre></details>}
    </div>
    <div className="action-row synthesis-actions"><button type="button" onClick={onBack}>Retour à la grille</button><button type="button" className="primary" onClick={onNext}>Valider</button></div>
  </div>
}

// Écran 2 : texte de transmission en plein écran, à finaliser (dictée au curseur, G I S, clavier facultatif) puis valider.
export function TransmissionScreen({ initialHtml, name, editor, dictation, onBack, onValidate }: {
  initialHtml: string; name: string; editor: RefObject<RichEditorHandle | null>; dictation: ReturnType<typeof useDictation>
  onBack: () => void; onValidate: (html: string) => void
}) {
  const [keyboard, setKeyboard] = useState(false)
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const latest = useRef(initialHtml)
  const toggleKeyboard = (open: boolean) => { editor.current?.setKeyboard(open); setKeyboard(open) }
  return <div className={`synthesis transmission-screen${keyboard ? ' keyboard-open' : ''}`} role="dialog" aria-label="Transmission">
    <header className="screen-header">
      <button type="button" className="icon-link plain" aria-label="Retour aux réponses" onClick={onBack}><Icon d={ICONS.back} /></button>
      <div className="screen-name"><strong>Transmission</strong><span>{name}</span></div>
      <FormatButtons editor={editor} state={format} />
      <button type="button" className="primary validate-button" onClick={() => onValidate(latest.current)}>Valider</button>
    </header>
    <RichEditor ref={editor} initialHtml={initialHtml} label={`Transmission Tinetti pour ${name}`} keyboard={keyboard} placeholder="Transmission" onChange={value => { latest.current = value }} onFormatState={setFormat} />
    {keyboard
      ? <button type="button" className="keyboard-hide" aria-label="Fermer le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(false)}><Icon d={ICONS.hide} /></button>
      : <DictationFooter dictation={dictation}
        left={<button type="button" className="round-button" aria-label="Aller à la ligne" title="Aller à la ligne" onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.insertLineBreak()}><Icon d={ICONS.newline} size={24} /></button>}
        right={<button type="button" className="round-button" aria-label="Ouvrir le clavier" title="Ouvrir le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(true)}><Icon d={ICONS.keyboard} /></button>} />}
  </div>
}
