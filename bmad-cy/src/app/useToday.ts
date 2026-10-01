import { useEffect, useState } from 'react'
import { localDate } from '../domain/model'
// Date locale du jour, tenue à jour quand l’application reste ouverte après minuit ou revient au premier plan.
export function useToday(): string {
  const [today, setToday] = useState(localDate)
  useEffect(() => {
    const refresh = () => setToday(localDate())
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh) }
  }, [])
  return today
}
