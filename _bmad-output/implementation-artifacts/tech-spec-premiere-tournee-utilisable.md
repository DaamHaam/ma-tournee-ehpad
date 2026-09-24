---
title: Première tournée utilisable
type: feature
created: 2026-09-15
status: done
baseline_commit: NO_VCS
context:
  - ../planning-artifacts/prd.md
  - ../planning-artifacts/architecture.md
  - ../planning-artifacts/decisions-reprise-2026-09-15.md
---

# Première tournée utilisable

<frozen-after-approval reason="Périmètre accepté par Damien dans ses réponses et sa demande de reprise">

## Intention

Le code actuel est un écran statique. Réaliser un parcours complet sur iPhone: ouvrir une tournée avec patients fictifs, ajouter un patient, pointer A/B, noter, renseigner H, retrouver les données et exporter une période. Ajouter immédiatement archivage et suppression comme demandé. Ce jalon conserve le périmètre complet du MVP pour la suite.

## Contraintes

Toujours: français, trois onglets Journée / Patients / Réglages-Export, iPhone, données locales, hors ligne, React/TypeScript strict/Tailwind/Dexie/PWA, séparation domaine/stockage/UI/export. Données par date locale YYYY-MM-DD, sauvegarde des actions immédiate et des textes au fil de saisie ou sortie du champ avec retour fiable en cas d'échec. Tous les patients actifs visibles L/J/V; ordre par jour de semaine, trois séparateurs déplaçables. Toute date passée peut être ouverte explicitement et corrigée. Nouvelle date = pointage/notes/H/commentaire vides.

H: sept valeurs H--- à H+++; TXT uniquement les signes, neutre et non renseigné sans signe. Conserver commentaire seul; omettre ligne entière si signes et commentaire vides. Patients vus sur une ligne, noms séparés par espaces: A initiale majuscule, B minuscule; notes entre parenthèses. Homonymes différenciés; pas vus commentés sur ligne distincte. Export respecte l'ordre enregistré à la date concernée, y compris après réorganisation ultérieure.

Patients fictifs clairement identifiés, chargés une seule fois au premier lancement; jamais recréés après suppression. Ajout nom/prénom obligatoires, chambre et priorité simples; liste alphabétique et filtre archivés. Archivage retire du flux actif, fiche consultable ensuite. Suppression demande une confirmation, efface la fiche mais préserve les traces journalières via snapshots des noms. Historique fiche: séances et notes, plus récent d'abord, avec accès date. Transmission inconnue: triangle gris et libellé accessible.

Hors jalon: administratif complet, suivi actif transmissions, filtres métier, bilans, import/export CSV, purge, cloud/comptes. Ne pas inventer de fonctions cliniques. Pas de publication distante demandée.

## Cas limites

| État / action | Résultat |
|---|---|
| A puis B, puis B encore | B seul, puis aucun acte |
| Note sans acte | Export pas vus, historique conservé |
| H neutre sans commentaire | Pas de ligne H, ni ligne vide correspondante |
| Changement de date | Données distinctes, aucune réutilisation de veille |
| Suppression/archivage | Actif retiré, anciennes traces exportables |
| Réorganisation semaine suivante | Ancien ordre journalier préservé |
| Échec écriture locale | Erreur visible, jamais annoncer sauvegardé |
| Aucun patient / aucune journée | État vide utile; pas de réinjection démo |
| Export plage inversée | Erreur lisible, pas de fichier |

</frozen-after-approval>

## Carte du code et tâches

- [x] `bmad-cy/src/domain/*`: modèles, dates locales, noms, H, exclusivité, ordre historique; règles testables.
- [x] `bmad-cy/src/storage/*`: Dexie versionné, migration initiale, initialisation démo unique, transactions, snapshots journaliers, repositories.
- [x] `bmad-cy/src/App.tsx` et `src/app/*`: trois onglets, routes fiche, ouverture Journée et erreurs globales.
- [x] `bmad-cy/src/features/journee/*`: date explicite, L/J/V, liste compacte, réorganisation tactile/clavier et séparateurs, A/B, note, H et commentaire.
- [x] `bmad-cy/src/features/patients/*`: liste, ajout, fiche simple, historique, archive et suppression confirmée.
- [x] `bmad-cy/src/features/exports/*` et `settings/*`: fonctions TXT pures, intervalle dates, aperçu, téléchargement et partage système si disponible.
- [x] `bmad-cy/src/index.css`: interface tactile sobre, focus, safe areas, lisibilité 375 px.
- [x] `bmad-cy/vite.config.ts`, `public/*`, `index.html`: manifest, icônes locales, cache hors ligne, aucun rechargement forcé pendant saisie.
- [x] Tests unitaires domaine/stockage/export, tests navigateur parcours et hors ligne; README démarrage et limites.

## Critères d'acceptation

- Étant donné un premier lancement, quand Journée s'ouvre, alors des patients explicitement fictifs et les trois onglets sont utilisables.
- Étant donné des modifications, quand l'application est rechargée, alors données et ordre sont conservés.
- Étant donné une date passée, quand elle est ouverte, alors séances et notes sont corrigeables et l'export actualisé.
- Étant donné une fiche, quand elle est archivée ou supprimée, alors elle sort du flux actif et ses traces passées restent exportables.
- Étant donné un chargement initial complet, quand le réseau est coupé puis l'application rechargée, alors consultation, pointage et export restent utilisables.
- Étant donné un écran étroit, quand les actions sont utilisées au toucher ou clavier, alors elles restent accessibles sans débordement horizontal.

## Design

Fond #f6f7f9, surfaces #ffffff, texte #202a36, secondaire #647181, bordure #dce1e7, accent bleu #315d78. Police système iPhone pour interface; chiffres tabulaires et monospace uniquement aperçu TXT. En-tête date lisible, bande L/J/V, liste dense; triangle et A/B forment les repères stables. Navigation inférieure fixe, zones tactiles au moins 44 px. Aucune décoration ni ressource distante.

## Vérification

`npm run build`, `npm run lint`, tests Vitest et parcours navigateur, dont rechargement hors ligne de la version production. Vérification physique Safari/iPhone à effectuer avec Damien après présentation locale.

Résultats du 2026-09-24:

- `npm test`: 10 tests Vitest réussis sur 10 (domaine, export et stockage Dexie avec IndexedDB simulé).
- `npm run lint`: réussi sans erreur ni avertissement.
- `npm run build`: réussi; manifeste, enregistrement du service worker et cache Workbox générés (8 ressources précachées).
- `npm run test:e2e`: 2 scénarios réussis sur 2 après exécution hors bac à sable: parcours iPhone sous WebKit, puis rechargement, pointage persistant et export hors ligne sous Chromium mobile.
- Reste à effectuer la vérification physique Safari/iPhone prévue.

## Notes de revue

- Relecture d’implémentation effectuée sur les écritures locales, la préservation des snapshots, les dates, l’ordre historique et les cas limites du TXT.
- La revue adversariale à trois regards a conduit à corriger les courses de génération d’export, le double ajout patient, les liens de navigation, le retour d’échec de sauvegarde, le retrait du flux actif et la robustesse des téléchargements/partages.
- Aucun défaut bloquant relevé après les corrections et les tests navigateur.
- Risque résiduel assumé: installation et apparence de l’icône PWA à confirmer sur Safari/iPhone réel.

## Journal

- 2026-09-15: périmètre accepté dans la conversation; poursuite autorisée, pas de nouvelle demande d'approbation. Aucune gestion de versions Git disponible.
- 2026-09-24: parcours complet implémenté; build, lint, 10 tests unitaires et 2 tests navigateur validés. Revue adversariale appliquée. Aucun push ni déploiement distant effectué.
