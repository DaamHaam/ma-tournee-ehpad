import type { BilanKind, DayBilan, Identity } from '../../domain/model'
import { tinettiResultHtml, type TestRecord, type TestType } from '../../domain/tinetti'
import { marcheEquilibreHtml } from '../../domain/marcheEquilibre'
import { bilanHtml, htmlToText, sanitizeBilanHtml, textToHtml } from './richText'

export const KIND_LABEL: Record<BilanKind, string> = { bilan: 'Bilan', tinetti: 'Tinetti', marcheEquilibre: 'Marche / équilibre' }
// Étiquette courte de la liste des bilans, pour laisser la place au nom.
export const KIND_SHORT: Record<BilanKind, string> = { ...KIND_LABEL, marcheEquilibre: 'Marche/éq.' }
// Texte dicté d’un test, filtré comme un bilan.
export function testNotesHtml(record: Pick<TestRecord, 'notes' | 'notesHtml'>): string { return sanitizeBilanHtml(record.notesHtml ?? textToHtml(record.notes)) }
// Texte d’un test prêt à copier : texte retouché s’il existe ; pour le Tinetti, sinon score calculé + observations de l’IA
// (tant que la dictée n’a pas changé depuis la synthèse), sinon score + dictée brute ; pour le bilan marche / équilibre, compte rendu généré.
export function testCopyHtml(record: Pick<TestRecord, 'scores' | 'notes' | 'notesHtml' | 'resultHtml' | 'aiObservations' | 'aiSource' | 'choices' | 'values'>, kind: TestType = 'tinetti'): string {
  if (record.resultHtml) return sanitizeBilanHtml(record.resultHtml)
  if (kind === 'marcheEquilibre') return marcheEquilibreHtml(record)
  const fresh = record.aiObservations !== undefined && record.aiSource === record.notes
  return tinettiResultHtml(record, fresh ? sanitizeBilanHtml(record.aiObservations!) : testNotesHtml(record))
}
// HTML affiché et copié pour un bilan libre ou un test.
export function itemHtml(item: { kind: BilanKind; text: string; html?: string; record?: TestRecord }): string {
  if (item.kind === 'bilan' || !item.record) return bilanHtml({ bilan: item.text, bilanHtml: item.html })
  return testCopyHtml(item.record, item.kind)
}
// Contenu copié : le bilan marche / équilibre garde la présentation de l’application d’origine
// (police à chasse fixe, fins de ligne CRLF) ; les autres bilans sont copiés tels quels.
export function clipboardContent(kind: BilanKind, html: string): { html: string; text: string } {
  const text = htmlToText(html)
  if (kind !== 'marcheEquilibre') return { html, text }
  return { html: `<div style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;white-space:pre-wrap;">${html}</div>`, text: text.replace(/\n/g, '\r\n') }
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

// Marques de marge du Résultat (✨ ligne complétée par l’IA, ⚠ à vérifier) : une classe sur la ligne, dessinée en CSS,
// jamais dans le texte enregistré ni copié (le filtre du bilan retire ces balises).
export function markLine(html: string, ai: boolean, doubt = false): string { return ai || doubt ? `<span class="ai-line${doubt ? ' doubt' : ''}">${html}</span>` : html }
export function markLines(lines: { rubrics: string[]; html: string }[], ai: Set<string | undefined>, doubt: Set<string>): string {
  return lines.map(line => markLine(line.html, line.rubrics.some(rubric => ai.has(rubric)), line.rubrics.some(rubric => doubt.has(rubric)))).join('<br>')
}
