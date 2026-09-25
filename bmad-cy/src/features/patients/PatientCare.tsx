import { COVERAGES, localDate, parseDate, toggleLetter, WEEKDAY_LETTERS, type Patient } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
import { repository } from '../../storage/repository'

type TextField = 'doctor' | 'rating'
function shortDate(date: string) { return parseDate(date).toLocaleDateString('fr-FR') }

export function PatientCare({ patient }: { patient: Patient }) {
  const { run } = useSave()
  const today = localDate()
  const update = (patch: Parameters<typeof repository.updatePatient>[1]) => void run(() => repository.updatePatient(patient.id, patch))
  const saveText = async (field: TextField, input: HTMLInputElement) => {
    const value = input.value.trim()
    if (value === patient[field]) return
    if (!await run(() => repository.updatePatient(patient.id, { [field]: value }))) input.value = patient[field]
  }
  const letters = (field: 'days' | 'ifd', label: string) => <fieldset className="letter-field"><legend>{label}</legend><div className="letter-buttons">{WEEKDAY_LETTERS.map(letter => <button key={letter} type="button" aria-label={`${label} ${letter}`} aria-pressed={patient[field].includes(letter)} onClick={() => update({ [field]: toggleLetter(patient[field], letter) })}>{letter}</button>)}</div></fieldset>
  const followUp = (kind: 'evalDates' | 'transDates', label: string) => {
    const last = patient[kind].at(-1)
    return <label className="check-field"><input type="checkbox" checked={patient[kind].includes(today)} onChange={() => void run(() => repository.toggleFollowUp(patient.id, kind, today))} />{label}{last && last !== today && <span className="subtle">{shortDate(last)}</span>}</label>
  }
  const flag = (field: 'pointed' | 'billed', label: string) => <label className="check-field"><input type="checkbox" checked={patient[field]} onChange={event => update({ [field]: event.target.checked })} />{label}</label>

  return <section className="card care">
    <div className="check-row">{followUp('evalDates', 'Éval')}{followUp('transDates', 'Trans')}{flag('pointed', 'Pointé')}{flag('billed', 'Facturé')}</div>
    <div className="form-grid">
      <label>Couverture <select value={patient.coverage} onChange={event => update({ coverage: event.target.value })}><option value="">—</option>{[...COVERAGES, ...(patient.coverage && !COVERAGES.includes(patient.coverage) ? [patient.coverage] : [])].map(option => <option key={option}>{option}</option>)}</select></label>
      <label>Fin d’ordonnance <input type="date" value={patient.prescriptionEnd} onChange={event => update({ prescriptionEnd: event.target.value })} /></label>
      {letters('days', 'Séances')}
      {letters('ifd', 'Fact. IFD')}
      <label>Médecin traitant <input key={`doctor-${patient.doctor}`} autoComplete="off" defaultValue={patient.doctor} onBlur={event => void saveText('doctor', event.currentTarget)} /></label>
      <label>Cotation <input key={`rating-${patient.rating}`} autoComplete="off" defaultValue={patient.rating} onBlur={event => void saveText('rating', event.currentTarget)} /></label>
    </div>
  </section>
}
