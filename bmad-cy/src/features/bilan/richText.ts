// Texte enrichi des bilans : seuls gras, italique, souligné et retours à la ligne sont conservés.
// Tout le reste (balises, attributs, styles) est retiré, ce qui rend le HTML sûr à afficher et à copier.
const KEPT: Record<string, string> = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u' }
const OPEN = '\u0001'
const CLOSE = '\u0002'

export function escapeHtml(text: string): string { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

export function sanitizeBilanHtml(html: string, keepTrailingBreak = false): string {
  const marked = html
    .replace(/<(div|p)(\s[^>]*)?>\s*<br\s*\/?>\s*<\/\1>/gi, `${OPEN}br${CLOSE}`)
    .replace(/<\/(div|p)>\s*<(div|p)(\s[^>]*)?>/gi, `${OPEN}br${CLOSE}`)
    .replace(/<(div|p)(\s[^>]*)?>/gi, (_, _tag, _attrs, offset: number) => offset === 0 ? '' : `${OPEN}br${CLOSE}`)
    .replace(/<br\s*\/?>/gi, `${OPEN}br${CLOSE}`)
    .replace(/<(\/?)([a-z]+)(\s[^>]*)?>/gi, (_tag, slash: string, name: string) => KEPT[name.toLowerCase()] ? `${OPEN}${slash}${KEPT[name.toLowerCase()]}${CLOSE}` : '')
    .replace(/<[^>]*>?/g, '')
  const safe = marked.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return safe
    .replace(new RegExp(`${OPEN}(/?[biu]|br)${CLOSE}`, 'g'), '<$1>')
    .replace(/<(b|i|u)><\/\1>/g, '')
    .replace(keepTrailingBreak ? /$^/ : /<br>$/, '')
}

export function htmlToText(html: string, keepTrailingBreak = false): string {
  return sanitizeBilanHtml(html, keepTrailingBreak).replace(/<br>/g, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\u00a0/g, ' ')
}

export function textToHtml(text: string): string { return escapeHtml(text).replace(/\r?\n/g, '<br>') }

// HTML affichable d’un bilan : sa version enrichie si elle existe, sinon le texte brut des anciens bilans.
export function bilanHtml(entry: { bilan?: string; bilanHtml?: string }): string { return sanitizeBilanHtml(entry.bilanHtml ?? textToHtml(entry.bilan ?? '')) }

// Ajout en fin de bilan (dictée revenue après avoir quitté la page) : sur une nouvelle ligne, comme toute nouvelle dictée.
export function appendText(html: string, text: string): string {
  const piece = escapeHtml(text.trim())
  if (!piece) return html
  return htmlToText(html).trim() && !/<br>$/.test(html) ? `${html}<br>${piece}` : `${html}${piece}`
}
