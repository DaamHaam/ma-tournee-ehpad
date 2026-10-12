// Mise en forme du temps du chronomètre : affichage (dixièmes), champ nombre en secondes (virgule française) ou durée en texte.
export function chronoDisplay(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100)
  const minutes = Math.floor(tenths / 600), seconds = Math.floor((tenths % 600) / 10)
  return minutes ? `${minutes}:${String(seconds).padStart(2, '0')},${tenths % 10}` : `${seconds},${tenths % 10} s`
}
// Compte à rebours : secondes restantes, arrondies au-dessus (30 s pile au départ, 0 à la fin).
export function countdownDisplay(ms: number): string {
  const left = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(left / 60)
  return minutes ? `${minutes}:${String(left % 60).padStart(2, '0')}` : `${left} s`
}
export function secondsValue(ms: number): string { return String(Math.round(ms / 100) / 10).replace('.', ',') }
export function durationText(ms: number): string {
  const total = Math.round(ms / 1000)
  const minutes = Math.floor(total / 60), seconds = total % 60
  return minutes ? `${minutes} min${seconds ? ` ${seconds} s` : ''}` : `${seconds} s`
}
