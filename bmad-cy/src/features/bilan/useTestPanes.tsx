import { useCallback, useRef, useState, type RefObject, type UIEvent } from 'react'
import type { RichEditorHandle } from './RichEditor'
import { BarButton, DictationFooter, KeyboardBar } from './screen'
import { ICONS, useKeyboardLost } from './screenUtils'
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
  useKeyboardLost(keyboard, () => { editorOf(current.current)?.current?.setKeyboard(false); setKeyboard(false) })
  const goTo = (index: number) => { const box = panes.current; if (box) box.scrollTo({ left: index * box.clientWidth, behavior: 'smooth' }) }
  // Fin de glissement : le volet est recalé s’il est resté à cheval (le bas d’écran change de hauteur pendant le geste).
  const settle = useRef<number | undefined>(undefined)
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const box = event.currentTarget
    show(Math.round(box.scrollLeft / Math.max(1, box.clientWidth)))
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const left = Math.round(box.scrollLeft / Math.max(1, box.clientWidth)) * box.clientWidth
      if (Math.abs(box.scrollLeft - left) > 1) box.scrollTo({ left, behavior: 'smooth' })
    }, 160)
  }
  const target = useRef(NOTES_PANE)
  const insertDictation = useCallback((text: string) => (target.current === RESULT_PANE ? result : notes).current?.insertText(text), [notes, result])
  // La destination de la dictée est fixée au lancement de l’enregistrement.
  const routeDictation = (dictation: ReturnType<typeof useDictation>): ReturnType<typeof useDictation> => ({
    ...dictation, toggle: async () => { if (!dictation.recording) target.current = current.current === RESULT_PANE ? RESULT_PANE : NOTES_PANE; await dictation.toggle() },
  })
  // Formulaire : micro seul, flottant. Dictée et Résultat : ⏎ à gauche, clavier et ⌫ à droite. Clavier ouvert : petit micro et flèche.
  const footer = (dictation: ReturnType<typeof useDictation>) => {
    const editor = editorOf(pane)
    const routed = routeDictation(dictation)
    if (keyboard) return null
    if (!editor) return <DictationFooter dictation={routed} floating />
    return <DictationFooter dictation={routed}
      left={<BarButton label="Aller à la ligne" icon={ICONS.newline} size={24} onClick={() => editor.current?.insertLineBreak()} />}
      right={<><BarButton label="Ouvrir le clavier" icon={ICONS.keyboard} onClick={() => toggleKeyboard(true)} /><BarButton label="Effacer" icon={ICONS.erase} onClick={() => editor.current?.deleteBackward()} /></>} />
  }
  // ⚠ du Résultat : retour au formulaire, sur le premier point à vérifier.
  // Défilement vertical du seul formulaire (scrollIntoView ferait aussi glisser les volets et ramènerait au formulaire
  // quelqu’un qui en est reparti entre-temps).
  const showFirstDoubt = () => {
    goTo(0)
    const pane = panes.current?.querySelector<HTMLElement>('.pane')
    const doubt = pane?.querySelector<HTMLElement>('.row-doubt')
    if (!pane || !doubt) return
    const top = pane.scrollTop + doubt.getBoundingClientRect().top - pane.getBoundingClientRect().top - pane.clientHeight / 2
    pane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }
  // Clavier ouvert : petit micro et flèche dans la barre d’outils du volet (plus de rangée perdue au-dessus du clavier).
  const keyboardTools = (dictation: ReturnType<typeof useDictation>) => keyboard ? <KeyboardBar dictation={routeDictation(dictation)} onHide={() => toggleKeyboard(false)} /> : null
  return { panes, pane, keyboard, goTo, onScroll, insertDictation, footer, keyboardTools, showFirstDoubt }
}
