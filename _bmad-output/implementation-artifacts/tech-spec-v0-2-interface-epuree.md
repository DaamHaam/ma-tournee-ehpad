---
title: Version 0.2.0 — interface épurée et numéro de version
type: feature
created: 2026-09-24
status: done
baseline_commit: 55892b6
context:
  - ../planning-artifacts/ux-design-specification.md
  - tech-spec-premiere-tournee-utilisable.md
---

# Version 0.2.0 — interface épurée et numéro de version

## Intention

Demande de Damien pour la v0.2 : simplifier fortement l’interface, retirer les textes et bandeaux explicatifs non nécessaires, éviter les éléments impromptus, afficher un numéro de version pour suivre l’évolution et publier sur GitHub Pages.

## Périmètre

- Coque : suppression du bandeau « Ma tournée EHPAD » et de l’état « Enregistré sur cet appareil / Hors ligne ». Seul un échec d’écriture reste signalé, par un bandeau d’erreur court.
- Journée : suppression des titres « Journée » et « Ouvrir une date », des mentions de données d’essai, de l’explication de journée passée et de l’aide de réorganisation. La date reste seule en titre ; toucher la date ouvre le sélecteur natif. Le bouton « Aujourd’hui » n’apparaît que hors de la date du jour. Placeholders courts (« Note », « Commentaire »), titre « Ressenti de la journée » retiré.
- Patients : suppression de « Base locale », des étiquettes « Fictif » et de « Chambre non renseignée ».
- Fiche patient : suppression de « Identité utile », de l’aide d’enregistrement, du titre « Historique » et du compteur de traces, de « Gestion de la fiche » et des explications d’archivage. La liste des séances et notes n’apparaît que si elle n’est pas vide.
- Réglages / Export : suppression de « Données locales » et du bloc « Sur cet appareil » ; l’aperçu vide n’est plus affiché.
- Version : `package.json` passe à `0.2.0`, injectée au build (`__APP_VERSION__`) et affichée en bas de Réglages / Export.

Hors périmètre, reporté dans `deferred-work.md` : import d’une base initiale de patients (dates de prescription, etc.) et choix du stockage.

## Invariants conservés

Aucune modification du schéma Dexie, du format TXT, des règles A/B et H, des snapshots ou du hors ligne. Les patients fictifs restent créés une seule fois et marqués `demo` en base ; seule leur mention visible disparaît, à la demande de Damien.

## Critères d’acceptation

- Étant donné l’écran Journée, quand il s’ouvre, alors seuls la date, L/J/V, la liste, H et le commentaire sont visibles, sans bandeau ni texte sur le stockage ou les données d’essai.
- Étant donné une fiche patient, quand elle s’ouvre, alors les libellés « Identité utile », « Historique », « trace », « Gestion de la fiche » et les explications d’archivage sont absents, et les actions Archiver/Supprimer restent disponibles.
- Étant donné Réglages / Export, quand la page s’affiche, alors « Version 0.2.0 » est visible.
- Étant donné une écriture locale en échec, quand elle survient, alors un bandeau d’erreur reste affiché.

## Vérification

- `npm test` : 10/10.
- `npm run lint` : réussi.
- `npm run build` : réussi, 8 ressources précachées.
- `npm run test:e2e` : 2/2 ; le parcours WebKit iPhone vérifie l’absence des textes retirés et la présence de la version.
- Contrôle visuel à 375 px de Journée, Patients, fiche et Réglages / Export sur la build de production.
