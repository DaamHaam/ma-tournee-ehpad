import { useCallback, useEffect, useState } from 'react'
import { HashRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { repository } from './storage/repository'
import { SaveContext } from './app/SaveContext'
import { Journee } from './features/journee/Journee'
import { Patients, PatientDetail } from './features/patients/Patients'
import { ExportPage } from './features/exports/ExportPage'
function Icon({ d }: { d: string }) { return <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg> }
function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const run = useCallback((operation: () => Promise<unknown>) => Promise.resolve().then(operation).then(
    () => { setError(''); return true },
    (cause: unknown) => { setError(cause instanceof Error ? cause.message : 'Vos dernières modifications ne sont pas enregistrées.'); return false },
  ), [])
  useEffect(() => { void run(() => repository.initialize()).then(ok => { if (ok) setReady(true) }) }, [run])
  return <HashRouter><SaveContext value={{ run }}>
    {error && <div className="error-banner" role="alert"><strong>Échec de l’enregistrement.</strong> {error}{!ready && <p><button onClick={() => void run(() => repository.initialize()).then(ok => setReady(ok))}>Réessayer</button></p>}</div>}
    <main>{ready && <Routes><Route path="/" element={<Journee />} /><Route path="/patients" element={<Patients />} /><Route path="/patients/:id" element={<PatientDetail />} /><Route path="/settings" element={<ExportPage />} /><Route path="/export" element={<Navigate replace to="/settings" />} /><Route path="*" element={<Navigate replace to="/" />} /></Routes>}</main>
    <nav className="bottom-nav" aria-label="Navigation principale"><NavLink to="/" end aria-label="Journée" title="Journée"><Icon d="M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /></NavLink><NavLink to="/patients" aria-label="Patients" title="Patients"><Icon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" /></NavLink><NavLink to="/settings" aria-label="Réglages / Export" title="Réglages / Export"><Icon d="M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6" /></NavLink></nav>
  </SaveContext></HashRouter>
}
export default App
