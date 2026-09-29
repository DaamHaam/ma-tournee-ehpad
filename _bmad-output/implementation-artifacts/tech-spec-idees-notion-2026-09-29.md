---
title: Idées Notion du 2026-09-29 — lot simple
type: feature
created: 2026-09-29
status: done
baseline_commit: 91a63a5
context:
  - tech-spec-journee-gestes-directs.md
  - tech-spec-sauvegarde-complete.md
---

# Idées Notion du 2026-09-29 — lot simple

Tri de la base Notion « Idées développement » (projet BMAD CY). Ce lot couvre les idées sans ambiguïté ; les autres attendent des réponses de Damien.

## Réalisé

- **Quatrième repère rouge** (plus épais, déplaçable, sans texte) pour ranger les patients sans séance prévue ce jour-là. Il est ajouté à la fin des journées et modèles d’ordre qui n’avaient que trois repères. Les sauvegardes à trois repères restent restaurables.
- **Journée** : chaque carte affiche seulement le nom suivi de l’initiale du prénom (« NOM P. »), sans chambre ni priorité ; les mentions Archivé / Supprimé restent sur les journées passées. Les libellés accessibles gardent le nom complet.
- **Titres retirés** : « Patients » et « Réglages / Export » ne sont plus affichés (conservés pour les lecteurs d’écran).
- **Champs date** : sur Safari iOS, les champs de période et de fin d’ordonnance ne débordent plus du cadre.
- **Copier** : le bouton devient « Copié ✓ » pendant 1,5 s ; le message précédent apparaissait hors de l’écran.

## En attente de décision

- Export TXT des homonymes « nom espace initiale » : l’espace sépare aujourd’hui les patients vus, format à confirmer.
- Bouton « + » de bilan dicté par patient, avec copie.
- Bilan vocal assisté par LLM : données de santé envoyées à un service externe, à cadrer.
- Test du modèle Jev : hors application.

## Vérification

- `npm test` 26/26, `npm run lint`, `npm run build` réussis.
- `npm run test:e2e` 5/5 : quatre repères dont un rouge, noms courts, bouton « Copié ✓ », titre masqué, champs date contenus dans leur carte.
