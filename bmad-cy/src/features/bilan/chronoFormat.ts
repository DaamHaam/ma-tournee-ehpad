// Mise en forme du temps du chronomètre, toujours en secondes entières (jamais de dixièmes) : la durée est tronquée
// (18,9 s → 18 s), à l’affichage comme dans les champs et les résultats.
export function chronoDisplay(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  const minutes = Math.floor(total / 60)
  return minutes ? `${minutes}:${String(total % 60).padStart(2, '0')}` : `${total} s`
}
// Compte à rebours : secondes restantes, arrondies au-dessus (30 s pile au départ, 0 à la fin).
export function countdownDisplay(ms: number): string {
  const left = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(left / 60)
  return minutes ? `${minutes}:${String(left % 60).padStart(2, '0')}` : `${left} s`
}
export function secondsValue(ms: number): string { return String(Math.floor(Math.max(0, ms) / 1000)) }
export function durationText(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  const minutes = Math.floor(total / 60), seconds = total % 60
  return minutes ? `${minutes} min${seconds ? ` ${seconds} s` : ''}` : `${seconds} s`
}
// Au centième (SPPB : le barème en dépend) : valeur enregistrée au centième ; l’affichage s’en tient au dixième.
export function centiValue(ms: number): string { return (Math.floor(Math.max(0, ms) / 10) / 100).toFixed(2).replace('.', ',') }
export function tenthsDisplay(ms: number): string { return `${(Math.floor(Math.max(0, ms) / 100) / 10).toFixed(1).replace('.', ',')} s` }
