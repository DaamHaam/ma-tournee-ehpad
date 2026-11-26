import { effectivePrescriptionEnd, prescriptionStatus, prescriptionText, type PatientCare } from '../../domain/model'

type Care = Pick<PatientCare, 'prescriptionDate' | 'prescriptionDuration' | 'prescriptionUnit' | 'prescriptionEnd'>
// Petit sigle « Ordo » après le nom : orange quand il reste moins d’un mois, rouge une fois dépassée ; rien sinon (pas de
// jaune ici, pour ne pas surcharger la liste et la journée : le jaune, à moins de 3 mois, n’est que dans le tableau).
export function PrescriptionMark({ patient, today }: { patient?: Care; today: string }) {
  if (!patient) return null
  const status = prescriptionStatus(effectivePrescriptionEnd(patient), today)
  if (status.level !== 'soon' && status.level !== 'over') return null
  const text = `Ordonnance : ${prescriptionText(status).toLocaleLowerCase('fr')}`
  return <span className={`prescription-mark ${status.level}`} title={text}><span aria-hidden="true">Ordo</span><span className="sr-only"> ({text})</span></span>
}
