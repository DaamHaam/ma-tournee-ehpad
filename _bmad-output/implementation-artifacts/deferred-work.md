# Travail différé

## Après le premier jalon

- Vérifier l’installation, le rechargement hors ligne et l’icône sur un iPhone physique avec Safari; produire des icônes PNG dédiées si nécessaire.
- Pour le MVP complet, reprendre les interactions détaillées du cockpit prévues dans le PRD: tiroir de note via le triangle, affichage compact des homonymes et suivi actif des transmissions.
- Paginer ou indexer l’historique patient si le volume réel de journées rend le balayage IndexedDB perceptible.

## Après la v0.2.0

- Stockage décidé le 2026-09-25 : IndexedDB local et sauvegarde complète manuelle (`tech-spec-sauvegarde-complete.md`), sans service externe.
- Les patients fictifs du premier lancement ne portent plus de mention visible depuis la v0.2.0 ; ils restent marqués `demo` en base.

## Après l’import de patients

- Import livré par copier-coller (voir `tech-spec-import-patients-suivi.md`). Reste à décider : un export du tableau patient dans le même format (story 8.1) pour le réimporter ailleurs.
- Filtre « prescriptions proches de fin » (story 6.3) désormais possible grâce à la date de fin d’ordonnance.
