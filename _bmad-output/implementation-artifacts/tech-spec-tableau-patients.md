# Vue « Tableau » des patients — préparée, à valider avant de coder

Décidée avec l’utilisateur le 2026-11-13. Objectif : voir d’un coup d’œil, dans Patients, la prise en charge administrative de tous les patients (séances, pointage, facturation, IFD, ordonnance, médecin), pour remplacer le tableur tenu à part.

Aucune nouvelle donnée : tous les champs existent déjà dans la fiche (`PatientCare`, `domain/model.ts`). Pas de version Dexie ni de changement de sauvegarde.

## Colonnes (de gauche à droite)

| Colonne | Champ | Affichage |
|---|---|---|
| Patient | `lastName`, `firstName` | en petit, à gauche, colonne fixée pendant le défilement horizontal ; « ! » rouge si `waiting` |
| Couverture | `coverage` | en petit : ALD, Mutuelle, 100% invalidité (ou valeur importée telle quelle), vide = — |
| Séances | `days` | lettres L, J, V et leurs combinaisons (LJ, LV, JV, LJV…) |
| Pointé | `pointed` | case cochée / vide |
| Facturé | `billed` | case cochée / vide |
| Fact. IFD | `ifd` | « non » si vide, sinon le ou les jours facturés (L, J, V…) |
| Fin d’ordo | `prescriptionEnd` | date JJ/MM/AA, couleur de `prescriptionStatus` : orange dans les 15 jours, rouge une fois dépassée, sans couleur sinon ; vide = — |
| Médecin | `doctor` | nom du médecin traitant (texte de la fiche) |

Écartés à la demande : jours d’éval, jours de trans, cotation, GRP. Pas de copie vers le tableur pour l’instant ; l’export du tableau patient (story 8.1) est reporté.

## Remise à zéro

- Pas de remise à zéro automatique (ni mensuelle, ni autre).
- Un bouton « Remettre à zéro » décoche Pointé et Facturé pour tous les patients affichés, après confirmation. Séances, IFD, ordonnance et médecin ne sont jamais touchés.
- Règle pure et testée hors React (`resetBilling` ou équivalent dans `repository.ts`, une seule transaction).

## Décisions du 2026-11-13 (réponses de l’utilisateur)

1. **Accès** : sélecteur « Liste / Tableau » en haut de l’onglet Patients.
2. **Modification dans le tableau** : Pointé et Facturé se cochent d’un toucher, cases bien accessibles. Couverture, Séances et Fact. IFD s’ouvrent d’un toucher sur un menu déroulant qui propose toutes les options (couverture : —, ALD, Mutuelle, 100% invalidité, plus une valeur importée ; séances : —, L, J, V, LJ, LV, JV, LJV ; IFD : non, puis les mêmes combinaisons). L’enregistrement passe par `updatePatient` comme dans la fiche.
3. **Remise à zéro** : un bouton par colonne (« Remettre Pointé à zéro », « Remettre Facturé à zéro »), avec confirmation, sur tous les patients du tableau.
4. **Patients affichés** : tous ceux qui ne sont ni supprimés ni archivés, patients en pause compris (affichés normalement, la pause n’est que passagère).
5. **Ordre** : alphabétique, comme la liste.
6. **Taille** : en portrait, colonne du nom fixée et tassée à gauche, le reste défile horizontalement. En paysage, le tableau profite de toute la largeur. Le manifeste de la PWA bloque aujourd’hui l’orientation en portrait (`orientation: 'portrait'` dans `vite.config.ts`) : passer à `'any'` pour que l’application installée bascule en paysage, puis vérifier sur iPhone que les autres écrans restent corrects tournés.
7. **Toucher le nom** : ouvre la fiche du patient, avec retour au tableau.
8. **Total** : petite ligne discrète en bas (« 12/20 pointés · 9/20 facturés »), facultative.

Prêt à coder.

## Vérifications prévues

`npm test` (remise à zéro, format des colonnes, couleur d’ordo), `npm run lint`, `npm run build`, `npm run test:e2e` (afficher le tableau, cocher, remettre à zéro, couleurs d’ordo, hors ligne), puis essai sur iPhone.
