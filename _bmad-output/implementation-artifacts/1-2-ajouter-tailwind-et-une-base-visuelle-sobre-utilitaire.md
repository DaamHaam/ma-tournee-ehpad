---
story_key: 1-2-ajouter-tailwind-et-une-base-visuelle-sobre-utilitaire
epic: 1
story: 1.2
title: Ajouter Tailwind et une base visuelle sobre/utilitaire
status: done
created_at: 2026-03-26
source_artifacts:
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/epics.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/architecture.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/ux-design-specification.md
---

# Story 1.2: Ajouter Tailwind et une base visuelle sobre/utilitaire

## Contexte

Le scaffold Vite/React/TS existe dans `bmad-cy/`. On ajoute Tailwind pour pouvoir construire une UI dense, lisible, orientee "utilitaire" (sans esthetique "grand public").

## User Story

As a kinesitherapeute,
I want une interface lisible et utilitaire,
So that je puisse lire et agir rapidement au pouce.

## Acceptance Criteria

**Given** l'application Vite/React existante
**When** Tailwind est installe et configure
**Then** la UI peut utiliser des classes Tailwind
**And** les couleurs et espacements par defaut restent sobres

## Portee (Do / Don't)

Do:
- Installer Tailwind et l'integration Vite
- Configurer l'import CSS Tailwind
- Mettre une base visuelle tres simple (placeholders), sobre

Don't:
- Pas de design system complet
- Pas de routing/onglets (story 1.3)

## Tasks/Subtasks

- [x] Installer Tailwind (`tailwindcss` + integration Vite)
- [x] Configurer `vite.config.ts` + CSS global
- [x] Remplacer la page template par une base sobre (placeholder)
- [x] Smoke `npm run dev` + `npm run build`

## Dev Notes

- Viser une UI lisible au pouce (cibles de tap simples), sans couleurs flashy.
- Garder l'app iPhone-first (max-width mobile par defaut).

## Dev Agent Record

### Implementation Plan

- Ajouter `tailwindcss` et `@tailwindcss/vite` en devDependencies
- Ajouter le plugin Tailwind dans `vite.config.ts`
- Remplacer `src/index.css` par un import Tailwind + quelques defaults sobres
- Simplifier `src/App.tsx` en placeholders tailwind (pas de logique)
- Verifier dev + build

### Debug Log

- `npm install -D tailwindcss @tailwindcss/vite` affiche le meme warning `EBADENGINE` (Node v23.9.0), mais `dev` et `build` passent.

### Completion Notes

- Tailwind v4 integre via le plugin Vite `@tailwindcss/vite`.
- CSS global simplifie et rendu sobre (fond clair, texte sombre, max-width mobile).
- Template Vite remplace par une page placeholder en classes Tailwind.

## File List

- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/package.json
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/package-lock.json
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/vite.config.ts
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/src/index.css
- /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/bmad-cy/src/App.tsx

## Change Log

- 2026-03-26: creation story file

## Status

done
