# Journal des clôtures

## 2026-10-05 — Claude · cloud
- Livré : v0.10.0 à v0.15.3 — dictée des bilans via OpenRouter (Whisper, clé sur l'appareil, hors sauvegarde), bilan plein écran avec mise en forme G I S, onglet Bilans (copie qui coche Trans/Éval, suppression), test de Tinetti (grille + volet Dictée, ★ cotations précédentes, swipe de bord bloqué), sexe du patient (migration Dexie v4), assistant IA en une passe (synthèse Tinetti qui complète les lignes vides ✨ et signale ⚠, écran Transmission plein écran, « Corriger » du bilan libre), anonymisation [patient], prompts par défaut dans le code avec retouche transitoire, synthèse ramenée à ~1 s.
- Tests : npm test 70/70, lint, build, Playwright 13/13 en local ; CI GitHub verte à chaque version. Essais réels sur iPhone par l'utilisateur (dictée, synthèse en 1,2 s).
- Corrigé à la revue : anonymisation des noms à particule (« Le Gall ») sans retirer « le » du texte ; grille verrouillée pendant la synthèse ; pied de dictée masqué sous les écrans Réponses/Transmission ; micro libéré si l'enregistreur échoue ; collage multiligne ; code mort supprimé.
- En attente : partage des prompts via des fichiers du dépôt (Notion) ; piste Jev pour la catégorisation ; réordonner une journée passée (non retenu pour l'instant) ; autres tests standardisés.
- Prochaine étape : vérifier v0.15.3 sur iPhone (collage, synthèse, anonymisation), puis choisir le prochain bilan standardisé.

## 2026-10-03 — Claude · local
- Livré : v0.8.1 à v0.9.3 — noms à particule entiers dans le TXT, version affichée sur chaque écran, compteurs semaines (éval/trans) et jours depuis la dernière séance A, réglage GRP (migration Dexie v3), Éval/Trans en tête de fiche, historique repliable, retour à la journée d'origine, ordre réordonné propagé aux jours suivants ouverts, Action GitHub de tags et notifications.
- Tests : npm test 42/42, lint, build, Playwright 8/8 ; CI GitHub verte, tag v0.9.3 posé. Pas de test sur iPhone réel.
- Corrigé à la revue : ordre des journées passées préservé lors d'un réordonnancement ; compteur A calculé en une passe sur les journées antérieures ; majuscules après tiret/apostrophe dans le TXT ; tag de version non posé avant l'enregistrement de la CI.
- En attente : décider si réordonner une journée passée doit encore écraser l'ordre type du jour de semaine.
- Prochaine étape : vérifier v0.9.3 sur iPhone (compteurs, GRP, retour depuis la fiche).
