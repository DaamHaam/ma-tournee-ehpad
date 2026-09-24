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
  const run = useCallback((operation: () => Promise<unknown>) => Promise.resolve().then(operation).then(
    () => { setError(''); return true },
    (cause: unknown) => { setError(cause instanceof Error ? cause.message : 'Vos dernières modifications ne sont pas enregistrées.'); return false },
  ), [])
  useEffect(() => { void run(() => repository.initialize()).then(ok => { if (ok) setReady(true) }) }, [run])
  return <HashRouter><SaveContext value={{ run }}>
    {error && <div className="error-banner" role="alert"><strong>Échec de l’enregistrement.</strong> {error}{!ready && <p><button onClick={() => void run(() => repository.initialize()).then(ok => setReady(ok))}>Réessayer</button></p>}</div>}
    <main>{ready && <Routes><Route path="/" element={<Journee />} /><Route path="/patients" element={<Patients />} /><Route path="/patients/:id" element={<PatientDetail />} /><Route path="/settings" element={<ExportPage />} /><Route path="/export" element={<Navigate replace to="/settings" />} /><Route path="*" element={<Navigate replace to="/" />} /></Routes>}</main>
    <nav className="bottom-nav" aria-label="Navigation principale"><NavLink to="/" end><span aria-hidden="true">☷</span>Journée</NavLink><NavLink to="/patients"><span aria-hidden="true">♙</span>Patients</NavLink><NavLink to="/settings"><span aria-hidden="true">⇩</span>Réglages / Export</NavLink></nav>
  </SaveContext></HashRouter>
}
export default App
