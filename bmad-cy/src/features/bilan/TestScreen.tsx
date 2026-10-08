import { useState, type ReactNode, type RefObject } from 'react'
// Volets partagés des tests (Tinetti, bilan marche / équilibre) : onglets, dictée, résultat avec intégration IA.
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import type { ChatResult } from './openrouter'

export function PaneTabs({ tabs, pane, goTo }: { tabs: string[]; pane: number; goTo: (index: number) => void }) {
  return <div className="pane-tabs" role="tablist" aria-label="Volets">
    {tabs.map((tab, index) => <button key={tab} type="button" role="tab" aria-selected={pane === index} onClick={() => goTo(index)}>{tab}</button>)}
  </div>
}

export function NotesPane({ editor, initialHtml, label, keyboard, onChange }: { editor: RefObject<RichEditorHandle | null>; initialHtml: string; label: string; keyboard: boolean; onChange: (html: string, text: string) => void }) {
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  return <section className="pane notes-pane" role="tabpanel" aria-label="Dictée">
    <FormatButtons editor={editor} state={format} />
    <RichEditor ref={editor} initialHtml={initialHtml} label={label} keyboard={keyboard} placeholder="Dictée" onChange={onChange} onFormatState={setFormat} />
  </section>
}

// Intégration de la dictée par l’IA, affichée en bandeau dans le volet Résultat.
export interface Integration {
  state: 'none' | 'loading' | 'done' | 'stale'
  summary: string
  checks: string[]
  error: string
  unavailable: string
  canRun: boolean
  request: string
  stats: ChatResult | null
  run: () => void
}
function bannerText(ai: Integration) {
  if (ai.state === 'loading') return 'Intégration en cours…'
  if (ai.state === 'stale') return 'Dictée modifiée depuis l’intégration'
  if (ai.state === 'done') return ai.summary
  return 'Dictée non intégrée'
}

// Volet Résultat : compte rendu tiré du formulaire (et de la dictée intégrée), retouchable, puis Valider (enregistre et revient).
export function ResultPane({ editor, version, initialHtml, label, keyboard, retouched, ai, onChange, onValidate }: {
  editor: RefObject<RichEditorHandle | null>; version: number; initialHtml: string; label: string; keyboard: boolean; retouched: boolean
  ai: Integration; onChange: (html: string) => void; onValidate: () => void
}) {
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  return <section className="pane notes-pane result-pane" role="tabpanel" aria-label="Résultat">
    <div className="synth-bar">
      <span className={`synth-state${ai.state === 'done' ? ' done' : ''}`}>{bannerText(ai)}</span>
      <button type="button" className="synth-button" disabled={!!ai.unavailable || !ai.canRun || ai.state === 'loading'} title={ai.unavailable || (ai.canRun ? 'Intégrer la dictée avec l’IA' : 'Rien à intégrer : la dictée est vide')} onClick={ai.run}>{ai.state === 'loading' ? '…' : ai.state === 'none' ? '✨ Intégrer la dictée' : '✨ Relancer'}</button>
    </div>
    {ai.error && <p className="field-error" role="alert">{ai.error}</p>}
    {ai.checks.map(check => <p key={check} className="row-doubt" role="note">⚠ {check}</p>)}
    <div className="result-tools"><FormatButtons editor={editor} state={format} /><button type="button" className="primary validate-button" onClick={onValidate}>Valider</button></div>
    <RichEditor key={version} ref={editor} initialHtml={initialHtml} label={label} keyboard={keyboard} placeholder="Résultat" onChange={html => onChange(html)} onFormatState={setFormat} />
    {retouched && <p className="save-hint">Texte retouché : il sera régénéré si le formulaire change.</p>}
    {ai.request && <details className="sent-data"><summary>Données envoyées à l’IA</summary>{ai.stats && <p className="save-hint">Réponse en {String(ai.stats.seconds).replace('.', ',')} s · {ai.stats.promptTokens ?? '?'} jetons envoyés, {ai.stats.completionTokens ?? '?'} reçus{ai.stats.reasoningTokens ? `, dont ${ai.stats.reasoningTokens} de réflexion` : ''}.</p>}<pre>{JSON.stringify(JSON.parse(ai.request), null, 1)}</pre></details>}
  </section>
}

export function TestPage({ keyboard, viewport, children }: { keyboard: boolean; viewport: { height: number; top: number } | null; children: ReactNode }) {
  return <div className={`bilan-page tinetti-page${keyboard ? ' keyboard-open' : ''}`} style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>{children}</div>
}
