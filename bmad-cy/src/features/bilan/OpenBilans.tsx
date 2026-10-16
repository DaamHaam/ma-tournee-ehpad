import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../storage/database'
import { openBilans, shortName, type BilanKind } from '../../domain/model'
import { editPath, KIND_LABEL } from './display'

const TAG: Record<BilanKind, string> = { bilan: 'B', tinetti: 'T', marcheEquilibre: 'M/É', mesures: 'Tests' }

// Bande discrète des bilans en cours du jour (plusieurs patients en séance en même temps) : elle apparaît d’elle-même
// dès qu’un autre bilan est en cours ; un toucher y passe directement. Un bilan en sort une fois copié.
// Une dictée en cours est arrêtée et part dans le bilan qu’on quitte.
export function OpenBilansStrip({ date, id, kind, beforeLeave }: { date: string; id: string; kind: BilanKind; beforeLeave: () => Promise<void> }) {
  const navigate = useNavigate()
  const location = useLocation()
  const day = useLiveQuery(() => db.days.get(date), [date])
  const [leaving, setLeaving] = useState(false)
  if (!day) return null
  const items = openBilans(day)
  const current = (item: { id: string; kind: BilanKind }) => item.id === id && item.kind === kind
  if (!items.some(item => !current(item))) return null
  const go = async (target: { id: string; kind: BilanKind }) => {
    if (current(target) || leaving) return
    setLeaving(true)
    try { await beforeLeave() } finally { navigate(editPath(target.kind, date, target.id), { replace: true, state: location.state }) }
  }
  return <nav className="open-bilans" aria-label="Bilans en cours">
    {items.map(item => <button key={`${item.id}:${item.kind}`} type="button" aria-current={current(item) ? 'page' : undefined} aria-label={`${shortName(item.patient)}, ${KIND_LABEL[item.kind]}`} disabled={leaving} onClick={() => void go(item)}>
      <span className="open-name">{shortName(item.patient)}</span><span className="open-kind">{TAG[item.kind]}</span>
    </button>)}
  </nav>
}
