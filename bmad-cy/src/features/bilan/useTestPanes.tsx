import { useCallback, useRef, useState, type RefObject, type UIEvent } from 'react'
import type { RichEditorHandle } from './RichEditor'
import { DictationFooter, Icon } from './screen'
import { ICONS } from './screenUtils'
import type { useDictation } from './useDictation'

// Écran des tests à trois volets que l’on fait glisser : formulaire (ou grille), dictée, résultat.
// Le micro reste accessible partout : lancée depuis le résultat, la dictée s’y insère ; sinon elle va dans le volet Dictée.
const NOTES_PANE = 1
const RESULT_PANE = 2
export function useTestPanes(notes: RefObject<RichEditorHandle | null>, result: RefObject<RichEditorHandle | null>) {
  const panes = useRef<HTMLDivElement>(null)
  const [pane, setPane] = useState(0)
  const current = useRef(0)
  const [keyboard, setKeyboard] = useState(false)
  const editorOf = (index: number) => index === NOTES_PANE ? notes : index === RESULT_PANE ? result : null
  const toggleKeyboard = (open: boolean) => { editorOf(current.current)?.current?.setKeyboard(open); setKeyboard(open) }
  // Quitter un volet referme le clavier.
  const show = (index: number) => {
    if (index === current.current) return
    if (keyboard) { editorOf(current.current)?.current?.setKeyboard(false); setKeyboard(false) }
    current.current = index; setPane(index)
  }
  const goTo = (index: number) => { const box = panes.current; if (box) box.scrollTo({ left: index * box.clientWidth, behavior: 'smooth' }) }
  const onScroll = (event: UIEvent<HTMLDivElement>) => { const box = event.currentTarget; show(Math.round(box.scrollLeft / Math.max(1, box.clientWidth))) }
  const target = useRef(NOTES_PANE)
  const insertDictation = useCallback((text: string) => (target.current === RESULT_PANE ? result : notes).current?.insertText(text), [notes, result])
  // La destination de la dictée est fixée au lancement de l’enregistrement.
  const routeDictation = (dictation: ReturnType<typeof useDictation>): ReturnType<typeof useDictation> => ({
    ...dictation, toggle: async () => { if (!dictation.recording) target.current = current.current === RESULT_PANE ? RESULT_PANE : NOTES_PANE; await dictation.toggle() },
  })
  const footer = (dictation: ReturnType<typeof useDictation>) => {
    const editor = editorOf(pane)
    return keyboard
      ? <button type="button" className="keyboard-hide" aria-label="Fermer le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(false)}><Icon d={ICONS.hide} /></button>
      : <DictationFooter dictation={routeDictation(dictation)}
        left={editor ? <button type="button" className="round-button" aria-label="Aller à la ligne" title="Aller à la ligne" onPointerDown={event => event.preventDefault()} onClick={() => editor.current?.insertLineBreak()}><Icon d={ICONS.newline} size={24} /></button> : undefined}
        right={editor ? <button type="button" className="round-button" aria-label="Ouvrir le clavier" title="Ouvrir le clavier" onPointerDown={event => event.preventDefault()} onClick={() => toggleKeyboard(true)}><Icon d={ICONS.keyboard} /></button> : undefined} />
  }
  return { panes, pane, keyboard, goTo, onScroll, insertDictation, footer }
}
