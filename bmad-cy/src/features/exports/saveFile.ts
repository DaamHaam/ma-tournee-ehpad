export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url; link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Feuille de partage système (iPhone : « Enregistrer dans Fichiers ») sinon téléchargement. false si annulé.
export async function saveFile(file: File, title: string): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ title, files: [file] }); return true }
    catch (cause) { if (cause instanceof DOMException && cause.name === 'AbortError') return false; throw cause }
  }
  downloadFile(file)
  return true
}
