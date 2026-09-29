// Repli pour les navigateurs sans presse-papiers asynchrone (contexte non sécurisé, ancien Safari).
function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0'
  document.body.appendChild(area); area.select()
  try { return document.execCommand('copy') } finally { area.remove() }
}
export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch { return copyWithSelection(text) }
}
