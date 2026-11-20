import { Navigate, useLocation, useParams } from 'react-router-dom'

// Anciens écrans (Tinetti, bilan marche / équilibre, tests rapides) retirés : tout se fait dans le bilan libre du jour.
// Une ancienne adresse y mène, sur le test demandé s’il y en a un.
export function LegacyBilan() {
  const { date = '', id = '' } = useParams()
  const { search, state, pathname } = useLocation()
  const test = new URLSearchParams(search).get('test') ?? (pathname.startsWith('/tinetti/') ? 'tinetti' : '')
  return <Navigate replace to={`/bilan/${date}/${id}${test ? `?test=${test}` : ''}`} state={state} />
}
