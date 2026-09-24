import { hasTrace, moodSigns, parseDate, type Day, type Entry } from '../../domain/model'
function compact(text: string): string { return text.trim().replace(/\s+/g, ' ').replace(/[()]/g, '') }
function exportName(entry: Entry, entries: Entry[]): string {
  const lastName = compact(entry.patient.lastName).toLocaleLowerCase('fr')
  const homonyms = entries.filter(other => compact(other.patient.lastName).toLocaleLowerCase('fr') === lastName)
  let name = lastName
  if (homonyms.length > 1) {
    name += `_${compact(entry.patient.firstName).toLocaleLowerCase('fr')}`
    if (homonyms.filter(other => other.patient.firstName.toLocaleLowerCase('fr') === entry.patient.firstName.toLocaleLowerCase('fr')).length > 1) name += `_${entry.patient.room ? compact(entry.patient.room) + '_' : ''}${entry.patient.id.slice(0, 6)}`
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
