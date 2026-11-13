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

## Questions encore ouvertes

1. **Accès** : un sélecteur « Liste / Tableau » en haut de l’onglet Patients ? (proposition)
2. **Modification dans le tableau** : Pointé et Facturé se cochent d’un toucher dans le tableau ? Séances et IFD aussi (toucher → petit choix L J V), ou seulement dans la fiche ?
3. **Bouton de remise à zéro** : un seul bouton pour les deux colonnes, ou un par colonne (Pointé seul, Facturé seul) ?
4. **Patients affichés** : tous les actifs (non archivés) ; les patients en pause aussi, grisés avec leur motif ? les fictifs du premier lancement ?
5. **Ordre** : alphabétique comme la liste, ou par jour de séance ?
6. **Taille sur iPhone** : 8 colonnes en portrait demandent un défilement horizontal (nom fixé) ; ou bien tableau pensé pour l’iPhone tourné en paysage ?
7. **Toucher le nom** : ouvre la fiche du patient (avec retour au tableau) ?
8. **Total** : une ligne de compte en bas (ex. « 12/20 pointés, 9/20 facturés ») ?

## Vérifications prévues

`npm test` (remise à zéro, format des colonnes, couleur d’ordo), `npm run lint`, `npm run build`, `npm run test:e2e` (afficher le tableau, cocher, remettre à zéro, couleurs d’ordo, hors ligne), puis essai sur iPhone.
