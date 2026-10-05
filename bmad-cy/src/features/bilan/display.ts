import type { BilanKind } from '../../domain/model'
import { tinettiResultHtml, type TestRecord } from '../../domain/tinetti'
import { bilanHtml, sanitizeBilanHtml, textToHtml } from './richText'

export const KIND_LABEL: Record<BilanKind, string> = { bilan: 'Bilan', tinetti: 'Tinetti' }
// Texte dicté d’un test, filtré comme un bilan.
export function testNotesHtml(record: Pick<TestRecord, 'notes' | 'notesHtml'>): string { return sanitizeBilanHtml(record.notesHtml ?? textToHtml(record.notes)) }
// HTML affiché et copié pour un bilan libre ou un test.
export function itemHtml(item: { kind: BilanKind; text: string; html?: string; record?: TestRecord }): string {
  if (item.kind === 'bilan' || !item.record) return bilanHtml({ bilan: item.text, bilanHtml: item.html })
  return tinettiResultHtml(item.record, testNotesHtml(item.record))
}
export function editPath(kind: BilanKind, date: string, id: string): string { return `/${kind === 'bilan' ? 'bilan' : kind}/${date}/${id}` }
