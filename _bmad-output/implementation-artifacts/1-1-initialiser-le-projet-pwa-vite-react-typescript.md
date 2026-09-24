---
story_key: 1-1-initialiser-le-projet-pwa-vite-react-typescript
epic: 1
story: 1.1
title: Initialiser le projet PWA (Vite + React + TypeScript)
status: done
created_at: 2026-03-26
source_artifacts:
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/epics.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/architecture.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/prd.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/ux-design-specification.md
---

# Story 1.1: Initialiser le projet PWA (Vite + React + TypeScript)

## Contexte

Ce repo contient les artefacts BMAD (PRD/UX/Architecture/Epics). Le code applicatif doit vivre dans un sous-dossier `bmad-cy/` (ne pas déplacer/supprimer `_bmad-output/*`).

Stack validée (architecture):
- `Vite + React + TypeScript` en PWA iPhone-first
- `npm` + `package-lock.json`
- TypeScript en mode `strict`

Cette story ne met PAS encore Tailwind/Dexie/PWA plugin en place. Elle crée uniquement la base de projet saine, compilable, et prête pour les stories suivantes.

## User Story

As a kinésithérapeute,
I want ouvrir une application qui démarre instantanément sur iPhone,
So that je puisse l’utiliser en tournée sans friction.

## Acceptance Criteria

**Given** un repo vide côté code applicatif et `npm` comme gestionnaire de paquets
**When** je scaffold le projet `Vite react-ts` et je lance le serveur de dev
**Then** l’application affiche une page de base sans erreur sur navigateur desktop et mobile
**And** TypeScript est activé en mode strict

## Portée (Do / Don’t)

Do:
- Créer le dossier `bmad-cy/` via `npm create vite@latest ... -- --template react-ts`
- Valider que `npm install` et `npm run dev` fonctionnent
- Activer `strict: true` dans `bmad-cy/tsconfig.json` (et corriger si le template a besoin d’ajustements mineurs)

Don’t:
- Ne pas ajouter Tailwind/Dexie/PWA/Vitest ici (stories suivantes)
- Ne pas changer les conventions d’arborescence BMAD

## Implémentation (checklist)

1. Scaffold:
```bash
npm create vite@latest bmad-cy -- --template react-ts
cd bmad-cy
npm install
```

2. TypeScript strict:
- Ouvrir `bmad-cy/tsconfig.json`
- Activer `compilerOptions.strict = true`

3. Smoke run:
```bash
npm run dev
```

4. Smoke build:
```bash
npm run build
```

## Notes d’architecture à respecter

- L’app sera une PWA en v1, mais on n’ajoute pas encore le plugin ici.
- On conservera une structure “par features” plus tard; pour l’instant le scaffold standard est ok.

## Définition of Done

- Le dossier `bmad-cy/` existe et contient un projet Vite React TS fonctionnel
- `strict` TypeScript est activé
- `npm run dev` et `npm run build` passent sans erreur

## Tasks/Subtasks

- [x] Scaffold Vite React TS dans `bmad-cy/`
- [x] Activer TypeScript `strict`
- [x] Smoke `npm run dev`
- [x] Smoke `npm run build`

## Dev Notes

- Ne pas modifier/supprimer `_bmad-output/*`.
- Pas de Tailwind/Dexie/PWA plugin/Vitest dans cette story.

## Dev Agent Record

### Implementation Plan

- Exécuter `npm create vite@latest bmad-cy -- --template react-ts`
- Installer les dépendances et activer `strict` dans `tsconfig.json`
- Vérifier `npm run dev` et `npm run build`

### Debug Log

- `npm install` affiche un warning `EBADENGINE` sur `eslint-visitor-keys@5.0.1` (Node v23.9.0 non liste dans les engines), mais l'installation, `dev` et `build` passent.
- `npm run dev` a ete lance une premiere fois sans TTY, donc arrete en tuant le PID qui ecoutait sur `127.0.0.1:5173`.

### Completion Notes

- Projet `bmad-cy/` cree via `npm create vite@latest ... --template react-ts`.
- TypeScript `strict` etait deja active dans `tsconfig.app.json` et `tsconfig.node.json` du template.
- Smoke tests: `npm run dev` et `npm run build` ok.

## File List

- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/package.json
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/package-lock.json
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/vite.config.ts
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/tsconfig.json
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/tsconfig.app.json
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/tsconfig.node.json
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/src/main.tsx
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/src/App.tsx
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/src/index.css

## Change Log

- 2026-03-26: initialisation story file format (Tasks/Record/Status)

## Status

done
