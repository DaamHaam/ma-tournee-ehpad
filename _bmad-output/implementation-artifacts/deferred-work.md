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

## Après le bilan marche / équilibre (v0.22.0)

- Idée (2026-10-08) : antécédents dans la fiche patient, en deux parties — ceux qui concernent directement la kiné en séance, et les autres. Les bilans (dont marche / équilibre) reprendraient seulement les antécédents kiné ; aujourd’hui la rubrique Antécédents du bilan est un texte libre.
- Idée (2026-10-08) : carnet des médecins dans l’application — enregistrer chaque médecin avec ses contacts (téléphone, mail) et des informations libres ajoutées via un petit bouton.
