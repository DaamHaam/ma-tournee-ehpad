# Dictée des bilans via OpenRouter — lot 1 (v0.10.0)

## Objectif

Dicter le bilan du jour avec une transcription de meilleure qualité que le micro du clavier, en appelant directement l’API OpenRouter depuis l’iPhone. Ce lot couvre la dictée seule ; la mise en forme et l’extraction de données structurées par un autre modèle viendront ensuite.

## Comportement

- « + » sur une carte de la Journée ouvre le bilan en plein écran (`#/bilan/<date>/<id>`), sans barre de navigation ; « ‹ Journée » ramène à la même date.
- Le texte dicté occupe l’écran ; le bouton micro est en bas. Un appui démarre, un second arrête ; arrêt automatique à 5 minutes.
- La transcription est insérée à la position du curseur (ou à la place de la sélection), avec les espaces nécessaires ; le curseur se place après le texte inséré pour enchaîner les dictées.
- Pas de clé ou pas de réseau : le micro est désactivé avec un message, le micro du clavier reste disponible.
- Échec de transcription : message clair, « Réessayer la transcription » ou « Abandonner ». L’audio reste en mémoire jusque-là, jamais écrit sur l’appareil.
- Le micro n’existe que dans le bilan (ni notes patient, ni commentaire de journée).

## Réglages

- Carte « Dictée des bilans » dans Réglages : clé OpenRouter (champ masqué), modèle (`openai/whisper-large-v3` par défaut, `whisper-large-v3-turbo`, `whisper-1`), « Tester la clé » (`GET /api/v1/key`, sans audio), « Effacer ».
- La clé est stockée dans la table `settings` (clé `openrouterKey`) : pas de changement de schéma Dexie.
- La clé n’est jamais exportée dans la sauvegarde JSON ; une restauration conserve la clé de l’appareil et ignore toute clé présente dans un fichier. Le format de sauvegarde reste en version 1.

## Appel API

`POST https://openrouter.ai/api/v1/audio/transcriptions`, multipart au format OpenAI : `file` (`dictee.m4a` depuis Safari, `webm` ailleurs), `model`, `language=fr`, en-tête `Authorization: Bearer <clé>`. La réponse `text` est insérée.

## Confidentialité

Seul l’audio part chez OpenRouter : aucun nom, identifiant ni donnée de la base n’est envoyé. L’utilisateur s’engage à ne prononcer aucun nom pendant la dictée.

## Tests

- Unitaires : insertion au curseur, extension audio, messages d’erreur, requête multipart simulée, clé exclue de la sauvegarde et conservée à la restauration.
- Playwright : bilan plein écran sans clé ; dictée avec micro et OpenRouter simulés (clé testée, insertion au curseur, enchaînement, clé absente du fichier de sauvegarde).
- Réel : sur iPhone avec la clé de l’utilisateur.
