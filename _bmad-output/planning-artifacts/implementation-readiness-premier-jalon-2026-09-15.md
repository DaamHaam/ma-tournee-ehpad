# Vérification de cohérence du premier jalon — 2026-09-15

## Portée

Vérification ciblée de reprise à partir du PRD, de l'UX, de l'architecture, des epics, du code existant et des réponses de Damien. Ce document ne prétend pas terminer le workflow UX ni valider le futur MVP complet.

## Conclusion

Le parcours « saisir une tournée et l'exporter » est suffisamment défini pour implémentation. Les six questions de reprise ont été résolues; leurs décisions sont reportées dans le PRD, l'architecture, les epics et l'UX. Pas de décision produit bloquante identifiée pour ce jalon.

## Alignements nécessaires réalisés

- H: sept niveaux précis, encodage par signes seulement, aucune ligne si signes/commentaire vides.
- Correction des journées: toute date ouverte explicitement, remplace la fermeture au lendemain du brainstorming.
- Historique patient: actes et notes, pas uniquement notes.
- Démo: initialisation unique, patients supprimables et archivables immédiatement.
- Traces anciennes: identité et ordre conservés malgré suppression ou changements des listes futures.

## Dépendances de livraison

Le plan initial par blocs retarde la création des patients après le cockpit. Pour livrer un parcours essayable, le premier jalon regroupe le socle (1.3 à 1.6), la tournée (2.x, 3.x), la création et les sorties patient (5.1, 5.5, 5.6), une fiche/historique simples, la liste (6.1 et filtre archivés), et le TXT (7.x). Un suivi de jalon distinct évite de marquer terminées des stories encore partiellement couvertes.

## Critères de validation technique

Compilation et lint; tests métier/export et transactions de stockage; parcours navigateur (ajouter, pointer, noter, corriger une date, archiver, supprimer, exporter, recharger); chargement hors ligne de la version de production.

## Suite conservée

Administratif détaillé, suivi actif des transmissions et ses seuils, filtres métier, import/export CSV et purge: prévus dans le MVP complet, hors premier essai. La validation sur un véritable iPhone reste à effectuer après livraison de la version locale.
