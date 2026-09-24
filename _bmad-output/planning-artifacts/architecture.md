---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
inputDocuments:
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/prd.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/product-brief-BMAD CY-2026-03-20.md
workflowType: 'architecture'
project_name: 'BMAD CY'
user_name: 'Damien'
date: '2026-03-26'
lastStep: 8
status: 'complete'
completedAt: '2026-03-26'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Le produit s’articule autour d’un cockpit `Journée`, d’une gestion locale des patients, et d’un export par période. Les interactions critiques sont le pointage immédiat, la prise de note légère, l’édition directe de la fiche patient et la génération d’un TXT compact.

Architecturalement, cela implique:
- une modélisation locale claire des patients, journées, ordres par sous-jour, notes, transmission et exports
- une séparation entre socle patient durable et données journalières plus temporaires
- une logique d’autosave quasi systématique
- une génération déterministe d’exports TXT à partir des données locales

**Non-Functional Requirements:**
Les NFR les plus structurants sont:
- fonctionnement 100 % local
- usage hors ligne
- aucune perte acceptable sur les données validées
- réactivité immédiate des actions critiques
- architecture simple à maintenir
- structure suffisamment séparée pour permettre des extensions futures
- documentation claire de la structure

**Scale & Complexity:**
- Primary domain: mobile local-first PWA
- Complexity level: medium
- Estimated architectural components: 6 à 9 composants principaux

### Technical Constraints & Dependencies

Contraintes confirmées:
- v1 en PWA Safari sur iPhone
- pas de backend en v1
- stockage local simple privilégié
- sauvegarde immédiate pour les interactions critiques
- sauvegarde de l’ordre au lâcher de ligne
- plusieurs mois sélectionnables pour les exports
- import/export du socle patient pour migration future
- simple texte brut pour les notes et antécédents en v1

Contraintes d’évolution:
- futurs bilans à anticiper dès maintenant dans le modèle
- future timeline patient à anticiper dès maintenant
- possibilité future d’envoi mail et d’autres extensions, sans les implémenter en v1

### Cross-Cutting Concerns Identified

- robustesse réelle du stockage local en environnement PWA iPhone
- versionnage et migration du schéma de données
- séparation stricte entre séance, transmission, note du jour et données patient
- maintien d’un modèle assez simple pour la v1 mais assez propre pour accueillir bilans et historique enrichi
- stratégie de suppression/purge manuelle sans casser la base patient
- export TXT compact conservant les traces passées même si les données actives évoluent

## Starter Template Evaluation

### Primary Technology Domain

PWA iPhone-first (Safari) avec stockage local, sans backend en v1.

### Starter Options Considered

- **Vite + React + TypeScript (SPA/PWA)**: base minimale, rapide, adaptée à un produit local-first sans SSR.
- **Next.js (App Router)**: trop structurant et plus lourd pour une v1 PWA solo/offline, surtout sans besoins SSR/SEO.
- **React Native/Expo**: plus robuste côté storage/OS mais hors direction v1 (PWA) validée.

### Selected Starter: Vite (`create-vite`) + React + TypeScript

**Rationale for Selection:**
- correspond exactement à la stratégie v1 PWA (pas de serveur, pas de SSR)
- simple à maintenir, peu de magie
- compatible avec Tailwind et un design sobre/dense
- compatible IndexedDB (Dexie) et une architecture offline-first
- facilite des tests unitaires Vite-native (Vitest)

**Initialization Command:**

```bash
# Scaffold
npm create vite@latest bmad-cy -- --template react-ts
cd bmad-cy
npm install

# Routing
npm install react-router-dom

# Local database (IndexedDB)
npm install dexie

# PWA
npm install -D vite-plugin-pwa

# Tailwind CSS (via PostCSS)
npm install tailwindcss @tailwindcss/postcss postcss

# Unit testing
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

**Architectural Decisions Provided by Starter (and immediate follow-ups):**

**Language & Runtime:**
- TypeScript + React.
- Activer `strict` dans `tsconfig` (préférence validée).

**Styling Solution:**
- Tailwind CSS, palette sobre, usage dense et utilitaire.

**Build Tooling:**
- Vite (SPA) + plugin PWA (service worker + manifest).

**Testing Framework:**
- Vitest (tests unitaires), DOM simulé via `jsdom`.

**Code Organization:**
- Architecture “séparée mais simple”:
  - UI par fonctionnalités (`journee`, `patients`, `exports`, `settings`)
  - couches communes (`domain`, `storage`, `utils`)
  - module export/import dédié (format stable et versionnable)

**Development Experience:**
- Démarrage rapide et itératif.
- Les ajouts Tailwind/PWA/Dexie/Vitest doivent être des stories distinctes et testées.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Local DB**: IndexedDB via Dexie (source of truth).
- **Schema versioning + migrations**: activés dès le début (Dexie versions).
- **Data model**: données patient durables + journaux quotidiens séparés + ordre par sous-jour + timeline patient anticipée.
- **Exports**: module dédié, format TXT stable et testable.
- **No backend v1**: tout est local, offline-first.

**Important Decisions (Shape Architecture):**
- **Frontend state**: React state + hooks, sans store externe; lecture DB réactive via hooks dédiés.
- **Routing**: simple (3 onglets) + routes détail patient.
- **Validation**: validation runtime sur import/export et modèles persistés (lib type Zod).
- **Testing**: tests unitaires ciblés (Vitest).

**Deferred Decisions (Post-MVP):**
- Verrouillage app (code/biométrie).
- Envoi mail intégré (partage système suffit en v1).
- Backend / sync / comptes.

### Data Architecture

**Database choice:**
- IndexedDB via Dexie.

**Data modeling approach (clean, normalized):**
- Tables principales (v1):
  - `patients` (données durables)
  - `dailyRecords` (un enregistrement par date réelle)
  - `dailyPatientNotes` (note du jour par patient, liée à une date)
  - `dayOrder` (ordre + séparateurs par sous-jour `lundi/jeudi/vendredi` ou par date selon besoin)
  - `timelineEntries` (timeline patient, anticipée: notes du jour + bilans futurs)
  - `assessments` (bilans futurs, entité séparée)

**Validation strategy:**
- Validation runtime à l’entrée/sortie:
  - import/export tableau patient
  - import/export TXT
  - migrations de schéma si besoin

**Migration approach:**
- Versionnage Dexie dès v1 avec fonctions `upgrade` (migrations transparentes).
- Compatibilité ascendante des exports (TXT stable + tableau patient versionné).

**Caching strategy:**
- Pas de cache complexe: le dataset est petit; lecture directe depuis IndexedDB.

### Authentication & Security

**Authentication/Authorization:**
- Aucun mécanisme d’auth en v1 (usage solo, local).

**Security stance (v1):**
- Données locales uniquement; on s’appuie sur la sécurité de l’iPhone.
- Les exports sont toujours déclenchés manuellement (pas d’envoi automatique).
- Le verrouillage app-level est reporté post-MVP.

### API & Communication Patterns

**Backend/API:**
- Aucun backend en v1.

**Internal module boundaries:**
- `storage` (Dexie) expose des fonctions de lecture/écriture.
- `domain` contient les règles métier (A/B exclusif, reset jour, encodage TXT, seuils transmission).
- `exports` fournit des fonctions pures (données -> TXT / tableau patient).
- `ui` consomme `domain` + `storage` via hooks.

**Error handling:**
- Erreurs gérées au niveau UI avec messages sobres; logs dev en console uniquement.

### Frontend Architecture

**State management:**
- React state + hooks.
- Les écrans lisent l’état depuis la DB via hooks dédiés (ex: “live queries” Dexie) et appliquent les mutations via services.

**Routing strategy (simple):**
- Routes principales:
  - `/` (Journée)
  - `/patients` (liste)
  - `/settings` (exports/import)
  - `/patients/:patientId` (fiche patient)

**Performance:**
- Priorité à la fluidité du cockpit `Journée`.
- Sauvegardes immédiates pour pointage/notes; ordre persisté au “drop” (lâcher de ligne).

### Infrastructure & Deployment

**Hosting strategy:**
- Hébergement statique (Vercel/Netlify/GitHub Pages), sans contrainte serveur.

**CI/CD:**
- GitHub Actions minimal: install, test unitaire, build.

**Environment configuration:**
- Très peu de variables; aucune clé secrète en v1.

### Decision Impact Analysis

**Implementation sequence:**
- scaffolding Vite + routing + Tailwind
- stockage Dexie + schéma + migrations
- domain rules (A/B, H, exports, transmission colors)
- UI cockpit Journée + fiche patient
- exports/import tableau patient

**Cross-component dependencies:**
- `exports` dépend de `domain` et des modèles (pas de UI).
- `ui` dépend de `domain` + `storage` (pas l’inverse).

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
- naming (tables/IDs/champs/date keys)
- structure (feature vs type, placement tests)
- formats (dates, day keys, export TXT)
- process (autosave, erreurs, loading)

### Naming Patterns

**Database Naming Conventions (Dexie/IndexedDB):**
- Tables: noms en anglais, pluriels, lowerCamel ou lower-case sans espaces: `patients`, `dailyRecords`, `dailyPatientNotes`, `dayOrderItems`, `timelineEntries`, `assessments`.
- Champs: `camelCase` partout, y compris persisté (pas de `snake_case` en DB).
- Clés:
  - `id` est une string stable.
  - `patientId`, `recordId`, etc. pour les FK.
- Génération d’IDs: utiliser `crypto.randomUUID()` (string) côté navigateur.

**Route Naming Conventions:**
- Routes: `/`, `/patients`, `/settings`, `/patients/:patientId`.
- Params: `:patientId` (camelCase).

**Code Naming Conventions:**
- Fichiers React: `PascalCase.tsx` pour composants, `camelCase.ts` pour utilitaires.
- Composants: `PascalCase`.
- Fonctions: `camelCase`.
- Constantes: `UPPER_SNAKE_CASE` uniquement pour constantes globales.

### Structure Patterns

**Project Organization (by feature):**
- `src/features/journee/*`
- `src/features/patients/*`
- `src/features/settings/*`
- `src/features/exports/*`
- `src/shared/*` (UI primitives, utils)
- `src/domain/*` (règles métier, types)
- `src/storage/*` (Dexie db + repositories)

**Tests placement:**
- tests unitaires co-localisés: `*.test.ts` / `*.test.tsx` à côté du module testé.

### Format Patterns

**Day key / date storage:**
- Stocker les dates de travail sous forme de `dayKey` string stable: `YYYY-MM-DD` (évite ambiguïtés timezone).
- Affichage UI: `DD/MM/YYYY`.

**Export TXT:**
- Le module d’export est purement fonctionnel (entrée = données; sortie = string).
- Le format TXT est considéré comme une API publique: ne change pas sans versionnage explicite.
- Clarification du format initial v1, validée par Damien le 2026-09-15 avant implémentation: les niveaux `H---`, `H--`, `H-`, `H`, `H+`, `H++`, `H+++` sont encodés respectivement par `---`, `--`, `-`, chaîne vide, `+`, `++`, `+++`. Aucun préfixe `H` n'est généré. Le commentaire général reste indépendant du niveau et est conservé. Le stockage distingue le neutre d'une absence de saisie. La ligne sans signes ni commentaire est omise; un commentaire seul est exporté seul.

**JSON/Import-Export Patient Table:**
- Champs en `camelCase`.
- Inclure un champ de version (ex: `schemaVersion`) dans le fichier import/export.

### Communication Patterns

**State update:**
- Mutations via services `domain` + `storage`, pas directement depuis composants UI.
- L’UI consomme des hooks de lecture DB (pattern “query hook”).

**No event bus v1:**
- Pas de système d’événements global; dataset petit, interactions simples.

### Process Patterns

**Autosave:**
- Pointage `A/B`, notes, `H` et commentaires: sauvegarde immédiate.
- Réorganisation: persistance au “drop” (lâcher de ligne).

**Error handling:**
- Une couche d’erreur unifiée pour la UI (messages sobres), logs dev en console.

**Loading states:**
- Écrans rapides: privilégier skeleton minimal ou états discrets; pas de spinners intrusifs.

### Enforcement Guidelines

**All AI Agents MUST:**
- respecter les `dayKey` en `YYYY-MM-DD` en stockage
- ne jamais modifier le format TXT sans versionnage
- garder `domain` et `storage` indépendants de la UI
- utiliser les conventions de naming ci-dessus

**Pattern Enforcement:**
- PR/story reviews: refuser les nouveaux patterns non documentés ici.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
bmad-cy/
  README.md
  package.json
  package-lock.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  index.html
  postcss.config.js
  tailwind.config.js

  public/
    icons/
    manifest.webmanifest

  .github/
    workflows/
      ci.yml

  src/
    main.tsx
    app/
      App.tsx
      routes.tsx
      tabShell.tsx

    features/
      journee/
        JourneePage.tsx
        components/
          DaySelector.tsx
          HSelector.tsx
          PatientRow.tsx
          PatientRowNoteDrawer.tsx
          Separators.tsx
        hooks/
          useJourneeDay.ts
          useDayOrder.ts
        services/
          journeeService.ts

      patients/
        PatientsPage.tsx
        PatientDetailPage.tsx
        components/
          PatientForm.tsx
          PatientFilters.tsx
          ArchiveActions.tsx
        hooks/
          usePatients.ts
          usePatient.ts
        services/
          patientService.ts

      settings/
        SettingsPage.tsx
        components/
          ExportTxtPanel.tsx
          ExportPatientTablePanel.tsx
          ImportPatientTablePanel.tsx
          PurgeDailyDataPanel.tsx

      exports/
        txt/
          formatTxtDay.ts
          formatTxtPeriod.ts
        patientTable/
          exportPatientTable.ts
          importPatientTable.ts
        index.ts

    domain/
      types/
        patient.ts
        day.ts
        transmission.ts
        timeline.ts
      rules/
        abExclusive.ts
        dayKey.ts
        transmissionColor.ts
        txtEncoding.ts
      index.ts

    storage/
      db.ts
      schema.ts
      migrations.ts
      repositories/
        patientRepo.ts
        dailyRepo.ts
        orderRepo.ts
        timelineRepo.ts
        assessmentRepo.ts
      hooks/
        useLiveQuery.ts

    shared/
      ui/
        Button.tsx
        Checkbox.tsx
        SegmentedControl.tsx
        TextArea.tsx
      utils/
        formatDate.ts
        invariant.ts
        sort.ts

    __tests__/
      domain/
      exports/
```

### Architectural Boundaries

**API Boundaries:**
- Aucun backend en v1.
- Les “API” sont des modules internes (`domain`, `storage`, `exports`) consommés par la UI.

**Component Boundaries:**
- `features/*` contient les pages et composants liés à un flux utilisateur.
- `shared/ui/*` contient des primitives UI sobres, sans logique métier.

**Service Boundaries:**
- `features/*/services/*` orchestre les use-cases (UI -> services -> repositories).
- `domain/*` contient les règles métier pures (pas d’accès DB, pas de UI).
- `storage/*` contient la persistance Dexie + repos (pas de UI).
- `exports/*` contient la génération TXT et les formats import/export (pur, testable).

**Data Boundaries:**
- La source of truth est IndexedDB (Dexie).
- `schema.ts` + `migrations.ts` sont les seuls endroits où le schéma DB est défini/évolue.

### Requirements to Structure Mapping

**Feature Mapping:**
- `Journée` (A/B, H, notes, ordre, séparateurs, transmission signal) -> `src/features/journee/*`
- `Patients` (liste, fiche, admin, archive/suppression) -> `src/features/patients/*`
- `Réglages / Export` (TXT période, import/export tableau, purge) -> `src/features/settings/*`
- Export TXT compact + encodage A/B (casse) -> `src/features/exports/txt/*` + `src/domain/rules/txtEncoding.ts`
- Import/export tableau patient -> `src/features/exports/patientTable/*` + validation dans `domain`

**Cross-Cutting Concerns:**
- `dayKey` (YYYY-MM-DD) -> `src/domain/rules/dayKey.ts`
- seuils couleur transmission -> `src/domain/rules/transmissionColor.ts`
- migrations -> `src/storage/migrations.ts`

### Integration Points

**Internal Communication:**
- UI appelle des services; services utilisent repos; repos manipulent Dexie; règles métier dans `domain`.

**External Integrations:**
- Partage iOS/PWA pour export (v1).

**Data Flow:**
- UI -> services -> repos -> Dexie (write)
- Dexie -> hooks live query -> UI (read)
- Dexie -> export module -> string TXT / tableau patient (export)

### File Organization Patterns

**Configuration Files:**
- `vite.config.ts` pour build/PWA.
- `schema.ts` / `migrations.ts` pour DB.

**Test Organization:**
- Tests unitaires co-localisés au besoin + tests “golden” d’export dans `src/__tests__/exports`.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Vite + React + TS + Tailwind + Dexie + PWA plugin + Vitest sont compatibles et cohérents avec une v1 PWA offline-first.
- Les choix “simple mais propre” (pas de backend, pas de store externe) collent au scope v1.

**Pattern Consistency:**
- Naming DB/JSON/Code en `camelCase` + `dayKey` ISO (`YYYY-MM-DD`) + export TXT stable: conventions unifiées.
- Autosave immédiat + persistance au “drop” pour l’ordre: comportements cohérents avec l’UX.

**Structure Alignment:**
- L’arborescence par feature + couches `domain/storage/exports` empêche les dépendances inversées et limite les conflits entre agents.

### Requirements Coverage Validation ✅

**Feature Coverage:**
- `Journée`, `Patients`, `Réglages/Export` couverts par `features/*` + `exports/*` + `domain/*`.
- Import/export socle patient + export TXT par période + purge manuelle: couverts par `exports/*` + `storage/*`.
- Anticipation bilans/timeline: tables et boundaries prévues.

**Non-Functional Requirements Coverage:**
- Offline/local-first: Dexie + PWA.
- Performance: dataset petit, queries directes, UI cockpit optimisée.
- Robustesse: autosave + migrations + format d’export stable.

### Implementation Readiness Validation ✅

**Decision Completeness:**
- Décisions critiques (stack, DB, modules, export stability) explicitées.

**Structure Completeness:**
- Arborescence et frontières documentées, mapping exigences -> dossiers.

**Pattern Completeness:**
- Conventions de noms, formats de dates, process autosave, limites de responsabilités.

### Gap Analysis Results

**Important (à traiter tôt dans l’implémentation):**
- Pinning/lock des versions: utiliser le lockfile comme source de vérité; éviter de hardcoder des numéros dans ce doc.
- Tests “golden” pour l’export TXT: indispensables pour garantir la stabilité du format.
- Migrations Dexie: écrire une première migration “no-op” pour valider le pipeline upgrade.

**Nice-to-have:**
- Documenter des tokens visuels concrets (tailles tactiles, espacements) si la UI varie trop entre itérations.


## Décisions de reprise — 2026-09-15

- Toute date passée explicitement ouverte est modifiable; aucun verrouillage automatique au lendemain.
- Historique patient: séances et notes ensemble, ordre antéchronologique.
- Transmission inconnue: gris et texte accessible; suivi actif des transmissions dans un jalon ultérieur.
- Les données fictives du premier essai sont identifiables et initialisées une seule fois. Une base vidée volontairement reste vide.
- La suppression retire la fiche patient; les traces quotidiennes gardent les identités figées nécessaires à l'export. L'archivage retire du flux actif, en conservant la fiche consultable.
- L'ordre journalier historique est figé indépendamment des modèles d'ordre L/J/V: une réorganisation ultérieure ne doit pas réécrire les anciens exports.
