import type { BilanKind } from '../../domain/model'
import { tinettiResultHtml, type TestRecord } from '../../domain/tinetti'
import { bilanHtml, sanitizeBilanHtml, textToHtml } from './richText'

export const KIND_LABEL: Record<BilanKind, string> = { bilan: 'Bilan', tinetti: 'Tinetti' }
// Texte dicté d’un test, filtré comme un bilan.
export function testNotesHtml(record: Pick<TestRecord, 'notes' | 'notesHtml'>): string { return sanitizeBilanHtml(record.notesHtml ?? textToHtml(record.notes)) }
// Texte d’un test prêt à copier : texte retouché s’il existe, sinon score calculé + observations de l’IA
// (tant que la dictée n’a pas changé depuis la synthèse), sinon score + dictée brute.
export function testCopyHtml(record: Pick<TestRecord, 'scores' | 'notes' | 'notesHtml' | 'resultHtml' | 'aiObservations' | 'aiSource'>): string {
  if (record.resultHtml) return sanitizeBilanHtml(record.resultHtml)
  const fresh = record.aiObservations !== undefined && record.aiSource === record.notes
  return tinettiResultHtml(record, fresh ? sanitizeBilanHtml(record.aiObservations!) : testNotesHtml(record))
}
// HTML affiché et copié pour un bilan libre ou un test.
export function itemHtml(item: { kind: BilanKind; text: string; html?: string; record?: TestRecord }): string {
  if (item.kind === 'bilan' || !item.record) return bilanHtml({ bilan: item.text, bilanHtml: item.html })
  return testCopyHtml(item.record)
}
export function editPath(kind: BilanKind, date: string, id: string): string { return `/${kind === 'bilan' ? 'bilan' : kind}/${date}/${id}` }
