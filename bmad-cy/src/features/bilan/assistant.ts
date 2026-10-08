import type { Sex } from '../../domain/model'
import { TINETTI, validScore, type AiCheck } from '../../domain/tinetti'
import { choiceId, fieldOf, MARCHE_EQUILIBRE, rubricOfKey, type FlexInput } from '../../domain/marcheEquilibre'
import { sanitizeBilanHtml } from './richText'

const TINETTI_ROWS = new Set(TINETTI.flatMap(section => section.items.flatMap(item => item.rows.map(row => row.id))))

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
const PARTICLES = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'd', 'l', 'van', 'von', 'der', 'den', 'di', 'da', 'dos', 'del', 'el', 'al', 'ben', 'mac', 'mc', 'st', 'saint', 'sainte'])
export function anonymizeWithMap(text: string, names: string[]): { text: string; found: string[] } {
  const escape = (word: string) => plainLetters(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = names.map(name => name.split(/[\s'’-]+/).map(word => word.trim()).filter(Boolean))
  // Le nom complet (« Le Gall ») d’abord, puis chaque mot sauf les particules, qui sont aussi des mots courants (« le », « de »…).
  const phrases = parts.filter(words => words.length > 1).map(words => words.map(escape).join(`[\\s'’-]+`))
  const words = parts.flat().filter(word => word.length >= 2 && !PARTICLES.has(plainLetters(word).toLowerCase())).map(escape)
  const alternatives = [...new Set([...phrases, ...words])]
  if (!alternatives.length) return { text, found: [] }
  const plain = plainLetters(text)
  const found: string[] = []
  let result = ''
  let index = 0
  const pattern = new RegExp(`(?<![\\p{L}])(${alternatives.join('|')})(?![\\p{L}])`, 'giu')
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
  const reply = readJson(content) as { observations?: unknown; a_verifier?: unknown; cotations?: unknown }
  const proposed = reply.cotations && typeof reply.cotations === 'object' && !Array.isArray(reply.cotations) ? reply.cotations as Record<string, unknown> : {}
  const filled = Object.fromEntries(Object.entries(proposed).filter(([row, score]) => scores[row] === undefined && validScore(row, score))) as Record<string, number>
  const observations = typeof reply.observations === 'string' ? sanitizeBilanHtml(reply.observations.replace(/\n/g, '<br>')) : ''
  const checks = Array.isArray(reply.a_verifier) ? reply.a_verifier.flatMap(item => {
    const check = item as { ligne?: unknown; raison?: unknown }
    // Voyant sur une ligne de la grille, cotée ou non (consigne improbable laissée sans cotation).
    return typeof check.ligne === 'string' && TINETTI_ROWS.has(check.ligne) ? [{ row: check.ligne, reason: typeof check.raison === 'string' ? check.raison.trim() : '' }] : []
  }) : []
  return { observations, checks, scores: filled }
}

// Lecture tolérante du JSON de l’IA (éventuellement entouré de ```).
function readJson(content: string): Record<string, unknown> {
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  try {
    const data: unknown = JSON.parse(content.slice(start, end + 1))
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>
  } catch { /* message ci-dessous */ }
  throw new Error('Réponse de l’IA illisible. Réessayez.')
}

// Contenu envoyé pour le bilan marche / équilibre : formulaire (cochés en libellés, options libres avec leur identifiant)
// et dictée anonymisée, sans aucune identité.
export function marcheRequest(input: FlexInput, dictation: string, sex: Sex): string {
  const choices = new Set(input.choices ?? [])
  const values = input.values ?? {}
  const formulaire = MARCHE_EQUILIBRE.flatMap(module => module.rubrics.map(rubric => ({
    sous_module: module.title, rubrique: rubric.title,
    champs: rubric.controls.map(control => {
      const base = { id: control.key, ...(control.label ? { titre: control.label } : {}) }
      switch (control.kind) {
        case 'multi': {
          const options = control.options.map((label, index) => [choiceId(control.key, index), label] as const)
          return { ...base, type: 'choix multiples', coches: options.filter(([id]) => choices.has(id)).map(([, label]) => label), a_cocher: Object.fromEntries(options.filter(([id]) => !choices.has(id))) }
        }
        case 'single': return { ...base, type: 'choix unique', valeur: values[control.key] || null, options: control.options }
        case 'number': return { ...base, type: 'nombre', unite: control.unit, valeur: values[control.key] || null }
        case 'text': return { ...base, type: 'texte', valeur: values[control.key] ?? '' }
      }
    }),
  })))
  return JSON.stringify({ patient: sexLabel(sex), formulaire, dictee: dictation })
}

export interface FlexReply { choices: string[]; values: Record<string, string>; checks: AiCheck[] }
// L’IA ne coche que des options libres et ne remplit que des champs vides : rien de ce qu’a saisi le kinésithérapeute n’est remplacé.
// Voyants rattachés à leur rubrique ; un [patient] oublié dans un texte devient « le patient » ou « la patiente ».
export function parseMarcheReply(content: string, input: FlexInput, sex: Sex): FlexReply {
  const reply = readJson(content)
  const taken = new Set(input.choices ?? [])
  const person = sex === 'F' ? 'la patiente' : 'le patient'
  const choices = Array.isArray(reply.cocher) ? [...new Set(reply.cocher.filter((id): id is string => typeof id === 'string' && fieldOf(id)?.control.kind === 'multi' && !taken.has(id)))] : []
  const proposed = reply.valeurs && typeof reply.valeurs === 'object' && !Array.isArray(reply.valeurs) ? reply.valeurs as Record<string, unknown> : {}
  const values: Record<string, string> = {}
  for (const [key, raw] of Object.entries(proposed)) {
    const control = fieldOf(key)?.control
    if (!control || control.key !== key || control.kind === 'multi' || (input.values?.[key] ?? '').trim()) continue
    const text = (typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw : '').split(ANONYMOUS).join(person).trim()
    if (!text) continue
    if (control.kind === 'number' && !Number.isFinite(Number(text.replace(',', '.')))) continue
    if (control.kind === 'single' && !control.options.includes(text)) continue
    values[key] = text
  }
  const checks = Array.isArray(reply.a_verifier) ? reply.a_verifier.flatMap(item => {
    const check = item as { champ?: unknown; raison?: unknown }
    const rubric = typeof check.champ === 'string' ? rubricOfKey(check.champ) : undefined
    return rubric ? [{ row: rubric.id, reason: typeof check.raison === 'string' ? check.raison.trim() : '' }] : []
  }) : []
  return { choices, values, checks }
}

// Texte corrigé renvoyé par l’IA : guillemets ou blocs de code retirés, puis filtré comme un bilan.
export function parseCorrection(content: string): string {
  const text = content.trim().replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim().replace(/^"([\s\S]*)"$/, '$1')
  return sanitizeBilanHtml(text.replace(/\n/g, '<br>'))
}
