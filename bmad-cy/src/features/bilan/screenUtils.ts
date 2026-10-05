import { useEffect, useState } from 'react'

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
}

// Retour vers la page d’origine (journée par défaut, onglet Bilans si on en vient).
export function backTarget(state: unknown, date: string) {
  const from = (state as { from?: unknown } | null)?.from
  const back = typeof from === 'string' && from.startsWith('/') ? from : `/?date=${date}`
  return { back, label: back.startsWith('/bilans') ? 'Retour aux bilans' : 'Retour à la journée' }
}
