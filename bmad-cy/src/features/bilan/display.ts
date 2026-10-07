import type { BilanKind, DayBilan, Identity } from '../../domain/model'
import { tinettiResultHtml, type TestRecord } from '../../domain/tinetti'
import { bilanHtml, htmlToText, sanitizeBilanHtml, textToHtml } from './richText'

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
// Patients ayant au moins deux bilans ou tests ce jour-là, dans l’ordre d’affichage (première apparition), chacun avec ses bilans dans ce même ordre.
// Générique : tout nouveau type de bilan listé par dayBilans y entre sans changement.
export interface BilanGroup { id: string; patient: Identity; items: DayBilan[] }
export function multiBilanGroups(bilans: DayBilan[]): BilanGroup[] {
  const groups = new Map<string, BilanGroup>()
  for (const bilan of bilans) {
    const group = groups.get(bilan.id) ?? { id: bilan.id, patient: bilan.patient, items: [] }
    group.items.push(bilan)
    groups.set(bilan.id, group)
  }
  return [...groups.values()].filter(group => group.items.length >= 2)
}
// Bilans mis bout à bout, séparés par une ligne vide, en HTML (mise en forme gardée) et en texte brut.
export function joinBilans(htmls: string[]): { html: string; text: string } {
  const pieces = htmls.map(html => sanitizeBilanHtml(html)).filter(html => htmlToText(html).trim())
  return { html: pieces.join('<br><br>'), text: pieces.map(html => htmlToText(html)).join('\n\n') }
}
