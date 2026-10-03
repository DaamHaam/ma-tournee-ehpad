# Journal des clôtures

## 2026-10-03 — Claude · local
- Livré : v0.8.1 à v0.9.3 — noms à particule entiers dans le TXT, version affichée sur chaque écran, compteurs semaines (éval/trans) et jours depuis la dernière séance A, réglage GRP (migration Dexie v3), Éval/Trans en tête de fiche, historique repliable, retour à la journée d'origine, ordre réordonné propagé aux jours suivants ouverts, Action GitHub de tags et notifications.
- Tests : npm test 42/42, lint, build, Playwright 8/8 ; CI GitHub verte, tag v0.9.3 posé. Pas de test sur iPhone réel.
- Corrigé à la revue : ordre des journées passées préservé lors d'un réordonnancement ; compteur A calculé en une passe sur les journées antérieures ; majuscules après tiret/apostrophe dans le TXT ; tag de version non posé avant l'enregistrement de la CI.
- En attente : décider si réordonner une journée passée doit encore écraser l'ordre type du jour de semaine.
- Prochaine étape : vérifier v0.9.3 sur iPhone (compteurs, GRP, retour depuis la fiche).
