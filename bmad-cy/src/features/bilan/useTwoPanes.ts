import { useEffect, useRef, useState, type UIEvent } from 'react'

// Deux volets glissants : l’onglet suit le doigt, le volet actif change une fois le geste terminé.
export function useTwoPanes() {
  const panes = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState(0)
  const settle = useRef<number | undefined>(undefined)
  const goTo = (index: number) => { setTab(index); const box = panes.current; if (box) box.scrollTo({ left: index * box.clientWidth, behavior: 'smooth' }) }
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const box = event.currentTarget
    const near = Math.round(box.scrollLeft / Math.max(1, box.clientWidth))
    if (near !== tab) setTab(near)
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => { const left = near * box.clientWidth; if (Math.abs(box.scrollLeft - left) > 1) box.scrollTo({ left, behavior: 'smooth' }) }, 120)
  }
  useEffect(() => () => window.clearTimeout(settle.current), [])
  return { panes, tab, goTo, onScroll }
}

