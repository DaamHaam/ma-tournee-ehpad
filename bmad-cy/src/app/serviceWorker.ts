// Mise à jour de l’application installée sur l’iPhone : fermer puis rouvrir ne fait souvent que la remettre au premier plan,
// sans recharger la page. On vérifie donc s’il existe une nouvelle version à chaque retour au premier plan ; dès qu’elle a
// pris la main (skipWaiting, clientsClaim), la page se recharge, mais jamais pendant un bilan ouvert ni une saisie en cours.
function busy(): boolean {
  if (document.querySelector('.bilan-page')) return true
  const active = document.activeElement
  return !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const hadController = !!navigator.serviceWorker.controller
  let pending = false
  let reloading = false
  const reloadWhenFree = () => {
    if (!pending || reloading || busy()) return
    reloading = true
    window.location.reload()
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Premier chargement : le service worker prend la main sans qu’il y ait d’ancienne version à remplacer.
    if (!hadController) return
    pending = true
    reloadWhenFree()
  })
  window.addEventListener('hashchange', reloadWhenFree)
  document.addEventListener('focusout', () => window.setTimeout(reloadWhenFree, 300))
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js', { scope: './' }).then(registration => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return
        reloadWhenFree()
        void registration.update().catch(() => { /* hors ligne : on réessaiera au prochain retour */ })
      })
    }).catch(() => { /* service worker indisponible : l’application reste utilisable en ligne */ })
  })
}
