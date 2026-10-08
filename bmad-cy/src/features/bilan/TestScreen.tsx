import { useState, type ReactNode, type RefObject } from 'react'
// Volets partagés des tests (Tinetti, bilan marche / équilibre) : onglets, dictée, résultat avec intégration IA.
import { FormatButtons, RichEditor, type FormatState, type RichEditorHandle } from './RichEditor'
import { Icon } from './screen'
import { ICONS } from './screenUtils'

export function PaneTabs({ tabs, pane, goTo }: { tabs: string[]; pane: number; goTo: (index: number) => void }) {
  return <div className="pane-tabs" role="tablist" aria-label="Volets">
    {tabs.map((tab, index) => <button key={tab} type="button" role="tab" aria-selected={pane === index} onClick={() => goTo(index)}>{tab}</button>)}
  </div>
}

// Volet Dictée : mise en forme et corbeille (efface toute la dictée, sans confirmation) ; clavier ouvert, petit micro et flèche à la place.
export function NotesPane({ editor, initialHtml, label, keyboard, tools, onChange }: { editor: RefObject<RichEditorHandle | null>; initialHtml: string; label: string; keyboard: boolean; tools?: ReactNode; onChange: (html: string, text: string) => void }) {
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const clear = () => editor.current?.setHtml('')
  return <section className="pane notes-pane" role="tabpanel" aria-label="Dictée">
    <div className="result-tools"><FormatButtons editor={editor} state={format} />{tools ?? <button type="button" className="icon-button danger" aria-label="Effacer toute la dictée" title="Effacer toute la dictée" onPointerDown={event => event.preventDefault()} onClick={clear}><Icon d={ICONS.trash} size={20} /></button>}</div>
    <RichEditor ref={editor} initialHtml={initialHtml} label={label} keyboard={keyboard} placeholder="Dictée" onChange={onChange} onFormatState={setFormat} />
  </section>
}

// Intégration de la dictée par l’IA, pilotée depuis la barre du volet Résultat.
// state : none (jamais faite), loading, done (à jour, pastille verte), stale (dictée modifiée depuis, pastille orange).
export interface Integration {
  state: 'none' | 'loading' | 'done' | 'stale'
  checks: number
  error: string
  unavailable: string
  canRun: boolean
  run: () => void
  undo: () => void
  showChecks: () => void
}

// Volet Résultat : une seule barre (G I S, ✨ intégrer ou relancer, ↶ annuler l’intégration, ⚠ points à vérifier, Valider),
// puis le compte rendu tiré du formulaire (et de la dictée intégrée), retouchable. Valider enregistre et revient.
export function ResultPane({ editor, version, initialHtml, label, keyboard, tools, ai, onChange, onValidate }: {
  editor: RefObject<RichEditorHandle | null>; version: number; initialHtml: string; label: string; keyboard: boolean; tools?: ReactNode
  ai: Integration; onChange: (html: string) => void; onValidate: () => void
}) {
  const [format, setFormat] = useState<FormatState>({ bold: false, italic: false, underline: false })
  const runLabel = ai.state === 'none' ? 'Intégrer la dictée' : ai.state === 'stale' ? 'Relancer l’intégration (dictée modifiée depuis)' : 'Relancer l’intégration'
  return <section className="pane notes-pane result-pane" role="tabpanel" aria-label="Résultat">
    <div className="result-tools">
      <FormatButtons editor={editor} state={format} />
      {tools ?? <><span className="ai-tools">
        <button type="button" className={`icon-button ai-run ${ai.state}`} aria-label={runLabel} title={ai.unavailable || (ai.canRun ? runLabel : 'Rien à intégrer : la dictée est vide')} disabled={!!ai.unavailable || !ai.canRun || ai.state === 'loading'} onClick={ai.run}>{ai.state === 'loading' ? '…' : '✨'}</button>
        {(ai.state === 'done' || ai.state === 'stale') && <button type="button" className="icon-button" aria-label="Annuler l’intégration" title="Annuler l’intégration" onClick={ai.undo}><Icon d={ICONS.undo} size={18} /></button>}
        {ai.checks > 0 && <button type="button" className="icon-button doubt-count" aria-label={`${ai.checks} point${ai.checks > 1 ? 's' : ''} à vérifier`} title="Voir dans le formulaire" onClick={ai.showChecks}>⚠{ai.checks}</button>}
      </span>
      <button type="button" className="primary validate-button" onClick={onValidate}>Valider</button></>}
    </div>
    {ai.error && <p className="field-error" role="alert">{ai.error}</p>}
    <RichEditor key={version} ref={editor} initialHtml={initialHtml} label={label} keyboard={keyboard} placeholder="Résultat" onChange={html => onChange(html)} onFormatState={setFormat} />
  </section>
}

export function TestPage({ keyboard, viewport, children }: { keyboard: boolean; viewport: { height: number; top: number } | null; children: ReactNode }) {
  return <div className={`bilan-page tinetti-page${keyboard ? ' keyboard-open' : ''}`} style={viewport ? { height: viewport.height, top: viewport.top, bottom: 'auto' } : undefined}>{children}</div>
}
