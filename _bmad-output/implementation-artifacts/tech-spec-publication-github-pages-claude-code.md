---
title: Publication GitHub Pages et configuration Claude Code
status: in-review
baseline_commit: 3272288697a6109c847a1315daf5be8f1c1f2316
context:
  - ../planning-artifacts/architecture.md
  - ../planning-artifacts/prd.md
---

# Publication GitHub Pages et configuration Claude Code

## Objectif

Rendre la première version utilisable accessible en ligne depuis GitHub Pages et permettre de reprendre le même dépôt avec Claude Code ou Codex sans perdre les règles du projet.

## Travaux

- Ajouter à la racine un `CLAUDE.md` important un `AGENTS.md` commun.
- Documenter dans `AGENTS.md` les commandes, l’architecture, les invariants métier, la confidentialité, la validation et le déploiement.
- Marquer la première version testable `0.1.0`.
- Contrôler les fichiers suivis et l’historique avant toute publication publique.
- Créer le dépôt public `DaamHaam/ma-tournee-ehpad`, pousser `main` et le tag `v0.1.0`.
- Déployer avec GitHub Actions sur `https://daamhaam.github.io/ma-tournee-ehpad/` et vérifier cette URL.

## Critères d’acceptation

- Étant donné un lancement de Claude Code depuis la racine ou `bmad-cy/`, quand il charge sa mémoire projet, alors les règles communes de `AGENTS.md` sont accessibles via `CLAUDE.md`.
- Étant donné une modification du projet, quand un agent consulte les règles, alors il trouve les commandes de validation, les invariants IndexedDB et les contraintes de confidentialité.
- Étant donné la branche `main`, quand elle est poussée sur GitHub, alors le workflow exécute les tests unitaires et E2E, le lint et le build avant de déployer l’artefact de production sur GitHub Pages.
- Étant donné l’URL GitHub Pages, quand elle est ouverte sous le chemin `/ma-tournee-ehpad/`, alors l’application compilée s’affiche et son service worker prend en charge ce sous-chemin.

## Validation

- `cd bmad-cy && npm test`
- `cd bmad-cy && npm run lint`
- `cd bmad-cy && npm run build`
- `cd bmad-cy && npm run test:e2e`
- vérification du workflow GitHub Actions et ouverture de l’URL Pages
