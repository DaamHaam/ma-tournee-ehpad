import { hasTrace, moodSigns, parseDate, type Day, type Entry } from '../../domain/model'
function compact(text: string): string { return text.trim().replace(/\s+/g, ' ').replace(/[()]/g, '') }
// Un nom composé n'exporte que son premier mot, pour garder un séparateur espace entre patients.
function firstWord(text: string): string { return compact(text).split(' ')[0].toLocaleLowerCase('fr') }
function exportName(entry: Entry, entries: Entry[]): string {
  const lastName = firstWord(entry.patient.lastName)
  const firstName = firstWord(entry.patient.firstName)
  const homonyms = entries.filter(other => firstWord(other.patient.lastName) === lastName)
  let name = lastName
  if (homonyms.length > 1) {
    if (firstName) name += `_${firstName}`
    if (homonyms.filter(other => firstWord(other.patient.firstName) === firstName).length > 1) name += `_${entry.patient.room ? compact(entry.patient.room).replace(/ /g, '_') + '_' : ''}${entry.patient.id.slice(0, 6)}`
  }
  return entry.session === 'B' ? name : name.charAt(0).toLocaleUpperCase('fr') + name.slice(1)
}
export function exportTxt(days: Day[]): string {
  return [...days].sort((a, b) => a.date.localeCompare(b.date)).filter(day => Object.values(day.entries).some(hasTrace) || day.mood !== null || day.comment.trim()).map(day => {
    const entries = day.order.flatMap(id => day.entries[id] ? [day.entries[id]] : [])
    const format = (entry: Entry) => `${exportName(entry, entries)}${entry.note.trim() ? ` (${compact(entry.note)})` : ''}`
    const seen = entries.filter(entry => entry.session !== null).map(format).join(' ')
    const unseen = entries.filter(entry => entry.session === null && entry.note.trim()).map(format).join(' ')
    const mood = [moodSigns(day.mood), compact(day.comment)].filter(Boolean).join(' ')
    return [parseDate(day.date).toLocaleDateString('fr-FR'), mood, seen, unseen ? `Pas vus : ${unseen}` : ''].filter(Boolean).join('\n')
  }).join('\n\n')
}
