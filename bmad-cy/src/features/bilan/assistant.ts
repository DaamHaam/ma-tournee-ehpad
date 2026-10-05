import type { Sex } from '../../domain/model'
import { TINETTI, validScore, type AiCheck } from '../../domain/tinetti'
import { sanitizeBilanHtml } from './richText'

export const ANALYSIS_MODEL_SETTING = 'analysisModel'
export const promptSetting = (kind: string) => `prompt.${kind}`
export const ANONYMOUS = '[patient]'

export function sexLabel(sex: Sex): string { return sex === 'F' ? 'patiente' : sex === 'H' ? 'patient' : 'patient(e)' }

const plainLetters = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '')
// Retire du texte le nom et le prénom du patient (sans tenir compte de la casse ni des accents) avant tout envoi.
export function anonymize(text: string, names: string[]): string { return anonymizeWithMap(text, names).text }
// Remet dans l’ordre les mots retirés, si l’IA a conservé autant de [patient] qu’envoyés.
export function restoreNames(text: string, found: string[]): string {
  const parts = text.split(ANONYMOUS)
  if (parts.length - 1 !== found.length) return text
  return parts.reduce((result, part, index) => result + (index ? found[index - 1] : '') + part, '')
}
export function anonymizeWithMap(text: string, names: string[]): { text: string; found: string[] } {
  const words = [...new Set(names.flatMap(name => name.split(/[\s'’-]+/)).map(word => word.trim()).filter(word => word.length >= 2))]
  if (!words.length) return { text, found: [] }
  const plain = plainLetters(text)
  const found: string[] = []
  let result = ''
  let index = 0
  const pattern = new RegExp(`(?<![\\p{L}])(${words.map(word => plainLetters(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}])`, 'giu')
  for (const match of plain.matchAll(pattern)) {
    result += text.slice(index, match.index) + ANONYMOUS
    found.push(text.slice(match.index, match.index! + match[0].length))
    index = match.index! + match[0].length
  }
  return { text: result + text.slice(index), found }
}

// Contenu envoyé pour la synthèse Tinetti : grille cochée et dictée anonymisée, sans aucune identité.
export function tinettiRequest(scores: Record<string, number>, dictation: string, sex: Sex): string {
  // Requête allégée (réponse plus rapide) : les options ne sont envoyées que pour les lignes à remplir ; une ligne cochée porte son libellé.
  const grille = TINETTI.flatMap(section => section.items.flatMap(item => item.rows.map(row => {
    const base = { ligne: row.id, partie: section.title, item: `${item.number}. ${item.title}${row.sub ? ` – ${row.sub}` : ''}` }
    const chosen = row.options.find(option => option.score === scores[row.id])
    return chosen ? { ...base, cotation: chosen.score, libelle: chosen.label } : { ...base, cotation: null, options: row.options.map(option => `${option.score} : ${option.label}`) }
  })))
  return JSON.stringify({ patient: sexLabel(sex), grille, dictee: dictation })
}

export interface TinettiReply { observations: string; checks: AiCheck[]; scores: Record<string, number> }
// Lecture tolérante de la réponse : JSON éventuellement entouré de ```, lignes inconnues ignorées.
// L’IA ne cote que les lignes laissées vides : une cotation choisie par le kinésithérapeute n’est jamais remplacée.
export function parseTinettiReply(content: string, scores: Record<string, number>): TinettiReply {
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  let data: unknown
  try { data = JSON.parse(content.slice(start, end + 1)) } catch { throw new Error('Réponse de l’IA illisible. Réessayez.') }
  const reply = data as { observations?: unknown; a_verifier?: unknown; cotations?: unknown }
  const proposed = reply.cotations && typeof reply.cotations === 'object' && !Array.isArray(reply.cotations) ? reply.cotations as Record<string, unknown> : {}
  const filled = Object.fromEntries(Object.entries(proposed).filter(([row, score]) => scores[row] === undefined && validScore(row, score))) as Record<string, number>
  const merged = { ...filled, ...scores }
  const observations = typeof reply.observations === 'string' ? sanitizeBilanHtml(reply.observations.replace(/\n/g, '<br>')) : ''
  const checks = Array.isArray(reply.a_verifier) ? reply.a_verifier.flatMap(item => {
    const check = item as { ligne?: unknown; raison?: unknown }
    return typeof check.ligne === 'string' && merged[check.ligne] !== undefined ? [{ row: check.ligne, reason: typeof check.raison === 'string' ? check.raison.trim() : '' }] : []
  }) : []
  return { observations, checks, scores: filled }
}

// Texte corrigé renvoyé par l’IA : guillemets ou blocs de code retirés, puis filtré comme un bilan.
export function parseCorrection(content: string): string {
  const text = content.trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim().replace(/^"([\s\S]*)"$/, '$1')
  return sanitizeBilanHtml(text.replace(/\n/g, '<br>'))
}
