---
title: Sauvegarde et restauration complètes
type: feature
created: 2026-09-25
status: done
baseline_commit: 010c5c4
context:
  - ../planning-artifacts/prd.md
  - ../planning-artifacts/architecture.md
---

# Sauvegarde et restauration complètes

## Intention

Les données ne vivent que dans le stockage de l’app sur l’iPhone (IndexedDB). L’export TXT sert au pointage mais ne peut pas être réimporté. Damien a validé une sauvegarde complète restaurable, sans service externe : un stockage en ligne de données de santé tenu par un tiers imposerait un hébergeur certifié HDS.

## Réalisation

- Réglages / Export, bloc « Sauvegarde » :
  - « Sauvegarder » produit `ma-tournee-sauvegarde-AAAA-MM-JJ.json` (patients, fiches, journées, ordres, réglages). Sur iPhone la feuille de partage permet « Enregistrer dans Fichiers » ; sinon téléchargement.
  - « Dernière sauvegarde : JJ/MM/AAAA » s’affiche ensuite.
  - « Restaurer » ouvre un fichier, le valide, demande confirmation (date, nombre de patients et de journées) puis remplace toutes les données en une transaction. Les patients fictifs ne sont jamais réinjectés ensuite.
- Format JSON public `ma-tournee-sauvegarde`, version 1 : champs absents complétés (sauvegarde plus ancienne), fichier étranger ou abîmé refusé, version plus récente refusée avec invitation à mettre l’application à jour.
- Au démarrage, `navigator.storage.persist()` demande à l’appareil de ne pas effacer la base sous pression d’espace.

## Limites

Aucune sauvegarde automatique : Damien la déclenche, par exemple à chaque export TXT. Le fichier contient des données de santé et reste sous sa responsabilité (Fichiers, iCloud Drive).

## Vérification

- `npm test` 23/23 : aller-retour exact du format, compléments, refus ; restauration à l’identique dans une base vierge sans réinjection des fictifs.
- `npm run test:e2e` 5/5 : sauvegarde téléchargée sous WebKit iPhone, restauration dans un contexte vierge (pointage B, note, patient archivé).
- `npm run lint`, `npm run build` réussis.
