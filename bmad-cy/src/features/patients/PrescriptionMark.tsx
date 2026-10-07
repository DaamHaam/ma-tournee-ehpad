import { effectivePrescriptionEnd, prescriptionStatus, prescriptionText, type PatientCare } from '../../domain/model'

type Care = Pick<PatientCare, 'prescriptionDate' | 'prescriptionDuration' | 'prescriptionUnit' | 'prescriptionEnd'>
// Pastille « Ordo » après le nom : orange quand la fin tombe dans les 15 jours, rouge une fois dépassée ; rien sinon.
export function PrescriptionMark({ patient, today }: { patient?: Care; today: string }) {
  if (!patient) return null
  const status = prescriptionStatus(effectivePrescriptionEnd(patient), today)
  if (status.level !== 'soon' && status.level !== 'over') return null
  const text = `Ordonnance : ${prescriptionText(status).toLocaleLowerCase('fr')}`
  return <span className={`prescription-mark ${status.level}`} title={text}><span aria-hidden="true">Ordo</span><span className="sr-only"> ({text})</span></span>
}
