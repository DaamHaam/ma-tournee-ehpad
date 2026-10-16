# Bilan unifié à deux volets — prêt à implémenter

Décidé avec l’utilisateur le 2026-10-12, après la v0.32.0. Le bilan libre, qui reconnaît très bien les tests standardisés, devient la base de tous les bilans : un seul bilan général en deux volets que l’on fait glisser, « Bilan » (on dicte et on écrit) et « Repères » (on consulte et on coche). Il remplacera à terme le bilan marche / équilibre à trois volets (Formulaire · Dictée · Résultat), où l’on ne revenait plus à la dictée une fois le résultat obtenu.

Seule dépendance ouverte : le catalogue vient de la base **Convex** de l’organisateur de bilans (voir « Catalogue »). L’utilisateur transmettra ce qui est déjà décidé dans l’autre projet ; en attendant, tout le reste est arrêté.

## Volet 1 — Bilan (le cœur)

- Un seul texte, celui du bilan libre actuel (`entry.bilan` / `bilanHtml`) : on y dicte et on y écrit, y compris dans le texte rendu par l’IA, à n’importe quel endroit (la dictée s’insère au curseur, comme aujourd’hui).
- ✨ **Mettre en forme** : une seule requête, la même au premier passage et aux suivants (pas de prompt spécial « relance »). Elle reçoit le texte actuel tel qu’il est (dicté, écrit, déjà mis en forme), les lignes des items cochés fabriquées par l’application et le titre choisi ; elle réécrit le texte en place et renvoie les mesures des tests standardisés (panneau « Tests reconnus » actuel : ★ précédente, ✎, rien n’est rangé sans validation).
- Voyant : ✨ passe à l’orange (« mise en forme à refaire ») dès qu’on dicte, écrit, coche ou décoche après une mise en forme. Conseil affiché une fois : tout cocher avant ✨.
- ↶ revient au texte d’avant la dernière mise en forme ; à l’écran, les lignes réécrites ou ajoutées par l’IA sont en violet (jamais dans la copie).
- Un ajout mal placé par l’IA n’est pas grave : le texte reste retouchable.
- Sans réseau ni clé : **Insérer les cochés** ajoute les lignes fabriquées par l’application, sans IA.
- Quitter (‹) garde tout tel quel ; ✕ remet le bilan comme à l’ouverture (texte, cases, mesures).

### Ajouts du 2026-10-15 (retour d’usage en dictée seule)

- **Deux niveaux d’IA**, proposés aussi en dictée seule : **Corriger** (léger : orthographe, ponctuation, accords, civilités ; garde l’ordre et les mots dictés, ne reprend aucune case, repère quand même les tests) et **✨ Mettre en forme** (complet : range dans les sections, fusionne avec les cases cochées, réorganise les idées). Les deux écrivent dans le même texte, retouchable et copiable ; ↶ annule l’un comme l’autre.
- **Titre** : aucun par défaut (confirmé).
- **Règles du prompt de mise en forme** : la dictée prime, les cases n’inspirent que l’ordre et ne remplacent ni ne résument ce qui est dicté ; tout ce qui est mesuré, chiffré ou observé (essais, durées, niveau d’aide, déroulé d’un transfert) relève de l’évaluation, jamais du Traitement ; chaque phrase dictée se retrouve dans le résultat avec ses nuances, seuls les parasites de transcription sont écartés ; plusieurs essais d’un test : le meilleur est le score (historique, ★), les autres restent écrits dans le texte.
- **Repères** : chaque test standardisé a un « Autre » en plus de sa valeur ; option « afficher d’un coup les tests déjà réalisés (★) ». Les ★ orange (non transmis) sont déjà livrés en v0.33.0.
- Le catalogue viendra de l’arbre général de l’organisateur de bilans (Convex) : attendre qu’il soit poussé et rempli avant l’étape 1.

## Volet 2 — Repères (tout sous les yeux)

- **Titre** en tête : aucun (bilan simple, par défaut) ou un titre du catalogue (« Évaluation kiné marche / équilibre »…).
- Les modules du catalogue (aujourd’hui ceux du bilan marche / équilibre : Contexte, Examen, Transferts, Marche, Équilibre, Objectifs, Traitement), onglets collants pour y sauter, compteurs, ★ des choix du dernier bilan, « Autre » par rubrique.
- Tests standardisés avec leur ★ (historique commun) et leur chronomètre ⏱.
- Filtre « seulement ce qui est coché » pour relire.
- Le micro reste accessible depuis ce volet : la dictée va toujours dans le texte du volet 1, on parle en regardant les items.
- **Tinetti** : bouton « Ouvrir le Tinetti » vers son écran actuel (peu utilisé) ; la grille reste rangée à part (`tests.tinetti`) pour la comparaison item par item, seul son score revient dans le texte comme une ligne fabriquée.
- Les cases restent cochées après la mise en forme (trace de ce qui a été dit) ; cocher ou décocher ensuite signifie refaire un tour d’IA, qui ajoute ou retire l’élément.

## IA

- Les lignes des items cochés sont fabriquées par l’application dans la présentation habituelle (ordre fixe du catalogue, libellés, « Timed Up and Go : 18sec », cf. `rubricLine` de `domain/marcheEquilibre.ts`). L’IA les reçoit pour adapter le reste du texte et les fusionne avec ce qui est dicté, au bon endroit, comme le Résultat actuel du bilan marche / équilibre.
- Prompt unique « Mise en forme du bilan » dans `prompts.ts`, issu des prompts actuels : correction + repérage des tests (`correction`) et règles du bilan flexible (`marcheEquilibre` : la dictée prime sur le libellé des options, « Autre », civilités Mr / Mme, jamais de nom ni `[patient]`, mise en forme <b> <i> <u> gardée). Règles en plus : ne rien supprimer du texte existant hors éléments décochés, placer chaque ajout dans la bonne section, garder le titre choisi en tête.
- Entrée JSON : `patient` (sexe en mot), `titre`, `coches` (lignes fabriquées), `decoches` (lignes d’items décochés depuis la dernière mise en forme), `texte` (anonymisé), `tests` (catalogue des tests). Sortie : `{ texte, mesures, cocher, tinetti }` comme `parseCorrectionReply` aujourd’hui.
- Anonymisation, une seule requête par demande, clé et modèle des Réglages : règles actuelles inchangées (voir « Données et sécurité » d’`AGENTS.md`).

## Copie

- Bilan avec titre : copie actuelle du bilan marche / équilibre (bloc à chasse fixe, texte brut en CRLF).
- Bilan sans titre : copie simple du bilan libre.
- Copier marque copié et coche la transmission du jour (règle actuelle du bilan libre).

## Données

- Texte : `entry.bilan` / `bilanHtml` (inchangé) ; un ancien bilan libre est un bilan unifié sans case cochée.
- À côté : `entry.bilanForm = { title?, choices, values }` (mêmes clés que le catalogue, rang des options stable) et `entry.bilanAi = { formattedAt, inputs }` (empreinte du texte et des cases au dernier passage, pour le voyant ; cases cochées lors de ce passage, pour calculer les « décochés »), `bilanMeasures` (inchangé).
- Champs facultatifs : pas de nouvelle version Dexie (pas d’index), sauvegarde JSON v1 relue avec validation des nouveaux champs, anciennes sauvegardes acceptées.
- Les anciens bilans marche / équilibre et Tinetti restent lisibles, copiables et dans l’historique des ★.

## Catalogue (Convex)

- Source : base Convex partagée, éditée par l’organisateur de bilans, lue par Ma tournée EHPAD et BMAD LSV2. Elle ne contient que la structure des bilans (modules, rubriques, options, tests, titres, prompts), jamais de donnée patient.
- L’application en garde une copie locale (IndexedDB) : elle démarre et fonctionne hors ligne avec la dernière version reçue ; le catalogue actuel en code sert de version initiale.
- Identifiants stables : une option n’est jamais renumérotée ni retirée (les choix enregistrés sont `clé.rang`) ; une version de catalogue est notée dans le bilan pour relire un ancien bilan avec le catalogue de son époque.
- À recevoir de l’utilisateur : schéma Convex déjà décidé dans l’autre projet, URL de déploiement, mode d’accès en lecture (renseigner `ACCOUNTS.md`, sans secret).

## Étapes

1. Bilan à deux volets sur le catalogue actuel en code (adapté pour pouvoir être remplacé par la copie locale du catalogue Convex) : volets, Titre, Repères, ✨ Mettre en forme, voyant, ↶, Insérer les cochés, Tests reconnus, copie selon le titre.
2. Bouton Tinetti dans les Repères ; dans le choix « + », « Bilan » remplace « Bilan libre » et « Bilan marche / équilibre » (ce dernier reste consultable pour ses anciens bilans).
3. Lecture du catalogue Convex avec copie locale, dès que le schéma est transmis.

## Vérifications

`npm test` (fabrication des lignes, calcul des décochés, voyant, lecture de la réponse), `npm run lint`, `npm run build`, `npm run test:e2e` (parcours : cocher, dicter, mettre en forme, redicter au milieu, relancer, ↶, mesures, copie avec et sans titre, hors ligne « Insérer les cochés »), puis essai sur iPhone avec le vrai modèle.
