import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref, type RefObject } from 'react'
import { spacing } from './dictation'
import { htmlToText, sanitizeBilanHtml } from './richText'

export type Command = 'bold' | 'italic' | 'underline'
export type FormatState = Record<Command, boolean>
export interface RichEditorHandle {
  insertText: (text: string) => void
  insertLineBreak: () => void
  setKeyboard: (open: boolean) => void
  format: (command: Command) => void
}
const COMMANDS: { command: Command; label: string; text: string }[] = [
  { command: 'bold', label: 'Gras', text: 'G' }, { command: 'italic', label: 'Italique', text: 'I' }, { command: 'underline', label: 'Souligné', text: 'S' },
]
const textOf = (range: Range) => { const box = document.createElement('div'); box.appendChild(range.cloneContents()); return htmlToText(box.innerHTML, true) }

// Éditeur du bilan : texte enrichi limité (gras, italique, souligné, retours à la ligne).
// En mode dictée (clavier fermé), toucher le texte place le curseur ; la dernière position est gardée pour les insertions.
export function RichEditor({ ref, initialHtml, label, keyboard, onChange, onFormatState, placeholder = 'Bilan' }: { ref: Ref<RichEditorHandle>; initialHtml: string; label: string; keyboard: boolean; placeholder?: string; onChange: (html: string, text: string) => void; onFormatState?: (state: FormatState) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const saved = useRef<Range | null>(null)
  const report = useRef(onFormatState)
  useEffect(() => { report.current = onFormatState }, [onFormatState])
  const setActive = (state: FormatState) => report.current?.(state)
  const inside = (node: Node | null) => !!node && !!box.current?.contains(node)
  const focused = () => document.activeElement === box.current
  const emit = () => { if (!box.current) return; const html = sanitizeBilanHtml(box.current.innerHTML); onChange(html, htmlToText(html)) }
  // Le contenu n’est écrit qu’à l’ouverture : ensuite le DOM appartient à l’éditeur (sinon le curseur sauterait à chaque saisie).
  useLayoutEffect(() => {
    if (!box.current) return
    box.current.innerHTML = initialHtml
    const end = document.createRange(); end.selectNodeContents(box.current); end.collapse(false); saved.current = end
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const update = () => {
      const selection = window.getSelection()
      if (!selection?.rangeCount || !inside(selection.anchorNode)) return
      saved.current = selection.getRangeAt(0).cloneRange()
      setActive({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), underline: document.queryCommandState('underline') })
    }
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [])
  const current = (): Range => {
    const selection = window.getSelection()
    if (focused() && selection?.rangeCount && inside(selection.getRangeAt(0).startContainer)) return selection.getRangeAt(0)
    if (saved.current && inside(saved.current.startContainer)) return saved.current
    const end = document.createRange(); end.selectNodeContents(box.current!); end.collapse(false); return end
  }
  const restore = () => { const selection = window.getSelection(); if (saved.current && selection) { selection.removeAllRanges(); selection.addRange(saved.current) } }
  const placeAfter = (node: Node) => {
    const range = document.createRange(); range.setStartAfter(node); range.collapse(true)
    saved.current = range
    if (focused()) restore()
  }
  const insertText = (text: string, spaced = true) => {
    if (!box.current) return
    const piece = spaced ? text.trim() : text
    if (!piece) return
    const range = current()
    let lead = '', trail = ''
    if (spaced) {
      const before = document.createRange(); before.setStart(box.current, 0); before.setEnd(range.startContainer, range.startOffset)
      const after = document.createRange(); after.setStart(range.endContainer, range.endOffset); after.setEnd(box.current, box.current.childNodes.length)
      ;({ lead, trail } = spacing(textOf(before), textOf(after)))
    }
    range.deleteContents()
    const node = document.createTextNode(lead + piece + trail)
    range.insertNode(node)
    placeAfter(node)
    emit()
  }
  const insertLineBreak = () => {
    if (!box.current) return
    const range = current()
    range.deleteContents()
    const br = document.createElement('br')
    range.insertNode(br)
    // Un retour à la ligne final n’est visible qu’avec un second <br> derrière lui.
    const rest = document.createRange(); rest.setStartAfter(br); rest.setEnd(box.current, box.current.childNodes.length)
    const tail = rest.cloneContents()
    if (!tail.textContent && !tail.querySelector('br')) br.after(document.createElement('br'))
    placeAfter(br)
    emit()
  }
  const format = (command: Command) => {
    if (!focused()) { box.current?.focus(); restore() }
    document.execCommand(command)
    setActive({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), underline: document.queryCommandState('underline') })
    emit()
  }
  useImperativeHandle(ref, () => ({
    format,
    insertText: text => insertText(text),
    insertLineBreak,
    // Le mode clavier ne s’applique qu’au prochain focus : on retire puis redonne le focus dans le même geste.
    setKeyboard: open => {
      const element = box.current
      if (!element) return
      element.inputMode = open ? 'text' : 'none'
      element.blur()
      if (open) { element.focus(); restore() }
    },
  }))
  return <div ref={box} className="bilan-text" role="textbox" aria-multiline="true" aria-label={label} data-placeholder={placeholder} contentEditable suppressContentEditableWarning inputMode={keyboard ? 'text' : 'none'}
      onInput={emit}
      onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); insertLineBreak() } }}
      onPaste={event => { event.preventDefault(); insertText(event.clipboardData.getData('text/plain'), false) }} />
}

// Boutons G / I / S : appliquent la mise en forme à la sélection sans retirer le focus du texte.
export function FormatButtons({ editor, state }: { editor: RefObject<RichEditorHandle | null>; state: FormatState }) {
  return <div className="format-bar" role="toolbar" aria-label="Mise en forme">
    {COMMANDS.map(({ command, label, text }) => <button key={command} type="button" className={`format-${command}`} aria-label={label} aria-pressed={state[command]} title={label} onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.format(command)}>{text}</button>)}
  </div>
}
