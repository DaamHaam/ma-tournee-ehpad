# Comptes et services — Ma tournée EHPAD

Carte des comptes utilisés par le projet. **Aucune valeur secrète ici** : seulement où la trouver.

## Code
- GitHub : compte `DaamHaam`, dépôt `DaamHaam/ma-tournee-ehpad`
- Branches : `main` seule (voir « Façon de travailler sur ce projet » dans `AGENTS.md`)
- Config git spécifique : aucune (compte par défaut)

## Hébergement
- GitHub Pages, publié par `.github/workflows/ci-pages.yml` à chaque push sur `main` (après tests, lint et build). URL : https://daamhaam.github.io/ma-tournee-ehpad/

## Base de données
- Données patients : aucune base distante, IndexedDB (Dexie) sur l'appareil. Sauvegarde JSON `ma-tournee-sauvegarde` exportée par l'utilisateur.
- Fiches de bilan (à venir) : base Convex partagée avec l'organisateur de bilans et BMAD LSV2, sans aucune donnée patient. Projet, URL de déploiement et clés : à renseigner quand l'utilisateur les transmet (jamais de valeur secrète ici).

## API et services externes
- OpenRouter (transcription des bilans dictés, modèle Whisper choisi dans les réglages ; assistant de rédaction, modèle d’analyse DeepSeek saisi dans les réglages, même clé) : clé personnelle saisie dans `Réglages` de l’app, stockée seulement sur l’iPhone (IndexedDB), exclue de la sauvegarde. Compte et plafond de crédit gérés sur openrouter.ai. Aucun secret OpenRouter côté GitHub.

## Outils des agents
- Notification : `tg-notify` en local ; secrets GitHub `TG_CLAUDE_TOKEN`, `TG_CODEX_TOKEN`, `TG_CHAT_ID` pour `.github/workflows/agents.yml` (clôtures et versions)

## À savoir
- Données de santé sur l'appareil uniquement ; jamais de vraies données dans Git.
