# Ma tournée EHPAD — règles communes

Source de vérité pour Codex et Claude Code. `CLAUDE.md` importe ce fichier afin que les deux outils travaillent avec les mêmes règles.

## Projet et commandes

PWA iPhone-first destinée à préparer et tracer une tournée personnelle de kinésithérapie en EHPAD. Elle fonctionne sans compte ni serveur : les patients, journées, notes et ordres restent dans IndexedDB sur l’appareil.

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
- `bmad-cy/src/storage/database.ts` : schéma Dexie/IndexedDB.
- `bmad-cy/src/storage/repository.ts` : accès aux patients, journées et traces.
- `bmad-cy/src/features/journee/` : tournée quotidienne, ordre, pointage et notes.
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
- Un patient archivé ou supprimé ne doit plus apparaître dans les tournées actuelles ou futures.
- Les quatre patients du premier lancement sont explicitement fictifs et ne doivent être injectés qu’une seule fois.
- L’absence de réseau ne doit pas empêcher de rouvrir l’application après un premier chargement complet ni d’utiliser les fonctions locales.

## Données et sécurité

- Ne jamais ajouter au dépôt de vrais noms de patients, exports réels, données de santé, identifiants ou secrets.
- Toute fixture ou capture doit être manifestement fictive.
- Avant une première publication publique, contrôler tous les fichiers suivis et l’historique Git pour détecter données patient, exports, captures et secrets.
- Ne pas ajouter de synchronisation, télémétrie, analytics ou service cloud sans demande explicite.
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

- Exception au bloc commun : ce projet n'a pas encore de branche `dev` ; `main` contient les versions testables et déclenche `.github/workflows/ci-pages.yml`.
- Le workflow vérifie tests, lint et build avant de publier `bmad-cy/dist` sur GitHub Pages.
- Ne jamais committer `node_modules/`, `dist/`, les rapports Playwright, les fichiers `.env` ou des exports patients.
- Utiliser des commits conventionnels et des tags `vX.Y.Z` pour les versions testables.
- Ne pousser et ne publier qu’après réussite des vérifications adaptées au changement.
- Pour une release : mettre à jour `package.json` et son lockfile, valider le projet, committer la version, pousser `main`, attendre la CI verte, taguer ce commit exact, pousser le tag, puis contrôler l’URL Pages.

## Règles communes (catalogue WORKFLOW)

- **Instructions** : ce fichier est l'unique source des règles ; `CLAUDE.md` se limite à `@AGENTS.md`. Ne jamais dupliquer une règle ailleurs.
- **Comptes et services** : voir `ACCOUNTS.md` (GitHub, hébergement, base de données, API, emplacement des secrets). Le mettre à jour dès qu'un compte, un service ou un secret change. Aucune valeur secrète dedans.
- **Avant de coder** : pour une demande non triviale, reformuler ce qui a été compris et poser les questions utiles avant de coder.
- **Git** : développer sur `dev` (commit et push selon les règles du projet ci-dessus). `main` ne reçoit `dev` que sur demande explicite. Pas de pull request. Ne jamais réécrire l'historique de `dev` ou `main`.
- **Trace de l'agent** : terminer chaque message de commit par une ligne `Agent: Claude` ou `Agent: Codex`, selon l'agent qui a réellement fait le travail.
- **GitHub** : le compte est fixé par la configuration git (voir `ACCOUNTS.md`). Ne pas utiliser `gh auth switch` ; en cas d'erreur d'accès, le signaler.
- **Notification de fin** : si la tâche a demandé plus de 2 minutes, lancer juste avant la réponse finale `tg-notify "<résumé en quelques phrases>"`, ou `tg-notify --bloque "<raison>"` en cas de blocage après un travail significatif. Le script détecte l'agent et choisit le bon bot. Une seule notification par tâche, sans donnée sensible. Si l'envoi échoue, le signaler sans considérer la tâche comme échouée. (Chemin complet si besoin : `/opt/homebrew/bin/tg-notify` ; absent dans les environnements cloud : ne rien envoyer.)
- **Revue de code** (demande « revue », sans PR) : examiner en lecture seule les commits déjà poussés sur `dev` depuis le tag `revue-ok` (à défaut depuis `origin/main`), ou le commit / la plage indiqués. Rendre : résumé des fonctionnalités couvertes, problèmes classés par gravité avec `fichier:ligne` et correction proposée, plan de correction. Ne rien corriger sans accord.
- **Clôture** (demande « clôture », une fois les corrections validées et poussées) : déplacer le tag `revue-ok` sur `origin/dev` (`git tag -f revue-ok origin/dev`, `git push origin :refs/tags/revue-ok`, `git push origin revue-ok`), faire un récapitulatif et envoyer la notification. Si l'environnement (cloud) ne peut pas pousser le tag, donner ces commandes à lancer en local.
- Maintenir ce fichier quand les commandes, l'architecture, les invariants ou le déploiement évoluent.
