# Ma tournée EHPAD

PWA iPhone-first pour préparer et tracer une tournée de kinésithérapie en EHPAD. La version actuelle fonctionne sans compte ni serveur : patients, journées, notes et ordres sont enregistrés dans IndexedDB sur l’appareil. Seule la dictée facultative des bilans envoie l’audio à OpenRouter pour transcription.

Version actuelle : 0.15.0 (affichée en bas de `Réglages / Export`). Version testable en ligne : [https://daamhaam.github.io/ma-tournee-ehpad/](https://daamhaam.github.io/ma-tournee-ehpad/)

## Parcours disponible

- `Journée` : date au toucher, raccourcis lundi/jeudi/vendredi, réorganisation des cartes et des quatre repères (le rouge pour les patients sans séance prévue) par appui long, cartes au format « NOM P. », pointage A/B exclusif, note ouverte par le triangle, bilan libre du jour ouvert en plein écran par « + » (copiable, visible dans l’historique, hors export TXT), niveau H et commentaire.
- Test de Tinetti (« + » puis « Test de Tinetti ») : grille de 28 points en plein écran, volets Grille (équilibre puis marche) et Dictée (G I S, clavier) à faire glisser, sans retour arrière par glissement du bord, cotation d’un appui, score calculé, cotations précédentes marquées ★ ; copier le résultat coche Éval.
- Assistant de rédaction IA (facultatif, modèle d’analyse saisi dans Réglages, même clé OpenRouter) : la barre « Synthèse » de Tinetti (Lancer, Voir, Relancer) cote d’après la dictée les lignes laissées vides (✨ IA), rédige les observations et signale ⚠ les cotations douteuses, en une seule passe et sans validation ligne à ligne (✨ et ⚠ directement dans la grille), puis deux écrans : Réponses, et Transmission en plein écran (dictée, G I S, clavier) validée avant retour à la journée. « ✨ Corriger » corrige le bilan libre (annulable). Texte envoyé anonymisé ; prompts tenus à jour dans le code, modifiables transitoirement dans Réglages ; sexe du patient dans la fiche pour les accords.
- Mise en forme des bilans : barre G / I / S au-dessus du texte pour mettre en gras, italique ou souligné un passage sélectionné ; la copie transmet la mise en forme (HTML) et le texte brut.
- Dictée des bilans : bouton micro en bas du bilan, transcription par OpenRouter (Whisper) insérée à la position du curseur (toucher le texte place le curseur sans ouvrir le clavier ; en bas, ↵ pour aller à la ligne, micro au centre, clavier à droite pour taper), 5 minutes au plus par dictée. Nécessite une clé OpenRouter saisie dans `Réglages` (gardée sur l’appareil, exclue de la sauvegarde) et le réseau ; sinon, le micro du clavier reste disponible. Ne prononcer aucun nom : l’audio part chez OpenRouter.
- `Bilans` : bilans d’une journée (aujourd’hui par défaut, sélecteur de date) dans l’ordre où ils ont été commencés, repliés ; chacun se déplie, se modifie, se copie (copie = transmission du jour cochée, marque ✓) ou se supprime après confirmation.
- `Patients` : ajout, liste alphabétique, fiche modifiable, historique (bilans copiables et supprimables), archivage et suppression confirmée. Une suppression conserve les snapshots nécessaires aux anciennes journées et aux exports.
- `Réglages / Export` : plage de dates (jour même par défaut), aperçu TXT, copie, téléchargement et partage système lorsque le navigateur le permet ; import de patients par copier-coller d’un tableau (remplace la liste des patients ; un patient déjà connu, même nom et prénom, garde sa fiche, son historique et ses dates d’éval/trans ; les journées passées ne changent pas).
- Sauvegarde : fichier JSON complet (patients, fiches, journées, ordres) enregistrable dans Fichiers et restaurable sur l’app ou un autre iPhone.
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

Les dates sont des clés locales `YYYY-MM-DD`. Chaque journée conserve son propre ordre et une copie minimale de l’identité des patients présents (nom, prénom, chambre, priorité). Une fiche renommée met à jour cette copie pour aujourd’hui et les jours futurs seulement. Consulter une journée passée ne la modifie pas : elle n’est enregistrée qu’à la première saisie. L’export produit du texte brut : nom complet, particule comprise (« Le Gall » pour A, « le gall » pour B, prénom ajouté seulement pour les homonymes), notes entre parenthèses, puis les patients commentés mais non vus sur une ligne distincte. Le niveau H est exporté uniquement sous forme de signes ; H neutre et H non renseigné n’ajoutent aucun signe.

## Limites de cette version

- aucune synchronisation, sauvegarde cloud ou compte ; la dictée des bilans est le seul appel réseau (OpenRouter), facultatif ; effacer les données du site, ou supprimer l’icône de l’écran d’accueil, efface la base locale : sauvegarder régulièrement ;
- l’app installée sur l’écran d’accueil a un stockage distinct de Safari ;
- pas d’export du tableau patient, de purge des journées ni de bilans ;
- Safari/iPhone physique reste à valider avant usage réel avec des données sensibles ;
- l’icône est fournie en SVG et en PNG (`apple-touch-icon.png` pour l’écran d’accueil iPhone, 192 et 512 px pour le manifeste).

Cette application est un outil personnel de suivi et non un dispositif médical ni un dossier patient partagé.
