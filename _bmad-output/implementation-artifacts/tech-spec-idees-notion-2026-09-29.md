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

## Second lot (v0.7.0, décisions de Damien du 2026-09-29)

- **Homonymes dans le TXT** : « Nom P. » (initiale majuscule suivie d’un point, casse A/B portée par le nom), par exemple `Dupont M. dupont J.`. Si l’initiale ne suffit pas : prénom complet. Homonyme unique sans prénom : nom seul. En dernier recours : identifiant court. L’espace interne est accepté par Damien.
- **Bilan du jour** : bouton « + » à côté de A/B. Il ouvre un champ libre (dictée par le micro du clavier iPhone) avec « Copier ». Il est stocké dans la journée (`entry.bilan`, champ facultatif sans changement de schéma Dexie), visible dans l’historique de la fiche, jamais exporté dans le TXT. Le « + » est coloré quand un bilan existe.

## Pour plus tard

- **Bilan vocal assisté par IA** : Damien n’enverra que des données anonymisées, sans nom. La reconnaissance vocale du clavier est jugée médiocre. À cadrer : transcription de meilleure qualité, mise en forme, extraction des tests (10 m, TUG, périmètre de marche, douleur), rappels des bilans antérieurs. Nécessite un intermédiaire serveur pour ne pas exposer de clé d’API dans une PWA publique.
- **Jev (TypeSafe AI)** : modèle qui renvoie des décisions typées avec probabilités (oui/non, choix dans une liste, position sur une échelle). Candidat pour catégoriser un bilan dicté (tests mentionnés, niveau de douleur, items de la trame). Mêmes contraintes d’anonymisation et d’intermédiaire que ci-dessus.

## Vérification

- `npm test` 26/26, `npm run lint`, `npm run build` réussis.
- `npm run test:e2e` 5/5 : quatre repères dont un rouge, noms courts, bouton « Copié ✓ », titre masqué, champs date contenus dans leur carte.
