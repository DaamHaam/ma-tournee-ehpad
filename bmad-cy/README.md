# Ma tournée EHPAD

PWA iPhone-first pour préparer et tracer une tournée de kinésithérapie en EHPAD. La version actuelle fonctionne sans compte ni serveur : patients, journées, notes et ordres sont enregistrés dans IndexedDB sur l’appareil.

Version actuelle : 0.3.0 (affichée en bas de `Réglages / Export`). Version testable en ligne : [https://daamhaam.github.io/ma-tournee-ehpad/](https://daamhaam.github.io/ma-tournee-ehpad/)

## Parcours disponible

- `Journée` : date au toucher, raccourcis lundi/jeudi/vendredi, réorganisation des cartes et des trois repères par appui long, pointage A/B exclusif, note ouverte par le triangle, niveau H et commentaire.
- `Patients` : ajout, liste alphabétique, fiche modifiable, historique, archivage et suppression confirmée. Une suppression conserve les snapshots nécessaires aux anciennes journées et aux exports.
- `Réglages / Export` : plage de dates (jour même par défaut), aperçu TXT, copie, téléchargement et partage système lorsque le navigateur le permet ; import de patients par copier-coller d’un tableau (remplace tous les patients, sans toucher aux journées).
- Fiche patient : couverture, séances et IFD (L/J/V), pointé, facturé, fin d’ordonnance, médecin traitant, cotation ; cases Éval et Trans datées du jour qui colorent le triangle de la Journée.
- PWA : ressources mises en cache après un premier chargement complet pour permettre le rechargement hors ligne.

L’import attend, dans cet ordre : `nom`, `prenom`, `couverture`, `seances`, `ifd`, `pointe`, `facture`, `eval`, `trans`, `fin_ordo` (`JJ/MM/AAAA`), `medecin`, `cotation`. En-tête, lignes vides et colonnes supplémentaires sont ignorés.

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
- pas d’export du tableau patient, de purge des journées ni de bilans ;
- Safari/iPhone physique reste à valider avant usage réel avec des données sensibles ;
- l’icône PWA est fournie en SVG, à compléter par des variantes PNG si la cible iOS déployée l’exige.

Cette application est un outil personnel de suivi et non un dispositif médical ni un dossier patient partagé.
