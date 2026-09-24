# Ma tournée EHPAD

PWA iPhone-first pour préparer et tracer une tournée de kinésithérapie en EHPAD. La version actuelle fonctionne sans compte ni serveur : patients, journées, notes et ordres sont enregistrés dans IndexedDB sur l’appareil.

Version testable en ligne : [https://daamhaam.github.io/ma-tournee-ehpad/](https://daamhaam.github.io/ma-tournee-ehpad/)

## Parcours disponible

- `Journée` : ouverture d’une date, raccourcis lundi/jeudi/vendredi, ordre tactile ou clavier, trois séparateurs, pointage A/B exclusif, notes, niveau H et commentaire.
- `Patients` : ajout, liste alphabétique, fiche modifiable, historique, archivage et suppression confirmée. Une suppression conserve les snapshots nécessaires aux anciennes journées et aux exports.
- `Réglages / Export` : plage de dates, aperçu TXT, téléchargement et partage système lorsque le navigateur le permet.
- PWA : ressources mises en cache après un premier chargement complet pour permettre le rechargement hors ligne.

Au premier lancement seulement, quatre patients explicitement fictifs sont créés. Une fois archivés ou supprimés, ils ne sont jamais réinjectés.

## Développement

Prérequis : Node.js récent et npm.

```bash
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite. Pour vérifier la version de production et son service worker :

```bash
npm run build
npm run preview
```

Le service worker ne fonctionne pas comme en production dans le serveur `dev`. L’installation iPhone se fait depuis Safari via **Partager → Sur l’écran d’accueil**, après un premier chargement en ligne.

## Vérifications

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Les tests unitaires couvrent les règles A/B et H, les dates, le format TXT, l’initialisation unique, les snapshots après suppression et l’ordre historique. Les tests Playwright couvrent le premier parcours et le rechargement hors ligne de la build de production.

## Format et stockage

Les dates sont des clés locales `YYYY-MM-DD`. Chaque journée conserve son propre ordre et une copie minimale de l’identité des patients présents. L’export produit du texte brut : initiale majuscule pour A, minuscule pour B, notes entre parenthèses, puis les patients commentés mais non vus sur une ligne distincte. Le niveau H est exporté uniquement sous forme de signes ; H neutre et H non renseigné n’ajoutent aucun signe.

## Limites de cette version

- aucune synchronisation, sauvegarde cloud ou compte ; effacer les données du site Safari efface la base locale ;
- pas d’import/export CSV du socle patient, de purge automatisée, de bilans ou de suivi actif des transmissions ;
- le triangle de transmission reste gris avec le libellé accessible « date inconnue » ;
- Safari/iPhone physique reste à valider avant usage réel avec des données sensibles ;
- l’icône PWA est fournie en SVG, à compléter par des variantes PNG si la cible iOS déployée l’exige.

Cette application est un outil personnel de suivi et non un dispositif médical ni un dossier patient partagé.
