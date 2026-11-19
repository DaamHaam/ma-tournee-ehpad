// Timed Up and Go par étapes (catalogue de l’organisateur : comportement `chronometre_etapes`) : on touche « Étape suivante »
// à la fin de chaque étape ; 5 durées et le total, à la seconde entière (troncature, jamais de dixièmes ni d’arrondi au
// plus proche), dans l’ordre de NetSoin. Le total est la valeur du TUG (historique des mesures).
export const TUG_STEPS = [
  { key: 'assis_debout', label: 'Assis → debout' },
  { key: 'aller', label: 'Marche aller (3 m)' },
  { key: 'demi_tour', label: 'Demi-tour' },
  { key: 'retour', label: 'Marche retour' },
  { key: 'debout_assis', label: 'Debout → assis' },
] as const
// Clé des étapes à côté de `tug` dans un test (test rapide, TUG du Tinetti) : durées séparées par « ; ».
export const TUG_STEPS_KEY = 'tug.etapes'
export interface TugSteps { steps: number[]; total: number }

// marks : instants (ms, depuis le départ) de chaque toucher, le dernier terminant l’épreuve.
export function tugStepsFromMarks(marks: number[]): TugSteps {
  const steps = marks.map((mark, index) => Math.floor(mark / 1000) - Math.floor((index ? marks[index - 1] : 0) / 1000))
  return { steps, total: Math.floor((marks.at(-1) ?? 0) / 1000) }
}
export const encodeTugSteps = (steps: number[]) => steps.join(';')
export function parseTugSteps(values: Record<string, string> | undefined): TugSteps | null {
  const raw = values?.[TUG_STEPS_KEY]
  const steps = raw ? raw.split(';').map(Number) : []
  if (steps.length !== TUG_STEPS.length || steps.some(value => !Number.isFinite(value))) return null
  const total = Number((values?.tug ?? '').replace(',', '.'))
  return { steps, total: Number.isFinite(total) && values?.tug ? Math.floor(total) : steps.reduce((sum, value) => sum + value, 0) }
}
// Étapes rangées dans les repères du bilan (questions du catalogue `transferts.tug.<étape>`).
export function tugStepsFromForm(values: Record<string, string>): TugSteps | null {
  const steps = TUG_STEPS.map(step => Number(values[`transferts.tug.${step.key}`]))
  if (steps.some(value => !Number.isFinite(value)) || TUG_STEPS.some(step => !values[`transferts.tug.${step.key}`])) return null
  const total = Number((values['transferts.tug.temps'] ?? '').replace(',', '.'))
  return { steps, total: Number.isFinite(total) && values['transferts.tug.temps'] ? Math.floor(total) : steps.reduce((sum, value) => sum + value, 0) }
}
