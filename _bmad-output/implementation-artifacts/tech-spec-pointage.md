# Vue « Pointage » des patients — codée (v0.37.0)

Décidée avec l’utilisateur le 2026-11-13. Objectif : harmoniser, sur une période (souvent deux mois), les séances réellement pointées, puis exporter la liste restante au format de l’export de fin de journée.

## Décisions

1. **Accès** : troisième bouton du sélecteur de Patients (« Liste · Tableau · Pointage », adresse `/patients?vue=pointage`).
2. **Jours affichés** : tous les jours où au moins une séance A ou B est cochée, du plus récent (en haut) au plus ancien, regroupés par mois ; un sélecteur « Aller au mois » saute au mois choisi.
3. **Patients d’un jour** : dans l’ordre de la tournée (comme l’export), en boutons bleus (A) ou orange (B), la note du jour en petit sous le nom. Un total « n A · n B » des séances restantes par jour, à l’écran seulement.
4. **Retrait réversible** : toucher un patient le retire du pointage de ce jour (bouton grisé et barré, liseré de sa couleur) ; un second toucher le remet. Marque `entry.unpointed` sur l’entrée de la journée, utilisée **uniquement** par cette vue et son export : la journée garde A ou B, l’export habituel, la fiche et l’historique ne changent pas. Modifier la journée après coup ne lève pas un retrait.
5. **Export** : période Du / Au (par défaut du 1er du mois précédent à aujourd’hui), aperçu, Copier, Télécharger .txt, Partager. Même format que l’export de journée (`exportTxt` : date et signes H, commentaire du jour, noms A en majuscule initiale / B en minuscules avec notes entre parenthèses, « Pas vus », « Pause »), les séances retirées étant traitées comme non vues (leur note éventuelle passe dans « Pas vus », leur pause dans « Pause »). Pas de total dans l’export.
6. **Marque d’export** : copier, télécharger ou partager l’export marque chaque jour pointé de la période (`day.pointageExportedAt`, date locale) ; un petit ⇪ suit alors la date du jour dans la vue.

## Données

Deux champs facultatifs, sans index : pas de nouvelle version Dexie. Ils passent dans la sauvegarde JSON (validés à la restauration ; absents des anciennes sauvegardes).

## Code

`domain/pointage.ts` (jours, ordre, totaux, mois, `withoutUnpointed`), `exportPointage` dans `features/exports/exportTxt.ts`, `repository.toggleUnpointed` et `markPointageExported`, vue `features/patients/Pointage.tsx`. Tests : `pointage.test.ts`, `repository.test.ts`, `backup.test.ts`, parcours Playwright « pointage ».
