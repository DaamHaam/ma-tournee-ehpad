import { lastNs, nsLate } from '../../domain/suiviNs'
import { parseDate } from '../../domain/model'

// Petit sigle « NS » : vert si un test NS a été recopié dans NetSoin depuis moins de 3 mois, orange sinon (ou jamais).
export function NsMark({ patient, today }: { patient?: { nsDates?: string[] }; today: string }) {
  if (!patient) return null
  const last = lastNs(patient)
  const late = nsLate(patient, today)
  const label = last ? `Dernier test NS le ${parseDate(last).toLocaleDateString('fr-FR')}` : 'Jamais de test NS'
  return <span className={`ns-mark${late ? ' late' : ''}`} title={label}><span aria-hidden="true">NS</span><span className="sr-only"> ({label})</span></span>
}
