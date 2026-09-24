---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/prd.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/architecture.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/ux-design-specification.md
---

# BMAD CY - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for BMAD CY, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: L utilisateur peut ouvrir l application directement sur l onglet `Journee`.
FR2: L utilisateur peut voir la date reelle associee au sous-jour actuellement consulte.
FR3: L utilisateur peut acceder a des sous-jours distincts correspondant a `lundi`, `jeudi` et `vendredi`.
FR4: L utilisateur peut voir la liste complete des patients dans chaque sous-jour.
FR5: L utilisateur peut utiliser un ordre de patients different pour chaque sous-jour.
FR6: L utilisateur peut reorganiser l ordre des patients au sein de chaque sous-jour.
FR7: L utilisateur peut conserver de maniere persistante l ordre defini pour chaque sous-jour.
FR8: L utilisateur peut utiliser trois separateurs visuels distincts dans chaque sous-jour.
FR9: L utilisateur peut deplacer les separateurs au sein de chaque sous-jour.
FR10: L utilisateur peut conserver de maniere persistante la position des separateurs dans chaque sous-jour.
FR11: L utilisateur peut voir tous les patients, y compris ceux non prevus ce jour-la, afin de gerer les exceptions.
FR12: L utilisateur peut basculer manuellement entre les sous-jours, y compris hors du jour reel de presence.
FR13: L utilisateur peut marquer un patient comme vu selon la modalite `A`.
FR14: L utilisateur peut marquer un patient comme vu selon la modalite `B`.
FR15: L utilisateur ne peut attribuer qu une seule modalite `A` ou `B` par patient et par jour.
FR16: L utilisateur peut decocher une modalite deja selectionnee pour corriger une erreur.
FR17: Le systeme considere qu un patient non coche n a pas ete vu ce jour-la.
FR18: L utilisateur peut saisir une note du jour specifique a un patient depuis la vue `Journee`.
FR19: L utilisateur peut saisir une note patient meme si aucune seance n a ete pointee.
FR20: L utilisateur peut renseigner un indicateur global `H` pour une journee parmi `H---`, `H--`, `H-`, `H`, `H+`, `H++`, `H+++`. Le neutre est distinct d une absence de saisie.
FR21: L utilisateur peut renseigner un commentaire general de journee.
FR22: Le systeme reinitialise les donnees quotidiennes d un nouveau jour sans reutiliser les valeurs de la veille.
FR23: Le systeme conserve les donnees journalieres passees pour consultation et export tant qu elles n ont pas ete purgees volontairement.
FR24: Le systeme distingue les patients vus et les patients non vus mais commentes dans les donnees journalieres.
FR25: L utilisateur peut enregistrer la date de derniere transmission pour un patient.
FR26: L utilisateur peut indiquer depuis la fiche patient qu une transmission a ete faite aujourd hui.
FR27: Le systeme met a jour la date de derniere transmission lorsqu une transmission est enregistree.
FR28: Le systeme distingue explicitement le suivi des transmissions du suivi des seances.
FR29: Le systeme peut afficher un indicateur visuel de transmission pour chaque patient dans la vue `Journee`.
FR30: Le systeme peut calculer cet indicateur visuel a partir de l anciennete de la derniere transmission.
FR31: L utilisateur peut consulter une fiche individuelle pour chaque patient.
FR32: L utilisateur peut voir dans la fiche les informations d identite et de reperage utiles du patient.
FR33: L utilisateur peut consulter et modifier les antecedents d un patient.
FR34: L utilisateur peut consulter et modifier les informations administratives d un patient.
FR35: L utilisateur peut modifier directement les champs administratifs sans passer par un mode edition separe.
FR36: Le systeme sauvegarde automatiquement les modifications lorsqu un champ est quitte.
FR37: L utilisateur peut definir les jours habituels de prise en charge d un patient.
FR38: L utilisateur peut definir un niveau de priorite global pour un patient.
FR39: L utilisateur peut consulter un historique associe a un patient, du plus recent au plus ancien, reunissant date, seance A/B eventuelle et note du jour, y compris seances sans commentaire et notes sans seance.
FR40: L utilisateur peut acceder ulterieurement a des bilans libres puis structures depuis la fiche patient.
FR41: L utilisateur peut creer un nouveau patient depuis l onglet `Patients`.
FR42: Le systeme exige au minimum le nom et le prenom pour creer un patient.
FR43: Le systeme ajoute automatiquement un nouveau patient aux sous-jours actifs prevus.
FR44: L utilisateur peut archiver un patient.
FR45: Le systeme retire automatiquement un patient archive du flux `Journee`.
FR46: L utilisateur peut consulter les patients archives depuis l onglet `Patients`.
FR47: L utilisateur peut supprimer definitivement un patient avec confirmation simple.
FR48: L utilisateur peut consulter une liste generale de patients distincte de l onglet `Journee`.
FR49: Le systeme presente cette liste generale par ordre alphabetique par defaut.
FR50: L utilisateur peut ouvrir la fiche patient depuis la liste generale.
FR51: L utilisateur peut acceder a des filtres depuis un bouton dedie dans l onglet `Patients`.
FR52: L utilisateur peut appliquer des filtres metier a la liste generale.
FR53: L utilisateur peut filtrer les patients archives.
FR54: L utilisateur peut filtrer les patients selon des criteres administratifs ou cliniques simples.
FR55: Le systeme peut proposer des filtres predefinis, notamment autour des prescriptions proches de leur fin.
FR56: L utilisateur peut consulter et corriger les journees passees dans l application, a toute date explicitement ouverte (seances, notes, H et commentaire).
FR57: L utilisateur peut consulter une periode passee regroupant plusieurs journees.
FR58: L utilisateur peut generer un export TXT compact des journees sur une periode choisie.
FR59: Le systeme structure l export TXT jour par jour.
FR60: Le systeme respecte l ordre reel du sous-jour dans l export TXT.
FR61: Le systeme peut inclure les commentaires patient et de journee dans l export TXT.
FR62: Le systeme peut distinguer dans l export les patients vus et les patients non vus mais commentes.
FR63: L utilisateur peut previsualiser le contenu d export avant partage ou enregistrement.
FR64: L utilisateur peut exporter un tableau patient reimportable.
FR65: L utilisateur peut importer un tableau patient dans une application vide.
FR66: Le systeme reconstruit la base patient a partir de ce tableau importe.
FR67: Le systeme place automatiquement les patients importes dans les sous-jours prevus avec un ordre initial neutre.
FR68: L utilisateur peut supprimer les donnees journalieres anciennes apres export.
FR69: Le systeme conserve la base patient independamment de la purge des journaux quotidiens.
FR70: Le systeme fonctionne sans synchronisation externe obligatoire.
FR71: Le systeme conserve les donnees localement sur l iPhone.
FR72: Le systeme permet un usage principal hors ligne.
FR73: Le systeme permet de consulter, modifier et exporter les donnees sans dependre d un service distant.
FR74: Le systeme limite les acces device aux permissions necessaires au fonctionnement v1.
FR75: Le systeme affiche la priorite d un patient dans la vue `Journee` juste apres le nom du patient lorsque cette information est visible dans la ligne.
FR76: Le systeme affiche par defaut uniquement le nom du patient dans la vue `Journee`, et ajoute l initiale du prenom uniquement en cas d homonymie.
FR77: Le systeme place l acces a la note patient du jour et l indicateur de transmission au debut de la ligne patient dans la vue `Journee`.
FR78: Le systeme fournit une zone tactile elargie pour l interaction avec le triangle de debut de ligne dans la vue `Journee`.
FR79: Le systeme laisse visible en permanence la poignee de reorganisation dans la vue `Journee`.
FR80: Le systeme ouvre automatiquement le sous-jour correspondant lorsqu il est lance un jour reel de presence.
FR81: Le systeme conserve le sous-jour precedent tant qu aucun nouveau vrai jour de presence ne justifie un basculement automatique.
FR82: Le systeme associe chaque sous-jour consulte aux dates correspondantes de la semaine courante.
FR83: Le systeme encode dans l export TXT la modalite `A/B` par la casse du debut du nom du patient.
FR84: Le systeme structure chaque journee exportee au format TXT avec une ligne de date, une ligne compacte de signes et commentaire general, une ligne continue des patients vus et une ligne `pas vus :` lorsque necessaire. Les sept niveaux H donnent respectivement `---`, `--`, `-`, chaine vide, `+`, `++`, `+++`, sans prefixe H; le commentaire general est conserve. Si signes et commentaire sont tous deux vides, la ligne est omise; si seul le commentaire est present, il est exporte seul.
FR85: Le systeme inclut dans l export TXT les patients vus sur une seule ligne continue en conservant l ordre du sous-jour consulte.
FR86: Le systeme place les patients non vus mais commentes dans une section distincte `pas vus :` dans l export TXT.
FR87: Le systeme applique un code couleur de transmission fonde sur l anciennete de la derniere transmission en utilisant quatre etats visuels distincts. Si la date est inconnue, le triangle est gris avec un libelle accessible explicite.

### NonFunctional Requirements

NFR1: L application doit ouvrir l onglet `Journee` sans latence perceptible dans des conditions nominales d usage.
NFR2: Les actions critiques de pointage `A/B`, d ouverture de note patient et de modification de fiche doivent produire un retour immediat a l utilisateur.
NFR3: La consultation d une periode passee et la generation d un export TXT doivent rester rapides pour un historique couvrant plusieurs mois.
NFR4: Le produit doit rester fluide avec un faible volume de donnees, correspondant a environ 12 a 15 patients actifs et a plusieurs mois d historique journalier.
NFR5: Les donnees patient et journalieres doivent etre persistees localement de maniere fiable.
NFR6: Toute modification d un champ editable doit etre sauvegardee automatiquement a la sortie du champ.
NFR7: Le systeme ne doit pas reutiliser les donnees quotidiennes d un jour precedent lors de l ouverture d un nouveau jour.
NFR8: Les ordres de sous-jours, positions des separateurs, statuts patients et informations administratives doivent rester coherents apres fermeture et reeouverture de l application.
NFR9: Les exports doivent refleter fidelement les donnees visibles dans l application au moment de leur generation.
NFR10: Les donnees doivent rester stockees localement sur l appareil sans synchronisation externe obligatoire.
NFR11: Le produit doit limiter les acces device et les echanges externes aux seuls mecanismes necessaires au fonctionnement v1.
NFR12: Les exports doivent etre declenches explicitement par l utilisateur, jamais envoyes automatiquement.
NFR13: Le produit doit reduire le risque d exposition involontaire des donnees en evitant les integrations externes non essentielles dans la version initiale.
NFR14: Les usages principaux doivent rester disponibles sans connexion reseau.
NFR15: L utilisateur doit pouvoir consulter, pointer, modifier et preparer ses exports sans dependre d un service distant.
NFR16: L absence de reseau ne doit pas empecher l utilisation courante du produit.
NFR17: Le produit doit privilegier une interface sobre, lisible et compatible avec un usage rapide en situation de tournee.
NFR18: Les fonctions critiques doivent rester accessibles depuis un nombre reduit d ecrans et d actions.
NFR19: Le produit doit minimiser la charge mentale en evitant les confirmations, modes intermediaires et ecrans superflus pour les actions courantes.
NFR20: L interface doit rester utilisable en conditions de lecture rapide sur iPhone, avec contrastes suffisants et elements tactiles exploitables.
NFR21: Les elements interactifs critiques, notamment le triangle de note/transmission, les cases `A/B` et les poignees de reorganisation, doivent etre dimensionnes pour un usage tactile fiable.
NFR22: Le produit doit fournir un export patient reimportable pour permettre une migration ou une restauration simple.
NFR23: Le produit doit fournir des exports TXT par periode sans imposer de reexport global complet.
NFR24: La purge des donnees journalieres anciennes ne doit pas affecter la base patient active.
NFR25: Le code couleur de transmission doit rester lisible et coherent avec les seuils suivants: rouge au-dela de 2 mois, orange entre 1,5 et 2 mois, vert fonce entre 1 et 1,5 mois, vert clair en dessous de 1 mois.
NFR26: Le format TXT exporte doit rester compact, stable et lisible avec une grammaire constante entre les periodes exportees.

### Additional Requirements

- Starter technique validé: `Vite + React + TypeScript + Tailwind + Dexie (IndexedDB) + PWA + Vitest`.
- Conventions critiques: `dayKey` persistant en `YYYY-MM-DD` (affichage `DD/MM/YYYY`).
- Autosave: pointage `A/B`, notes, `H`, commentaire journée sauvegardés immédiatement; ordre sauvegardé au “drop”.
- Export TXT = API publique: format stable + tests “golden” indispensables.
- Versionnage/migrations DB: Dexie versions dès v1.
- Architecture de code: séparation `domain` (règles), `storage` (DB), `exports` (pures), `features` (UI/use-cases).

### UX Design Requirements

UX-DR1: L’interface doit rester sobre, utilitaire et robuste, sans esthétique “grand public”, optimisée pour usage au pouce sur iPhone.
UX-DR2: Le cockpit `Journée` doit être compris et utilisable en quelques secondes (orientation immédiate).
UX-DR3: Les actions fréquentes doivent être réalisables en un geste ou presque (pointage `A/B`, note du jour, accès fiche).
UX-DR4: Les concepts séance/transmission/note/historique doivent être visuellement non ambigus.
UX-DR5: Le système visuel doit être neutre, la couleur réservée aux états métier (notamment transmissions).
UX-DR6: Typographie lisible et hiérarchie simple, densité utile sur iPhone.
UX-DR7: Layout dense mais pas tassé; cibles tactiles fiables.
UX-DR8: Accessibilité minimale: contraste élevé, lisibilité rapide, compréhension sans dépendre uniquement de la couleur.

### FR Coverage Map

FR1: Epic 1 - Base app + ouverture sur `Journée`
FR2: Epic 1 - Affichage date dans `Journée`
FR3: Epic 1 - Sous-jours L/J/V (navigation de base)
FR4: Epic 2 - Liste complète patients
FR5: Epic 2 - Ordre différent par sous-jour
FR6: Epic 2 - Réorganisation ordre
FR7: Epic 2 - Persistance ordre
FR8: Epic 2 - 3 séparateurs
FR9: Epic 2 - Déplacement séparateurs
FR10: Epic 2 - Persistance séparateurs
FR11: Epic 2 - Tous patients visibles
FR12: Epic 2 - Bascule manuelle sous-jours
FR13: Epic 3 - Pointage A
FR14: Epic 3 - Pointage B
FR15: Epic 3 - Exclusivité A/B
FR16: Epic 3 - Décocher pour corriger
FR17: Epic 3 - Non coché = non vu
FR18: Epic 3 - Note patient du jour
FR19: Epic 3 - Note sans séance
FR20: Epic 3 - H global jour
FR21: Epic 3 - Commentaire général jour
FR22: Epic 3 - Reset nouveau jour
FR23: Epic 7/Epic 8 - Historique exportable/purgeable
FR24: Epic 7 - Distinction vus/non vus commentés
FR25: Epic 4 - Date dernière transmission
FR26: Epic 4 - Transmission faite aujourd’hui
FR27: Epic 4 - Mise à jour date transmission
FR28: Epic 4 - Distinction séance/transmission
FR29: Epic 4 - Indicateur transmission dans `Journée`
FR30: Epic 4 - Calcul ancienneté transmission
FR31: Epic 5 - Ouvrir fiche patient
FR32: Epic 5 - En-tête infos patient
FR33: Epic 5 - Antécédents modifiables
FR34: Epic 5 - Administratif modifiable
FR35: Epic 5 - Édition directe
FR36: Epic 5 - Autosave au blur
FR37: Epic 5 - Jours habituels
FR38: Epic 5 - Priorité patient
FR39: Epic 5 - Historique patient
FR40: Epic 5 - Bilans futurs
FR41: Epic 5 - Ajouter patient
FR42: Epic 5 - Nom/prénom obligatoires
FR43: Epic 5 - Ajout patient aux sous-jours
FR44: Epic 5 - Archiver patient
FR45: Epic 5 - Archivé sort de `Journée`
FR46: Epic 6 - Filtre archivés
FR47: Epic 5 - Suppression patient
FR48: Epic 6 - Liste générale `Patients`
FR49: Epic 6 - Tri alpha
FR50: Epic 6 - Ouvrir fiche depuis liste
FR51: Epic 6 - Bouton filtres
FR52: Epic 6 - Appliquer filtres
FR53: Epic 6 - Filtre archivés
FR54: Epic 6 - Filtres admin/cliniques simples
FR55: Epic 6 - Filtre prescriptions proches fin
FR56: Epic 7 - Consultation et correction in-app des journées à toute date
FR57: Epic 7 - Consultation période
FR58: Epic 7 - Export TXT période
FR59: Epic 7 - TXT jour par jour
FR60: Epic 7 - TXT respecte ordre
FR61: Epic 7 - TXT inclut commentaires
FR62: Epic 7 - TXT distingue vus/non vus commentés
FR63: Epic 7 - Preview export
FR64: Epic 8 - Export tableau patient
FR65: Epic 8 - Import tableau patient app vide
FR66: Epic 8 - Reconstruction base patient
FR67: Epic 8 - Placement import dans sous-jours
FR68: Epic 8 - Purge journaux après export
FR69: Epic 8 - Base patient indépendante
FR70: Epic 1 - Pas de sync externe obligatoire
FR71: Epic 1 - Données locales
FR72: Epic 1 - Usage hors ligne
FR73: Epic 1 - Consultation/modif/export sans service distant
FR74: Epic 1 - Permissions minimales
FR75: Epic 5 - Priorité visible dans `Journée`
FR76: Epic 2/Epic 5 - Nom + initiale si homonymie
FR77: Epic 2/Epic 3 - Triangle note + indicateur transmission
FR78: Epic 2/Epic 3 - Zone tactile triangle élargie
FR79: Epic 2 - Poignée de réorganisation visible
FR80: Epic 2 - Auto-sélection sous-jour
FR81: Epic 2 - Persistance sous-jour jusqu’au prochain jour de présence
FR82: Epic 2 - Sous-jours ancrés semaine courante
FR83: Epic 7 - Encodage A/B par casse
FR84: Epic 7 - Grammaire TXT compacte
FR85: Epic 7 - Patients vus sur une ligne
FR86: Epic 7 - Section `pas vus :`
FR87: Epic 4 - Seuils couleur transmission

## Epic List

### Epic 1: Base Produit (PWA locale) + Persistance fiable
Le produit démarre, fonctionne hors ligne, sauvegarde localement de façon fiable, et prépare le socle technique (routing, DB, migrations, conventions `dayKey`).
**FRs covered:** FR1, FR2, FR3, FR70, FR71, FR72, FR73, FR74

### Epic 2: Cockpit `Journée` (tournée + ordre + séparateurs)
L’utilisateur ouvre `Journée`, voit tous les patients, bascule `lundi/jeudi/vendredi`, réordonne (avec persistance), gère 3 séparateurs, voit la date de la semaine courante.
**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR80, FR81, FR82

### Epic 3: Pointage & Notes Quotidiennes (A/B, notes patient, H, commentaire)
Pointage `A/B` exclusif, décochable, notes patient même sans séance, `H` global, commentaire jour, reset propre à chaque nouvelle date.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24

### Epic 4: Transmissions (date + indicateur couleur)
Tracer la dernière transmission depuis la fiche, distinguer séance/transmission, afficher le signal visuel (triangle/couleur) selon ancienneté.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR87

### Epic 5: Dossier Patient (fiche, administratif, priorité, archive/suppression, historique simple)
Créer/éditer patient, autosave, priorité, jours habituels, historique patient minimal, archivage et suppression.
**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47, FR75, FR76, FR77, FR78, FR79

#### Story 5.7: Historique patient des séances et notes

Ajout de reprise confirmé le 2026-09-15.

**Given** une fiche patient active ou archivée avec des traces quotidiennes
**When** j'ouvre son historique
**Then** les dates sont présentées de la plus récente à la plus ancienne
**And** chaque entrée indique la séance A/B éventuelle et la note du jour
**And** séances sans note et notes sans séance sont incluses
**And** je peux ouvrir la date correspondante pour consulter ou corriger la journée

## Epic 6: Liste `Patients` + Filtres
Liste générale alphabétique, ouverture fiche, panneau filtres (archivés, fin prescription, etc.).
**FRs covered:** FR48, FR49, FR50, FR51, FR52, FR53, FR54, FR55

### Epic 7: Historique Période + Export TXT (format stable)
Exporter une période (plusieurs mois), preview, format TXT compact stable, ordre respecté, section `pas vus :`, encodage `A/B` par casse.
**FRs covered:** FR56, FR57, FR58, FR59, FR60, FR61, FR62, FR63, FR83, FR84, FR85, FR86

#### Story 7.3: Consulter et corriger toute journée passée

Ajout de reprise confirmé le 2026-09-15; remplace la clôture au lendemain évoquée dans le brainstorming.

**Given** une date passée explicitement sélectionnée
**When** j'ouvre cette journée
**Then** je retrouve ses séances, notes, H et commentaire
**And** je peux les corriger sans limite à la semaine courante
**And** l'export reflète les corrections sauvegardées
**And** les ordres enregistrés pour les dates passées restent indépendants des réorganisations des tournées suivantes

## Epic 8: Import/Export Tableau Patient + Purge Journaux
Exporter tableau patient réimportable, importer dans app vide, purge manuelle des données journalières (sans casser la base patient).
**FRs covered:** FR64, FR65, FR66, FR67, FR68, FR69

## Epic 1: Base Produit (PWA locale) + Persistance fiable

Le produit démarre, fonctionne hors ligne, sauvegarde localement de façon fiable, et prépare le socle technique (routing, DB, migrations, conventions `dayKey`).

### Story 1.1: Initialiser le projet PWA (Vite + React + TypeScript)

As a kinésithérapeute,
I want ouvrir une application qui démarre instantanément sur iPhone,
So that je puisse l’utiliser en tournée sans friction.

**Acceptance Criteria:**

**Given** un repo vide et `npm` comme gestionnaire de paquets
**When** je scaffold le projet `Vite react-ts` et je lance le serveur de dev
**Then** l’application affiche une page de base sans erreur sur navigateur desktop et mobile
**And** TypeScript est activé en mode strict

### Story 1.2: Ajouter Tailwind et une base visuelle sobre/utilitaire

As a kinésithérapeute,
I want une interface lisible et utilitaire,
So that je puisse lire et agir rapidement au pouce.

**Acceptance Criteria:**

**Given** l’application Vite/React existante
**When** Tailwind est installé et configuré
**Then** la UI peut utiliser des classes Tailwind
**And** les couleurs et espacements par défaut restent sobres (pas d’esthétique “grand public”)

### Story 1.3: Mettre en place le routing et la navigation à 3 onglets

As a kinésithérapeute,
I want accéder à `Journée`, `Patients` et `Réglages/Export`,
So that je retrouve rapidement la bonne action.

**Acceptance Criteria:**

**Given** l’application est démarrée
**When** je navigue entre les 3 onglets
**Then** je vois 3 vues distinctes et stables (`Journée`, `Patients`, `Réglages/Export`)
**And** l’ouverture par défaut arrive sur `Journée`

### Story 1.4: Créer la base de données locale (Dexie) avec migrations

As a kinésithérapeute,
I want que mes données restent stockées localement et durablement,
So that je ne perde rien même hors connexion.

**Acceptance Criteria:**

**Given** une app PWA sans backend
**When** je configure Dexie avec un schéma versionné
**Then** une base IndexedDB est créée et utilisable
**And** une migration “no-op” existe pour valider le pipeline d’upgrade
**And** les dates de journée sont stockées via un `dayKey` au format `YYYY-MM-DD`

### Story 1.5: Activer le mode PWA (manifest + service worker)

As a kinésithérapeute,
I want pouvoir installer l’app sur l’iPhone et l’utiliser hors ligne,
So that je ne dépende pas du réseau.

**Acceptance Criteria:**

**Given** le plugin PWA est configuré
**When** je “install” la PWA sur iPhone (ou navigateur compatible)
**Then** un manifest valide est servi
**And** l’app charge au minimum l’UI shell hors ligne
**And** aucune synchronisation externe n’est requise

### Story 1.6: Mettre en place les tests unitaires (Vitest)

As a développeur,
I want une base de tests unitaires,
So that je verrouille les règles métier (format TXT, dayKey, exclusivité A/B) plus tard.

**Acceptance Criteria:**

**Given** le projet
**When** je lance `vitest`
**Then** un test smoke passe
**And** le framework est prêt pour des tests “golden” d’export TXT

## Epic 2: Cockpit `Journée` (tournée + ordre + séparateurs)

L’utilisateur ouvre `Journée`, voit tous les patients, bascule `lundi/jeudi/vendredi`, réordonne (avec persistance), gère 3 séparateurs, voit la date de la semaine courante.

### Story 2.1: Sélecteur de sous-jours + date réelle (semaine courante)

As a kinésithérapeute,
I want voir `lundi/jeudi/vendredi` et la date réelle correspondante,
So that je ne me trompe pas de journée.

**Acceptance Criteria:**

**Given** la vue `Journée`
**When** on est un lundi/jeudi/vendredi
**Then** le bon sous-jour est auto-sélectionné
**And** la date réelle du sous-jour est affichée
**And** je peux basculer manuellement sur un autre sous-jour
**And** le sous-jour reste sélectionné jusqu’au prochain vrai jour de présence

### Story 2.2: Afficher la liste complète des patients dans `Journée`

As a kinésithérapeute,
I want voir tous mes patients sur la journée,
So that je puisse gérer les exceptions.

**Acceptance Criteria:**

**Given** une base patients non vide
**When** j’ouvre `Journée`
**Then** tous les patients actifs apparaissent
**And** l’ordre affiché dépend du sous-jour (L/J/V)

### Story 2.3: Réorganiser l’ordre des patients et persister au “drop”

As a kinésithérapeute,
I want réordonner ma tournée par glisser-déposer,
So that je reflète les priorités réelles du jour.

**Acceptance Criteria:**

**Given** la liste `Journée`
**When** je déplace un patient
**Then** l’ordre change visuellement
**And** l’ordre est sauvegardé quand je lâche la ligne (drop)
**And** en rouvrant l’app, l’ordre reste le même pour ce sous-jour

### Story 2.4: Ajouter 3 séparateurs déplaçables par sous-jour

As a kinésithérapeute,
I want 3 séparateurs vides dans la liste,
So that je crée des groupes de priorité.

**Acceptance Criteria:**

**Given** un sous-jour (L/J/V)
**When** j’ouvre `Journée`
**Then** 3 séparateurs existent par défaut (placés en haut)
**And** je peux les déplacer comme des items de liste
**And** leur position est persistée par sous-jour

### Story 2.5: Ligne patient “dense” conforme (triangle, nom, priorité, poignée)

As a kinésithérapeute,
I want une ligne patient dense mais lisible,
So that je scanne vite et j’agis au pouce.

**Acceptance Criteria:**

**Given** une ligne patient
**When** elle s’affiche dans `Journée`
**Then** elle montre le nom (et l’initiale du prénom uniquement en cas d’homonymie)
**And** la priorité (si visible) est juste après le nom
**And** la poignée de réorganisation est toujours visible
**And** le triangle à gauche a une zone tactile élargie

## Epic 3: Pointage & Notes Quotidiennes (A/B, notes patient, H, commentaire)

Pointage `A/B` exclusif, décochable, notes patient même sans séance, `H` global, commentaire jour, reset propre à chaque nouvelle date.

### Story 3.1: Modèle de données “journée” (dailyRecords) + reset quotidien

As a kinésithérapeute,
I want que chaque date ait son propre état,
So that la journée du lendemain reparte vide.

**Acceptance Criteria:**

**Given** un `dayKey` du jour
**When** j’ouvre `Journée`
**Then** un enregistrement de journée existe (créé si besoin)
**And** sur une nouvelle date, `A/B`, notes, `H`, commentaire général sont vides par défaut

### Story 3.2: Pointage `A/B` exclusif et sauvegarde immédiate

As a kinésithérapeute,
I want cocher `A` ou `B` en un geste,
So that cela s’enregistre immédiatement.

**Acceptance Criteria:**

**Given** une ligne patient
**When** je coche `A`
**Then** `B` est décoché automatiquement
**And** un second tap sur `A` le décoche
**And** l’état est sauvegardé immédiatement (sans bouton global)

### Story 3.3: Notes patient du jour via tiroir (triangle) + autosave

As a kinésithérapeute,
I want écrire une note du jour sous un patient,
So that je garde une trace contextuelle même sans séance.

**Acceptance Criteria:**

**Given** un patient (vu ou non)
**When** j’ouvre le tiroir via le triangle et je saisis une note
**Then** la note est sauvegardée immédiatement à la sortie du champ
**And** la note est possible même si `A/B` n’est pas coché

### Story 3.4: `H` global + commentaire général de journée + autosave

As a kinésithérapeute,
I want renseigner `H` et un commentaire de journée,
So that je contextualise ma demi-journée.

**Acceptance Criteria:**

**Given** la vue `Journée`
**When** je sélectionne une valeur `H` et saisis un commentaire général
**Then** ils sont sauvegardés immédiatement
**And** sur une nouvelle date, ils reviennent vides
**And** les sept niveaux proposés sont `H---`, `H--`, `H-`, `H`, `H+`, `H++`, `H+++`
**And** le niveau neutre `H` est distingué d'une absence de sélection

## Epic 4: Transmissions (date + indicateur couleur)

Tracer la dernière transmission depuis la fiche, distinguer séance/transmission, afficher le signal visuel (triangle/couleur) selon ancienneté.

### Story 4.1: Enregistrer “transmission faite aujourd’hui” sur la fiche patient

As a kinésithérapeute,
I want cocher “transmission faite aujourd’hui” dans la fiche,
So that la date de dernière transmission se mette à jour.

**Acceptance Criteria:**

**Given** une fiche patient
**When** je coche “transmission faite aujourd’hui”
**Then** `lastTransmissionDate` devient la date du jour
**And** ce champ reste distinct de toute notion de séance

### Story 4.2: Afficher l’indicateur transmission (couleur) dans `Journée`

As a kinésithérapeute,
I want voir un code couleur de transmission sur la ligne,
So that je repère vite les transmissions anciennes.

**Acceptance Criteria:**

**Given** une date de dernière transmission
**When** la ligne patient s’affiche
**Then** le triangle est coloré selon les seuils:
**And** rouge au-delà de 2 mois
**And** orange entre 1,5 et 2 mois
**And** vert foncé entre 1 et 1,5 mois
**And** vert clair en dessous de 1 mois

## Epic 5: Dossier Patient (fiche, administratif, priorité, archive/suppression, historique simple)

Créer/éditer patient, autosave, priorité, jours habituels, historique patient minimal, archivage et suppression.

### Story 5.1: Création patient (nom/prénom obligatoires) + ajout aux sous-jours

As a kinésithérapeute,
I want ajouter un patient rapidement,
So that je ne sois pas bloqué par l’administratif.

**Acceptance Criteria:**

**Given** l’onglet `Patients`
**When** je crée un patient avec nom/prénom
**Then** le patient est créé
**And** il est ajouté aux sous-jours L/J/V
**And** l’ordre initial est alphabétique

### Story 5.2: Fiche patient (en-tête + administratif) avec édition directe

As a kinésithérapeute,
I want consulter et modifier la fiche patient,
So that je maintienne un dossier vivant.

**Acceptance Criteria:**

**Given** une fiche patient
**When** je modifie un champ administratif (chambre, médecin, prescription, etc.)
**Then** la modification est sauvegardée automatiquement à la sortie du champ
**And** l’en-tête affiche les infos clés (identité + repérage) de façon compacte

### Story 5.3: Antécédents en texte libre + autosave

As a kinésithérapeute,
I want saisir des antécédents en texte libre,
So that je garde l’essentiel accessible.

**Acceptance Criteria:**

**Given** une fiche patient
**When** je modifie les antécédents
**Then** c’est du texte brut
**And** sauvegarde au blur

### Story 5.4: Priorité patient (1 à 3) visible dans `Journée`

As a kinésithérapeute,
I want définir une priorité patient,
So that elle soit visible dans `Journée`.

**Acceptance Criteria:**

**Given** une fiche patient
**When** je change la priorité (1-3)
**Then** la priorité est sauvegardée
**And** elle peut être affichée juste après le nom dans `Journée`

### Story 5.5: Archiver et supprimer un patient

As a kinésithérapeute,
I want archiver ou supprimer un patient,
So that ma liste active reste propre.

**Acceptance Criteria:**

**Given** une fiche patient
**When** j’archive le patient
**Then** il disparaît de `Journée` (L/J/V)
**And** il reste consultable via filtre “archivés” dans `Patients`
**When** je supprime le patient
**Then** il est retiré de la base patients après confirmation simple

### Story 5.6: Conserver les traces quotidiennes après suppression patient

As a kinésithérapeute,
I want que l’historique journalier reste exportable même si un patient est supprimé,
So that mes traces TXT passées restent cohérentes.

**Acceptance Criteria:**

**Given** des enregistrements journaliers existants
**When** je supprime un patient
**Then** les journées passées restent exportables
**And** les entrées journalières utilisent un “snapshot” du nom affiché pour l’export

### Story 5.7: Historique patient des séances et notes

Ajout de reprise confirmé le 2026-09-15.

**Given** une fiche patient active ou archivée avec des traces quotidiennes
**When** j'ouvre son historique
**Then** les dates sont présentées de la plus récente à la plus ancienne
**And** chaque entrée indique la séance A/B éventuelle et la note du jour
**And** séances sans note et notes sans séance sont incluses
**And** je peux ouvrir la date correspondante pour consulter ou corriger la journée

## Epic 6: Liste `Patients` + Filtres

Liste générale alphabétique, ouverture fiche, panneau filtres (archivés, fin prescription, etc.).

### Story 6.1: Liste générale `Patients` (alpha, minimaliste)

As a kinésithérapeute,
I want une liste générale simple,
So that je retrouve vite une fiche.

**Acceptance Criteria:**

**Given** l’onglet `Patients`
**When** il s’affiche
**Then** il est trié par ordre alphabétique
**And** chaque ligne montre uniquement nom/prénom
**And** un tap ouvre la fiche patient

### Story 6.2: Panneau de filtres validable (incluant archivés)

As a kinésithérapeute,
I want filtrer ma liste,
So that je trouve des sous-ensembles utiles.

**Acceptance Criteria:**

**Given** l’onglet `Patients`
**When** j’ouvre le panneau `Filtres` et je valide
**Then** la liste est filtrée
**And** je peux afficher les archivés via un filtre dédié

### Story 6.3: Filtre “prescriptions proches de fin”

As a kinésithérapeute,
I want voir les prescriptions proches de leur fin,
So that j’anticipe.

**Acceptance Criteria:**

**Given** des dates de fin de prescription
**When** j’active le filtre “< 3 mois”
**Then** seuls ces patients apparaissent

## Epic 7: Historique Période + Export TXT (format stable)

Exporter une période (plusieurs mois), preview, format TXT compact stable, ordre respecté, section `pas vus :`, encodage `A/B` par casse.

### Story 7.1: Génération TXT (jour par jour) + tests “golden”

As a kinésithérapeute,
I want un export TXT compact et stable,
So that je puisse pointer au cabinet.

**Acceptance Criteria:**

**Given** une période (plusieurs mois) et des journées enregistrées
**When** je génère le TXT
**Then** chaque journée suit la grammaire:
**And** ligne 1: date `DD/MM/YYYY`
**And** ligne 2: signes seuls (`---`, `--`, `-`, rien pour `H`, `+`, `++`, `+++`) + commentaire éventuel, sans préfixe `H`
**And** le commentaire général reste exporté quand le niveau est neutre
**And** la ligne est omise si les signes et le commentaire sont tous deux vides
**And** les tests couvrent les sept niveaux, le neutre avec commentaire et la ligne omise
**And** ligne 3: patients vus sur une ligne, dans l’ordre du sous-jour
**And** ligne 4: `pas vus :` uniquement si nécessaire
**And** `A/B` est encodé par la casse du début du nom du patient
**And** des tests “golden” verrouillent ce format

### Story 7.2: UI d’export TXT par période (preview + partage)

As a kinésithérapeute,
I want choisir une période et prévisualiser le TXT,
So that j’exporte sans surprise.

**Acceptance Criteria:**

**Given** `Réglages/Export`
**When** je sélectionne plusieurs mois et j’ouvre l’aperçu
**Then** je vois le TXT complet
**And** je peux déclencher un partage/enregistrement via le système

### Story 7.3: Consulter et corriger toute journée passée

Ajout de reprise confirmé le 2026-09-15; remplace la clôture au lendemain évoquée dans le brainstorming.

**Given** une date passée explicitement sélectionnée
**When** j'ouvre cette journée
**Then** je retrouve ses séances, notes, H et commentaire
**And** je peux les corriger sans limite à la semaine courante
**And** l'export reflète les corrections sauvegardées
**And** les ordres enregistrés pour les dates passées restent indépendants des réorganisations des tournées suivantes

## Epic 8: Import/Export Tableau Patient + Purge Journaux

Exporter tableau patient réimportable, importer dans app vide, purge manuelle des données journalières (sans casser la base patient).

### Story 8.1: Export tableau patient réimportable (CSV)

As a kinésithérapeute,
I want exporter ma base patients,
So that je puisse migrer vers un nouvel iPhone.

**Acceptance Criteria:**

**Given** des patients en base
**When** j’exporte le tableau patient
**Then** un CSV est généré avec en-têtes stables
**And** il inclut un `schemaVersion`
**And** les champs correspondent au socle durable (pas les journaux quotidiens)

### Story 8.2: Import CSV patient en “replace all” (app vide)

As a kinésithérapeute,
I want importer un CSV patient,
So that je reconstruise la base sur un nouvel appareil.

**Acceptance Criteria:**

**Given** une app vide (ou mode replace-all)
**When** j’importe le CSV
**Then** la base patients est reconstruite
**And** les sous-jours L/J/V sont initialisés avec tous les patients en ordre alphabétique
**And** 3 séparateurs sont créés en haut pour chaque sous-jour

### Story 8.3: Purge manuelle des journaux quotidiens (après export)

As a kinésithérapeute,
I want supprimer des journaux anciens,
So that l’app reste légère dans le temps.

**Acceptance Criteria:**

**Given** des journées anciennes
**When** je lance une purge manuelle sur une période
**Then** seules les données journalières sont supprimées
**And** la base patient reste intacte
