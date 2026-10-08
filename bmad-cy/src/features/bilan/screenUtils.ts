import { useEffect, useRef, useState } from 'react'

// Zone réellement visible : sur iPhone, le clavier ouvert la réduit sans redimensionner la page.
export function useVisibleViewport() {
  const [box, setBox] = useState<{ height: number; top: number } | null>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setBox({ height: viewport.height, top: viewport.offsetTop })
    update()
    viewport.addEventListener('resize', update); viewport.addEventListener('scroll', update)
    return () => { viewport.removeEventListener('resize', update); viewport.removeEventListener('scroll', update) }
  }, [])
  return box
}

export const ICONS = {
  back: 'M15 5l-7 7 7 7',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  close: 'M6 6l12 12M18 6L6 18',
  newline: 'M19 5v7a3 3 0 0 1-3 3H6M10 11l-4 4 4 4',
  keyboard: 'M4.5 6h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9',
  hide: 'M6 9l6 6 6-6',
  erase: 'M21 5H9l-6 7 6 7h12zM12 9l6 6M18 9l-6 6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
}

// Retour vers la page d’origine (journée par défaut, onglet Bilans si on en vient).
export function backTarget(state: unknown, date: string) {
  const from = (state as { from?: unknown } | null)?.from
  const back = typeof from === 'string' && from.startsWith('/') ? from : `/?date=${date}`
  return { back, label: back.startsWith('/bilans') ? 'Retour aux bilans' : 'Retour à la journée' }
}

// Dans un bilan, le glissement depuis le bord de l’écran (retour arrière de Safari) ne doit pas quitter la page par mégarde.
const EDGE = 20
export function useBlockEdgeSwipe() {
  useEffect(() => {
    const block = (event: TouchEvent) => {
      const x = event.touches[0]?.clientX
      if (x !== undefined && (x < EDGE || x > window.innerWidth - EDGE)) event.preventDefault()
    }
    const root = document.documentElement
    const previous = root.style.overscrollBehaviorX
    root.style.overscrollBehaviorX = 'none'
    document.addEventListener('touchstart', block, { passive: false })
    return () => { document.removeEventListener('touchstart', block); root.style.overscrollBehaviorX = previous }
  }, [])
}

// Clavier rentré par iOS sans passer par la flèche (lancement du micro, demande d’autorisation…) : l’écran revient au mode dictée
// au lieu de garder la barre du clavier sans clavier.
export function useKeyboardLost(active: boolean, onLost: () => void) {
  const lost = useRef(onLost)
  useEffect(() => { lost.current = onLost })
  useEffect(() => {
    if (!active) return
    let timer: number | undefined
    const check = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const editing = (document.activeElement as HTMLElement | null)?.isContentEditable
        const viewport = window.visualViewport
        if (!editing || (viewport && window.innerHeight - viewport.height < 120)) lost.current()
      }, 700)
    }
    const viewport = window.visualViewport
    document.addEventListener('focusout', check)
    viewport?.addEventListener('resize', check)
    return () => { window.clearTimeout(timer); document.removeEventListener('focusout', check); viewport?.removeEventListener('resize', check) }
  }, [active])
}
