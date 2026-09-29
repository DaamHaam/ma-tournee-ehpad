import { moodSigns, parseDate, type Day, type Entry } from '../../domain/model'
function compact(text: string): string { return text.trim().replace(/\s+/g, ' ').replace(/[()]/g, '') }
// Un nom composé n'exporte que son premier mot, pour garder un séparateur espace entre patients.
function firstWord(text: string): string { return compact(text).split(' ')[0].toLocaleLowerCase('fr') }
function exportName(entry: Entry, entries: Entry[]): string {
  const lastName = firstWord(entry.patient.lastName)
  const firstName = firstWord(entry.patient.firstName)
  const homonyms = entries.filter(other => firstWord(other.patient.lastName) === lastName)
  const cased = entry.session === 'B' ? lastName : lastName.charAt(0).toLocaleUpperCase('fr') + lastName.slice(1)
  if (homonyms.length < 2) return cased
  // Homonymes : « Nom P. » ; prénom complet si l'initiale ne suffit pas ; identifiant en dernier recours.
  const capital = (word: string) => word.charAt(0).toLocaleUpperCase('fr') + word.slice(1)
  const initial = (other: Entry) => firstWord(other.patient.firstName).charAt(0)
  if (!firstName && homonyms.filter(other => !initial(other)).length === 1) return cased
  if (firstName && homonyms.filter(other => initial(other) === firstName.charAt(0)).length === 1) return `${cased} ${firstName.charAt(0).toLocaleUpperCase('fr')}.`
  if (firstName && homonyms.filter(other => firstWord(other.patient.firstName) === firstName).length === 1) return `${cased} ${capital(firstName)}`
  return `${cased}_${entry.patient.id.slice(0, 6)}`
}
// Seuls la séance et la note entrent dans le TXT ; le bilan reste dans l'application.
function exported(entry: Entry): boolean { return entry.session !== null || entry.note.trim() !== '' }
export function exportTxt(days: Day[]): string {
  return [...days].sort((a, b) => a.date.localeCompare(b.date)).filter(day => Object.values(day.entries).some(exported) || day.mood !== null || day.comment.trim()).map(day => {
    const entries = day.order.flatMap(id => day.entries[id] ? [day.entries[id]] : [])
    const format = (entry: Entry) => `${exportName(entry, entries)}${entry.note.trim() ? ` (${compact(entry.note)})` : ''}`
    const seen = entries.filter(entry => entry.session !== null).map(format).join(' ')
    const unseen = entries.filter(entry => entry.session === null && entry.note.trim()).map(format).join(' ')
    const mood = [moodSigns(day.mood), compact(day.comment)].filter(Boolean).join(' ')
    return [parseDate(day.date).toLocaleDateString('fr-FR'), mood, seen, unseen ? `Pas vus : ${unseen}` : ''].filter(Boolean).join('\n')
  }).join('\n\n')
}
