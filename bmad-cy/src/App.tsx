import { useCallback, useEffect, useState } from 'react'
import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { repository } from './storage/repository'
import { SaveContext } from './app/SaveContext'
import { Journee } from './features/journee/Journee'
import { Patients, PatientDetail } from './features/patients/Patients'
import { ExportPage } from './features/exports/ExportPage'
function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(0)
  const [offline, setOffline] = useState(!navigator.onLine)
  const run = useCallback(async (operation: () => Promise<unknown>) => {
    setPending(count => count + 1)
    try { await operation(); setError(''); return true }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Écriture locale impossible. Vos dernières modifications ne sont pas enregistrées.'); return false }
    finally { setPending(count => count - 1) }
  }, [])
  useEffect(() => { void run(() => repository.initialize()).then(ok => { if (ok) setReady(true) }) }, [run])
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return <HashRouter><SaveContext value={{ run }}>
    <header className="app-header"><div><strong>Ma tournée</strong><span className="subtle"> EHPAD</span></div><span className="save-state" role="status">{error ? 'Échec de sauvegarde' : pending ? 'Enregistrement…' : 'Enregistré sur cet appareil'}{offline && ' · Hors ligne'}</span></header>
    {error && <div className="error-banner" role="alert"><strong>Une action n’a pas abouti.</strong> {error}<p>La sauvegarde reste signalée en échec jusqu’à ce qu’une nouvelle tentative réussisse. Si le problème persiste, conservez vos dernières notes avant de recharger.</p>{!ready && <button onClick={() => void run(() => repository.initialize()).then(ok => setReady(ok))}>Réessayer le chargement</button>}</div>}
    <main>{!ready ? <p className="opening">Ouverture de votre tournée…</p> : <Routes><Route path="/" element={<Journee />} /><Route path="/patients" element={<Patients />} /><Route path="/patients/:id" element={<PatientDetail />} /><Route path="/settings" element={<ExportPage />} /><Route path="/export" element={<Navigate replace to="/settings" />} /><Route path="*" element={<Navigate replace to="/" />} /></Routes>}</main>
    <nav className="bottom-nav" aria-label="Navigation principale"><NavLink to="/" end><span aria-hidden="true">☷</span>Journée</NavLink><NavLink to="/patients"><span aria-hidden="true">♙</span>Patients</NavLink><NavLink to="/settings"><span aria-hidden="true">⇩</span>Réglages / Export</NavLink></nav>
  </SaveContext></HashRouter>
}
export default App
