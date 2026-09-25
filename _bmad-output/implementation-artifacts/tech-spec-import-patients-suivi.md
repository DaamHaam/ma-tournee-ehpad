---
title: Import de patients par copier-coller et suivi éval/trans
type: feature
created: 2026-09-25
status: done
baseline_commit: 2f549b7
context:
  - ../planning-artifacts/prd.md
  - ../planning-artifacts/epics.md
  - tech-spec-v0-2-interface-epuree.md
---

# Import de patients par copier-coller et suivi éval/trans

## Intention

Damien veut importer sa base de patients en collant un tableau dans l’application, et suivre sur la fiche la prise en charge : couverture, séances, IFD, cases pointé/facturé, fin d’ordonnance, médecin traitant, cotation, ainsi que la dernière évaluation et la dernière transmission. Cette spec couvre les stories 4.1 et 4.2 (étendues à l’évaluation) et remplace 8.2 par un import collé.

## Décisions de Damien (2026-09-25)

- Import dans Réglages, par un champ où l’on colle le texte ; pas d’import de fichier.
- L’import remplace tous les patients présents, y compris archivés et fictifs.
- Colonnes lues par position : `nom`, `prenom`, `couverture`, `seances`, `ifd`, `pointe`, `facture`, `eval`, `trans`, `fin_ordo`, `medecin`, `cotation`. Ligne d’en-tête, lignes vides et colonnes supplémentaires (ex. `groupe`) ignorées. Tabulation (copie tableur) ou point-virgule.
- Prénom facultatif (import, ajout et fiche).
- Valeurs recopiées telles quelles (ex. médecin « ? ») ; couverture reconnue sans casse parmi ALD, Mutuelle, 100% invalidité, sinon conservée.
- Séances et IFD : lettres L, J, V (toutes combinaisons) ; IFD « non » = aucun jour.
- Pointé et Facturé : cases on/off persistantes sur la fiche.
- Éval et Trans : cases cochées seulement le jour même. Cocher enregistre la date du jour, décocher le même jour la retire et restaure la précédente. À l’import, `oui` = date du jour, une date `JJ/MM/AAAA` est reprise.
- Triangle de la Journée coloré selon la dernière date d’éval ou de trans, indifféremment : < 30 j vert clair, 30–44 j vert foncé, 45–60 j orange, > 60 j rouge, gris si inconnue.
- Tous les patients restent visibles dans la Journée ; les séances ne filtrent rien.
- Export TXT : un nom composé n’exporte que son premier mot (« ABREU GOMES » → `abreu`).

## Invariants

- Dexie version 2 avec migration explicite ajoutant les champs vides aux patients existants.
- L’import ne touche pas aux journées : snapshots, ordres historiques et exports passés sont préservés. Les modèles d’ordre L/J/V sont réinitialisés (repères puis ordre alphabétique).
- Les patients fictifs ne sont jamais réinjectés après un import.
- Aucune donnée réelle dans le dépôt : tests et fixtures fictifs uniquement.

## Critères d’acceptation

- Étant donné un tableau collé depuis un tableur, quand j’importe et confirme, alors les patients sont remplacés et apparaissent dans la Journée.
- Étant donné une ligne illisible (date, oui/non, nom manquant), quand j’importe, alors rien n’est remplacé et la ligne fautive est indiquée.
- Étant donné une fiche, quand je coche Trans, alors la date du jour est enregistrée et le triangle devient vert clair ; le lendemain la case est décochée et la date précédente reste affichée.
- Étant donné une base v1, quand l’application v2 s’ouvre, alors les patients existants sont conservés avec des champs vides.

## Vérification

- `npm test` : 19/19 (import, bascules L/J/V, dates de suivi, seuils de couleur, remplacement, migration v1 → v2, export des noms composés).
- `npm run lint`, `npm run build` : réussis.
- `npm run test:e2e` : 3/3, dont import collé, fiche, case Trans, triangle et export sous WebKit iPhone.
- Tableau réel de Damien vérifié localement (16 patients, aucune erreur) sans être enregistré dans le dépôt.
