import { COVERAGES, effectivePrescriptionEnd, parseDate, prescriptionEndDate, prescriptionStatus, prescriptionText, toggleLetter, WEEKDAY_LETTERS, type Patient } from '../../domain/model'
import { useSave } from '../../app/SaveContext'
import { useToday } from '../../app/useToday'
import { repository } from '../../storage/repository'

type TextField = 'doctor' | 'rating'
function shortDate(date: string) { return parseDate(date).toLocaleDateString('fr-FR') }

// Éval et Trans, mis en avant sous le nom : cocher marque le suivi du jour, la dernière date reste visible dessous.
export function FollowUps({ patient }: { patient: Patient }) {
  const { run } = useSave()
  const today = useToday()
  const followUp = (kind: 'evalDates' | 'transDates', label: string) => {
    const last = patient[kind].at(-1)
    return <label className="follow-up"><span className="follow-up-check"><input type="checkbox" checked={patient[kind].includes(today)} onChange={() => void run(() => repository.toggleFollowUp(patient.id, kind, today))} />{label}</span><span className="subtle">{!last ? '—' : last === today ? 'aujourd’hui' : shortDate(last)}</span></label>
  }
  return <div className="follow-ups">{followUp('evalDates', 'Éval')}{followUp('transDates', 'Trans')}</div>
}

// Prescription en cours : la fin se calcule dès que date et durée sont connues ; sinon elle reste saisissable à la main.
function Prescription({ patient, today }: { patient: Patient; today: string }) {
  const { run } = useSave()
  const update = (patch: Parameters<typeof repository.updatePatient>[1]) => void run(() => repository.updatePatient(patient.id, patch))
  const saveLabel = async (input: HTMLInputElement) => {
    const value = input.value.trim()
    if (value !== patient.prescriptionLabel && !await run(() => repository.updatePatient(patient.id, { prescriptionLabel: value }))) input.value = patient.prescriptionLabel
  }
  // Enregistrée à chaque saisie valide ; une valeur invalide est remplacée par la dernière enregistrée en quittant le champ.
  const duration = (input: HTMLInputElement) => { const value = input.value.trim() ? Number(input.value) : null; return value === null || (Number.isInteger(value) && value > 0) ? value : undefined }
  const saveDuration = (input: HTMLInputElement) => { const value = duration(input); if (value !== undefined && value !== patient.prescriptionDuration) update({ prescriptionDuration: value }) }
  const resetDuration = (input: HTMLInputElement) => { if (duration(input) === undefined) input.value = patient.prescriptionDuration === null ? '' : String(patient.prescriptionDuration) }
  const computed = prescriptionEndDate(patient.prescriptionDate, patient.prescriptionDuration, patient.prescriptionUnit) !== null
  const status = prescriptionStatus(effectivePrescriptionEnd(patient), today)
  return <div className="prescription">
    <label className="wide">Intitulé de la prescription <input key={`label-${patient.prescriptionLabel}`} autoComplete="off" defaultValue={patient.prescriptionLabel} onBlur={event => void saveLabel(event.currentTarget)} /></label>
    <label>Date de prescription <input type="date" value={patient.prescriptionDate} onChange={event => update({ prescriptionDate: event.target.value })} /></label>
    <fieldset className="duration-field"><legend>Durée</legend><div className="duration-inputs">
      <input type="number" inputMode="numeric" min={1} step={1} aria-label="Durée de la prescription" defaultValue={patient.prescriptionDuration ?? ''} onChange={event => saveDuration(event.currentTarget)} onBlur={event => resetDuration(event.currentTarget)} />
      <select aria-label="Unité de durée" value={patient.prescriptionUnit} onChange={event => update({ prescriptionUnit: event.target.value as Patient['prescriptionUnit'] })}><option value="weeks">semaines</option><option value="months">mois</option></select>
    </div></fieldset>
    <label>Fin d’ordonnance <input type="date" value={patient.prescriptionEnd} readOnly={computed} disabled={computed} onChange={event => update({ prescriptionEnd: event.target.value })} />{computed && <span className="subtle">calculée</span>}</label>
    {status.level !== 'none' && <p className={`prescription-status ${status.level}`} role="status">{prescriptionText(status)}</p>}
  </div>
}

export function PatientCare({ patient }: { patient: Patient }) {
  const { run } = useSave()
  const today = useToday()
  const update = (patch: Parameters<typeof repository.updatePatient>[1]) => void run(() => repository.updatePatient(patient.id, patch))
  const saveText = async (field: TextField, input: HTMLInputElement) => {
    const value = input.value.trim()
    if (value === patient[field]) return
    if (!await run(() => repository.updatePatient(patient.id, { [field]: value }))) input.value = patient[field]
  }
  const letters = (field: 'days' | 'ifd', label: string) => <fieldset className="letter-field"><legend>{label}</legend><div className="letter-buttons">{WEEKDAY_LETTERS.map(letter => <button key={letter} type="button" aria-label={`${label} ${letter}`} aria-pressed={patient[field].includes(letter)} onClick={() => update({ [field]: toggleLetter(patient[field], letter) })}>{letter}</button>)}</div></fieldset>
  const flag = (field: 'pointed' | 'billed' | 'group', label: string) => <label className="check-field"><input type="checkbox" checked={patient[field]} onChange={event => update({ [field]: event.target.checked })} />{label}</label>

  return <section className="card care">
    <label className="switch-field"><input type="checkbox" role="switch" checked={patient.waiting} onChange={event => update({ waiting: event.target.checked })} />Attend une séance</label>
    <div className="check-row">{flag('pointed', 'Pointé')}{flag('billed', 'Facturé')}{flag('group', 'GRP')}
      <fieldset className="sex-field"><legend className="sr-only">Sexe</legend>{(['F', 'H'] as const).map(sex => <button key={sex} type="button" aria-label={`Sexe ${sex}`} aria-pressed={patient.sex === sex} onClick={() => update({ sex: patient.sex === sex ? '' : sex })}>{sex}</button>)}</fieldset></div>
    <div className="form-grid">
      <label>Couverture <select value={patient.coverage} onChange={event => update({ coverage: event.target.value })}><option value="">—</option>{[...COVERAGES, ...(patient.coverage && !COVERAGES.includes(patient.coverage) ? [patient.coverage] : [])].map(option => <option key={option}>{option}</option>)}</select></label>
      {letters('days', 'Séances')}
      {letters('ifd', 'Fact. IFD')}
      <label>Médecin traitant <input key={`doctor-${patient.doctor}`} autoComplete="off" defaultValue={patient.doctor} onBlur={event => void saveText('doctor', event.currentTarget)} /></label>
      <label>Cotation <input key={`rating-${patient.rating}`} autoComplete="off" defaultValue={patient.rating} onBlur={event => void saveText('rating', event.currentTarget)} /></label>
    </div>
    <Prescription key={patient.id} patient={patient} today={today} />
  </section>
}
