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

// Copie enrichie : HTML (gras, italique, souligné) et texte brut ensemble ; le logiciel qui colle choisit.
function copyRichWithSelection(html: string): boolean {
  const box = document.createElement('div')
  box.contentEditable = 'true'; box.innerHTML = html; box.style.position = 'fixed'; box.style.opacity = '0'; box.style.whiteSpace = 'pre-wrap'
  document.body.appendChild(box)
  const selection = window.getSelection()
  const range = document.createRange(); range.selectNodeContents(box)
  selection?.removeAllRanges(); selection?.addRange(range)
  try { return document.execCommand('copy') } finally { selection?.removeAllRanges(); box.remove() }
}
export async function copyRich(html: string, text: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) throw new Error('indisponible')
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })])
    return true
  } catch {
    try { if (copyRichWithSelection(html)) return true } catch { /* repli texte brut */ }
    return copyText(text)
  }
}
