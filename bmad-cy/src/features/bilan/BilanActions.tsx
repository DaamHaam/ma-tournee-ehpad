import { useSave } from '../../app/SaveContext'
import { repository } from '../../storage/repository'
import { parseDate, type BilanKind } from '../../domain/model'
import { KIND_LABEL } from './display'
import { useBilanCopy } from './useBilanCopy'

const COPY = 'M9 9h10v11H9zM5 15V4h10'
const TRASH = 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6'
function Icon({ d }: { d: string }) { return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg> }

export function BilanActions({ date, id, name, html, kind = 'bilan' }: { date: string; id: string; name: string; html: string; kind?: BilanKind }) {
  const { run } = useSave()
  const { copied, copy } = useBilanCopy(date, id, kind)
  const what = kind === 'bilan' ? 'le bilan' : `le ${KIND_LABEL[kind]}`
  const remove = () => { if (window.confirm(`Supprimer ${what} du ${parseDate(date).toLocaleDateString('fr-FR')} de ${name} ?`)) void run(() => kind === 'bilan' ? repository.deleteBilan(date, id) : repository.deleteTest(date, id, kind)) }
  return <div className="bilan-actions">
    <button type="button" className={`icon-button${copied ? ' copied' : ''}`} aria-label={copied === null ? `Copier ${what} de ${name}` : copied ? 'Copié' : 'Copie impossible'} title="Copier" onClick={() => void copy(html)}>{copied ? <span aria-hidden="true">✓</span> : <Icon d={COPY} />}</button>
    <button type="button" className="icon-button danger" aria-label={`Supprimer ${what} de ${name}`} title="Supprimer" onClick={remove}><Icon d={TRASH} /></button>
  </div>
}
