import { Link } from 'react-router-dom'
import { fullName, type Patient } from '../../domain/model'
import { billingTotals, coverageOptions, ifdLabel, letterOptions, tableEnd, tablePatients } from '../../domain/tableau'
import { useSave } from '../../app/SaveContext'
import { useToday } from '../../app/useToday'
import { repository } from '../../storage/repository'
import { WaitingLabel, WaitingMark } from './WaitingMark'

export const TABLE_PATH = '/patients?vue=tableau'
type Flag = 'pointed' | 'billed'
const FLAG_LABELS: Record<Flag, string> = { pointed: 'Pointé', billed: 'Facturé' }

// Tableau de la prise en charge administrative : patients actifs (pause comprise), par ordre alphabétique.
// Pointé et Facturé se cochent d’un toucher ; Couverture, Séances et IFD se choisissent dans un menu ; le nom ouvre la fiche.
export function PatientTable({ patients }: { patients: Patient[] }) {
  const { run } = useSave()
  const today = useToday()
  const rows = tablePatients(patients)
  const update = (id: string, patch: Parameters<typeof repository.updatePatient>[1]) => void run(() => repository.updatePatient(id, patch))
  const reset = (field: Flag) => {
    if (window.confirm(`Décocher « ${FLAG_LABELS[field]} » pour tous les patients du tableau ?`)) void run(() => repository.resetPatientFlag(field))
  }
  if (!rows.length) return <div className="empty-state"><h2>Aucun patient</h2></div>
  const flag = (patient: Patient, field: Flag) => <td className="table-check"><label><input type="checkbox" aria-label={`${FLAG_LABELS[field]} ${fullName(patient)}`} checked={patient[field]} onChange={event => update(patient.id, { [field]: event.target.checked })} /></label></td>
  const menu = (patient: Patient, field: 'coverage' | 'days' | 'ifd', label: string, empty: string, options: string[]) => <td className="table-menu">
    <select aria-label={`${label} ${fullName(patient)}`} value={patient[field]} onChange={event => update(patient.id, { [field]: event.target.value })}>
      <option value="">{empty}</option>
      {options.map(option => <option key={option}>{option}</option>)}
    </select>
  </td>
  return <>
    <div className="patient-table-wrap">
      <table className="patient-table">
        <thead><tr><th scope="col" className="table-name">Patient</th><th scope="col">Couverture</th><th scope="col">Séances</th><th scope="col">Pointé</th><th scope="col">Facturé</th><th scope="col">Fact. IFD</th><th scope="col">Fin d’ordo</th><th scope="col">Médecin</th></tr></thead>
        <tbody>{rows.map(patient => {
          const end = tableEnd(patient, today)
          return <tr key={patient.id} className={patient.paused ? 'paused' : undefined}>
            <th scope="row" className="table-name"><Link to={`/patients/${patient.id}`} state={{ from: TABLE_PATH }}><WaitingMark waiting={patient.waiting} /><span className="table-last">{patient.lastName}</span> <span className="table-first">{patient.firstName}</span><WaitingLabel waiting={patient.waiting} /></Link></th>
            {menu(patient, 'coverage', 'Couverture', '—', coverageOptions(patient.coverage))}
            {menu(patient, 'days', 'Séances', '—', letterOptions(patient.days))}
            {flag(patient, 'pointed')}
            {flag(patient, 'billed')}
            {menu(patient, 'ifd', 'Fact. IFD', ifdLabel(''), letterOptions(patient.ifd))}
            <td className={`table-end ${end.level}`}>{end.text}</td>
            <td className="table-doctor">{patient.doctor || '—'}</td>
          </tr>
        })}</tbody>
      </table>
    </div>
    <p className="table-total subtle">{billingTotals(rows)}</p>
    <div className="table-resets">
      <button type="button" onClick={() => reset('pointed')}>Remettre Pointé à zéro</button>
      <button type="button" onClick={() => reset('billed')}>Remettre Facturé à zéro</button>
    </div>
  </>
}
