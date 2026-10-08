# Ma tournée EHPAD — règles communes

Source de vérité pour Codex et Claude Code. `CLAUDE.md` importe ce fichier afin que les deux outils travaillent avec les mêmes règles.

## Façon de travailler sur ce projet

- **Branche de travail** : `main` seule. On développe directement sur `main`, testé sur iPhone après publication. Ne pas créer de branche `dev` (une session cloud l'avait fait par erreur le 2026-10-01 ; branche supprimée). La revue part de `revue-ok` sur `main`.
- **Publication** : chaque push sur `main` lance `.github/workflows/ci-pages.yml` (tests, lint, build, Playwright) puis publie sur GitHub Pages.
- **Tags de version** : `vX.Y.Z` posés automatiquement par `.github/workflows/agents.yml` depuis `bmad-cy/package.json`, une fois la CI verte. Il suffit d'incrémenter la version et de pousser.
- **Particularités** : données de santé uniquement sur l'appareil ; vérification sur Safari/iPhone réel quand c'est possible.

## Projet et commandes

PWA iPhone-first destinée à préparer et tracer une tournée personnelle de kinésithérapie en EHPAD. Elle fonctionne sans compte ni serveur : les patients, journées, notes et ordres restent dans IndexedDB sur l’appareil. Seule exception : la dictée et l’assistant de rédaction facultatifs envoient l’audio et du texte anonymisé à OpenRouter (voir « Données et sécurité »).

Le dépôt se pilote depuis sa racine. Utiliser Node.js 22.12 ou une version ultérieure compatible avec `package.json`. Les commandes npm s’exécutent dans `bmad-cy/`.

Installation :

```bash
cd bmad-cy
npm ci
```

Lancement interactif :

```bash
cd bmad-cy
npm run dev
```

Pipeline de validation :

```bash
cd bmad-cy
npm test
npm run lint
npm run build
npm run test:e2e
```

- `npm run dev` : développement Vite ; le service worker n’y représente pas la production.
- `npm run build && npm run preview` : vérification locale de la PWA de production.
- `npm run test:e2e` : parcours iPhone WebKit et rechargement hors ligne Chromium.

## Architecture

- `bmad-cy/src/App.tsx` : coque, navigation et état global de sauvegarde.
- `bmad-cy/src/domain/model.ts` : types et règles métier pures.
- `bmad-cy/src/domain/tinetti.ts` : grille de Tinetti, score, interprétation et résultat à copier ; types communs des tests (`TestType`, `TestRecord`).
- `bmad-cy/src/domain/marcheEquilibre.ts` : bilan flexible marche / équilibre (sous-modules, rubriques, compte rendu mis en forme, ★ précédents).
- `bmad-cy/src/storage/database.ts` : schéma Dexie/IndexedDB.
- `bmad-cy/src/storage/repository.ts` : accès aux patients, journées et traces.
- `bmad-cy/src/features/journee/` : tournée quotidienne, ordre, pointage et notes.
- `bmad-cy/src/features/bilan/` : bilan du jour, test de Tinetti et bilan marche / équilibre (`MarcheEquilibrePage.tsx`) en plein écran, dictée OpenRouter, assistant de rédaction IA (`prompts.ts` : prompts par défaut, `assistant.ts` : anonymisation et lecture des réponses) et leurs réglages, onglet Bilans (copie, suppression).
- `bmad-cy/src/features/patients/` : liste, ajout, édition, historique, archivage et suppression.
- `bmad-cy/src/features/exports/` : génération et partage de l’export TXT.
- `bmad-cy/tests/` : parcours Playwright de production.
- `_bmad-output/planning-artifacts/` : PRD, architecture, UX et epics.
- `_bmad-output/implementation-artifacts/` : spécifications, suivi du sprint et travail différé.

## Invariants métier

- Les dates métier sont des dates locales au format `YYYY-MM-DD`, jamais des dates UTC dérivées susceptibles de changer de jour.
- A et B sont exclusifs pour un patient et une journée. L’export utilise une initiale majuscule pour A et minuscule pour B.
- Le niveau H va de `H---` à `H+++`. Seuls les signes sont exportés ; H neutre ou non renseigné n’ajoute rien.
- Une journée conserve son ordre et un snapshot minimal de l’identité des patients. Archiver ou supprimer un patient ne doit pas altérer les journées passées ni leurs exports.
- Un patient archivé ou supprimé ne doit plus apparaître dans les tournées actuelles ou futures, sauf le jour même s’il y a déjà une trace (séance, note ou bilan) : il reste alors affiché avec sa mention pour rester corrigeable.
- Consulter une journée passée ne la crée ni ne la modifie ; seule une saisie explicite l’enregistre.
- Un bilan est stocké en texte brut (`bilan`) et, s’il est mis en forme, en HTML restreint (`bilanHtml` : seulement `<b>`, `<i>`, `<u>`, `<br>`, toujours filtré par `sanitizeBilanHtml` avant affichage ou copie).
- Les tests standardisés (Tinetti d’abord) sont rangés dans `entries[id].tests[type]`, un par type et par jour ; leur score est calculé par l’application. Copier un test le marque copié et coche l’évaluation du jour de la copie.
- Le bilan marche / équilibre est un bilan flexible rangé comme un test (`tests.marcheEquilibre`) : choix multiples cochés dans `choices` (identifiant `clé.rang`, rang dans la liste du catalogue : ne jamais réordonner ni retirer une option, n’en ajouter qu’en fin de liste), textes, nombres et choix uniques dans `values`. Le compte rendu ne montre que les choix cochés et les champs remplis, dans l’ordre fixe du catalogue d’origine et avec sa mise en forme ; il se retouche avant copie, et toute modification du formulaire le régénère. Sa copie est enveloppée dans un bloc à chasse fixe, texte brut en CRLF. Les tests standardisés qu’il contient (TUG, 10 m, 6 min…) affichent ★ leur dernière mesure antérieure.
- Copier un bilan (onglet Bilans, historique ou page du bilan) le marque comme copié et coche la transmission du jour de la copie dans la fiche ; modifier le bilan retire la marque « copié », le supprimer ne décoche pas la transmission.
- L’import de patients conserve l’identifiant d’un patient déjà connu (même nom et prénom, sans tenir compte de la casse ni des accents).
- La prescription en cours (intitulé, date locale, durée en semaines, mois ou années, tous facultatifs) fixe la fin d’ordonnance : dès que la date est connue, `prescriptionEnd` est recalculée par `prescriptionEndDate` (`domain/model.ts`, durée absente = 1 an, fin de mois ramenée au dernier jour) et n’est plus saisissable ; sans date, elle reste saisie à la main. L’import ne touche ni l’intitulé, ni la date, ni la durée, et la fin calculée d’un patient reconnu l’emporte sur la fin importée. Surveillance : orange quand la fin tombe dans les 15 jours, rouge une fois dépassée.
- « Attend une séance » (`waiting`) est un réglage du patient, faux par défaut, non importé ; il affiche un « ! » rouge devant le nom (fiche, liste des patients, journée).
- Les quatre patients du premier lancement sont explicitement fictifs et ne doivent être injectés qu’une seule fois.
- L’absence de réseau ne doit pas empêcher de rouvrir l’application après un premier chargement complet ni d’utiliser les fonctions locales.

## Données et sécurité

- Ne jamais ajouter au dépôt de vrais noms de patients, exports réels, données de santé, identifiants ou secrets.
- Toute fixture ou capture doit être manifestement fictive.
- Avant une première publication publique, contrôler tous les fichiers suivis et l’historique Git pour détecter données patient, exports, captures et secrets.
- Ne pas ajouter de synchronisation, télémétrie, analytics ou service cloud sans demande explicite.
- Exception validée : la dictée des bilans appelle directement l’API OpenRouter depuis l’appareil (transcription Whisper). Elle reste facultative et désactivée tant qu’aucune clé n’est saisie ; l’application doit rester pleinement utilisable sans clé ni réseau (micro du clavier en repli). Seul l’audio est envoyé, jamais de nom ni de donnée de la base ; l’utilisateur ne prononce aucun nom.
- Exception validée : l’assistant de rédaction (synthèse d’un test, correction du bilan libre) envoie au modèle d’analyse choisi dans Réglages, via OpenRouter et la même clé, une seule requête par demande contenant uniquement la grille cochée, le texte dicté anonymisé (nom et prénom du patient remplacés par `[patient]`) et le sexe sous forme de mot. Jamais de nom, chambre ou identifiant. L’IA ne remplace jamais une cotation choisie par l’utilisateur ; principe commun à tous les bilans : elle cumule formulaire et dictée, remplit seule (sans validation) une ligne laissée vide que la dictée décrit (marquée ✨), et allume un voyant ⚠ en cas de conflit ou d’incertitude. Le score reste calculé par l’application ; le texte à copier reste consultable et retouchable.
- Les prompts par défaut sont dans `bmad-cy/src/features/bilan/prompts.ts` (un par type de bilan, avec ses propres règles) et c’est l’agent qui les fait évoluer. Une modification faite dans Réglages reste sur l’iPhone et est transitoire : elle s’efface dès qu’une mise à jour change le prompt par défaut (empreinte du défaut). Partage futur via des fichiers du dépôt : idée notée dans Notion.
- La clé OpenRouter est saisie dans les réglages et reste sur l’appareil : jamais dans le dépôt, le code, les tests (clés fictives seulement) ni la sauvegarde JSON ; une restauration ne la remplace pas (`PRIVATE_SETTINGS`).
- Une modification du schéma IndexedDB exige une version Dexie supérieure et une migration explicite préservant les données existantes.
- La sauvegarde JSON `ma-tournee-sauvegarde` est un format public versionné : toute évolution doit rester capable de restaurer les sauvegardes antérieures.
- L’application n’est ni un dossier patient partagé ni un dispositif médical. Conserver cette limite visible dans la documentation.

## Travail et validation

- Lire la spécification concernée et les documents BMAD avant une modification métier importante.
- Préserver les changements existants et ne pas élargir le périmètre sans demande.
- Extraire les règles métier testables hors des composants React.
- Toute modification fonctionnelle doit passer `npm test`, `npm run lint` et `npm run build`.
- Toute modification d’interface ou de comportement hors ligne doit aussi être vérifiée avec `npm run test:e2e` et, si possible, sur Safari/iPhone réel.
- Maintenir ce fichier lorsque les commandes, l’architecture, les invariants ou le déploiement évoluent.

## Git et déploiement

- `main` est la branche de travail et déclenche `.github/workflows/ci-pages.yml` (voir « Façon de travailler sur ce projet »).
- Le workflow vérifie tests, lint, build et parcours Playwright (WebKit iPhone et Chromium hors ligne) avant de publier `bmad-cy/dist` sur GitHub Pages.
- Ne jamais committer `node_modules/`, `dist/`, les rapports Playwright, les fichiers `.env` ou des exports patients.
- Utiliser des commits conventionnels ; les tags `vX.Y.Z` sont posés par GitHub (`agents.yml`).
- Ne pousser et ne publier qu’après réussite des vérifications adaptées au changement.
- Pour une release : mettre à jour `package.json` et son lockfile, valider le projet, committer la version, pousser `main`, puis contrôler l’URL Pages. GitHub tague le commit et notifie sur Telegram quand la CI est verte (alerte ⚠️ sinon).

## Règles communes (catalogue WORKFLOW)

- **Instructions** : ce fichier est l'unique source des règles ; `CLAUDE.md` se limite à `@AGENTS.md`. Ne jamais dupliquer une règle ailleurs. Les singularités du projet (branche, publication, versions) sont dans « Façon de travailler sur ce projet » et priment sur ce bloc.
- **Comptes et services** : voir `ACCOUNTS.md` (GitHub, hébergement, base de données, API, emplacement des secrets). Le mettre à jour dès qu'un compte, un service ou un secret change. Aucune valeur secrète dedans.
- **Avant de coder** : pour une demande non triviale, reformuler ce qui a été compris et poser les questions utiles avant de coder.
- **Git** : travailler sur la **branche de travail** déclarée plus haut, sans créer d'autre branche durable ni changer ce modèle sans demande explicite. Pas de pull request. Ne jamais réécrire l'historique de la branche de travail ou de `main`. En cloud, si l'outil impose une branche de session, fusionner le travail dans la branche de travail et la pousser avant de terminer.
- **Trace de l'agent** : terminer chaque message de commit par une ligne `Agent: Claude` ou `Agent: Codex`, selon l'agent qui a réellement fait le travail.
- **GitHub** : le compte est fixé par la configuration git (voir `ACCOUNTS.md`). Ne pas utiliser `gh auth switch` ; en cas d'erreur d'accès, le signaler.
- **Automatisations GitHub** (`.github/workflows/agents.yml`) : GitHub pose lui-même les tags (`revue-ok`, `vX.Y.Z`) et envoie les notifications Telegram de clôture et de version, ce qui fonctionne aussi depuis le cloud. Ne pas pousser ces tags soi-même : il suffit de pousser les commits.
- **Notification de fin** : si la tâche a demandé plus de 2 minutes, lancer juste avant la réponse finale `tg-notify "<résumé en quelques phrases>"`, ou `tg-notify --bloque "<raison>"` en cas de blocage après un travail significatif. Une seule notification par tâche, sans donnée sensible. Si l'envoi échoue, le signaler sans considérer la tâche comme échouée. (Chemin complet : `/opt/homebrew/bin/tg-notify`.) En cloud, `tg-notify` n'existe pas : ne rien envoyer, la clôture et les versions sont notifiées par GitHub.
- **Revue de code** (demande « revue », sans PR) : examiner en lecture seule les commits déjà poussés sur la branche de travail depuis le tag `revue-ok` (à défaut depuis `origin/main`), ou le commit / la plage indiqués. Rendre : résumé des fonctionnalités couvertes, problèmes classés par gravité avec `fichier:ligne` et correction proposée, plan de correction. Ne rien corriger sans accord.
- **Clôture** (demande « clôture » ou « fin de session », une fois les corrections validées et poussées) : ajouter en tête de `JOURNAL.md` (titre `# Journal des clôtures` s'il n'existe pas) une entrée courte, sans donnée sensible :
  ```
  ## AAAA-MM-JJ — Claude|Codex · local|cloud
  - Livré : <fonctionnalités revues et testées>
  - Tests : <vérifications lancées et résultat>
  - Corrigé à la revue : <corrections, ou « rien »>
  - En attente : <points reportés, ou « rien »>
  - Prochaine étape : <…>
  ```
  La commiter avec un message qui **commence par `Clôture`** (ex. `Clôture : journal`) et la pousser sur la branche de travail : l'Action GitHub déplace alors `revue-ok` sur ce commit et envoie l'entrée sur Telegram (pas de `tg-notify` en plus). Si le MCP Notion est disponible, mettre aussi à jour la ligne du projet dans la base Notion « État de reprise projets » (Branche, Dernier agent, Environnement, Dernier commit, Dernière session, Où on en est, Prochaine étape). Terminer par un récapitulatif et la ligne « ✅ CONVERSATION CLÔTURÉE — développé, testé, revu ».
- **Reprise** (premier message d'une conversation) : `git fetch origin --tags`, puis donner l'état en une ligne avant de traiter la demande : « ✅ Tout est clôturé (dernière entrée de `JOURNAL.md` : date, agent, prochaine étape) » si `revue-ok` et `origin/<branche de travail>` pointent le même commit, sinon « ⚠️ N commits poussés depuis la dernière clôture, non revus » avec leur liste courte (`git log --oneline revue-ok..origin/<branche de travail>`). Sans tag `revue-ok` : « Aucune clôture enregistrée ». Rappeler la branche de travail, signaler les modifications locales non commitées, puis ajouter la ligne : « Raccourcis : *réfléchis* (reformuler avant de coder) · *revue* (revue de code) · *clôture* ou *fin de session* (journal, tag, notification) · *initialise ce projet* (mise aux normes du workflow) ».
- Maintenir ce fichier quand les commandes, l'architecture, les invariants, la façon de travailler ou le déploiement évoluent.
