# Journal des clôtures

## 2026-10-09 — Claude · cloud
- Livré : v0.22.0 à v0.28.1 — bilan flexible marche / équilibre (sous-modules à la suite avec onglets, compte rendu mis en forme, copie à chasse fixe CRLF, ★ des mesures précédentes) ; trois volets Formulaire · Dictée · Résultat pour Tinetti et marche / équilibre ; intégration IA de la dictée (✨, ↶, ⚠, Valider), la dictée prime sur les cases et va telle quelle dans l'« Autre » de sa rubrique, mise en forme dictée conservée ; civilités Mr / Mme, jamais de nom ni [patient] ; lignes de l'IA en violet, à vérifier en orange (écran seulement) ; clavier ouvert au toucher avec rangée G I S · micro · flèche ; Voxtral par défaut ; réflexion du modèle réglable dans Réglages.
- Tests : npm test 99/99, lint, build, Playwright 20/20 en local (Chromium iPhone) ; CI GitHub verte (WebKit iPhone et Chromium hors ligne), v0.28.1 publiée.
- Corrigé à la revue : textes du formulaire anonymisés avant envoi à l'IA ; onglet des volets sans clignotement, minuteur nettoyé ; bilan marche / équilibre en dictée seule masqué de l'onglet Bilans ; marge latérale commune et CSS mort supprimé ; CI : dépendances système installées à part.
- En attente : antécédents en deux parties dans la fiche, carnet des médecins (idées dans deferred-work.md) ; partage des prompts via le dépôt ; autres tests standardisés.
- Prochaine étape : essayer v0.28.1 sur iPhone (bilan marche / équilibre dicté de bout en bout, onglets, copie dans le dossier).

## 2026-10-08 — Claude · local
- Livré : v0.16.0 à v0.21.1 — bouton « Copier » du pointage du jour (format TXT), triangle rapproché du bord et bord GRP épais, « Attend une séance » avec « ! » rouge (Dexie v5), prescription (intitulé, date, durée semaines/mois/ans, date seule = 1 an, fin calculée, pastille « Ordo » orange/rouge ; Dexie v6 et v7), « Tout copier » les bilans d'un patient, boutons Min/Max de la grille Tinetti, prompt Tinetti qui comprend les cotations directes et les consignes globales (« tout est bon »).
- Tests : npm test 84/84, lint, build, Playwright 18/18 en local ; CI GitHub verte (v0.19.0 non taguée, run annulé par la file Pages). Prompt Tinetti non essayé en réel (pas de clé sur le Mac).
- Corrigé à la revue : fin de prescription recalculée à la restauration d'une sauvegarde ; tests e2e de dictée rendus indépendants de macOS.
- En attente : ancien bug du bilan sous le nom non reproductible (fiche Notion laissée ouverte) ; partage des prompts via le dépôt ; piste Jev ; autres tests standardisés.
- Prochaine étape : vérifier v0.21.1 sur iPhone (dictée « tout est bon » / « item 3 score 1 », Min/Max, prescription datée seule, Copier du jour, Tout copier).

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
