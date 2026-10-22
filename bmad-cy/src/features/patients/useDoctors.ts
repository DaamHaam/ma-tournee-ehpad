import { useLiveQuery } from 'dexie-react-hooks'
import type { Doctor } from '../../domain/model'
import { db } from '../../storage/database'

// Carnet des médecins, par ordre alphabétique.
export function useDoctors(): Doctor[] | undefined { return useLiveQuery(async () => (await db.doctors.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'fr')), []) }
