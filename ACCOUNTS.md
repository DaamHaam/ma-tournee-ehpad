# Comptes et services — Ma tournée EHPAD

Carte des comptes utilisés par le projet. **Aucune valeur secrète ici** : seulement où la trouver.

## Code
- GitHub : compte `DaamHaam`, dépôt `DaamHaam/ma-tournee-ehpad`
- Branches : `main` uniquement pour l'instant (pas de `dev`)
- Config git spécifique : aucune (compte par défaut)

## Hébergement
- GitHub Pages, publié par `.github/workflows/ci-pages.yml` à chaque push sur `main` (après tests, lint et build). URL : https://daamhaam.github.io/ma-tournee-ehpad/

## Base de données
- Aucune base distante : IndexedDB (Dexie) sur l'appareil. Sauvegarde JSON `ma-tournee-sauvegarde` exportée par l'utilisateur.

## API et services externes
- Aucun.

## Outils des agents
- Notification : `tg-notify`

## À savoir
- Données de santé sur l'appareil uniquement ; jamais de vraies données dans Git.
