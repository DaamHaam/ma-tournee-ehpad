# Travail différé

## Après le premier jalon

- Vérifier l’installation, le rechargement hors ligne et l’icône sur un iPhone physique avec Safari; produire des icônes PNG dédiées si nécessaire.
- Pour le MVP complet, reprendre les interactions détaillées du cockpit prévues dans le PRD: tiroir de note via le triangle, affichage compact des homonymes et suivi actif des transmissions.
- Paginer ou indexer l’historique patient si le volume réel de journées rend le balayage IndexedDB perceptible.
- Ajouter une migration Dexie explicite lors du premier changement de schéma après la version 1.

## Après la v0.2.0

- Prévoir un moyen simple d’intégrer une base initiale de patients (dates de prescription et autres informations), idéalement via un fichier importable directement depuis l’iPhone. Format à définir avec Damien (remplace ou complète les stories 8.1/8.2).
- Le choix du stockage des données (IndexedDB seul, sauvegarde, autre) sera rediscuté ; ne rien engager avant cette discussion.
- Les patients fictifs du premier lancement ne portent plus de mention visible depuis la v0.2.0 ; ils restent marqués `demo` en base.
