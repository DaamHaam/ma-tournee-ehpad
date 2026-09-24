---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-core-experience
  - step-04-emotional-response
  - step-05-inspiration
  - step-06-design-system
  - step-07-defining-experience
  - step-08-visual-foundation
inputDocuments:
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/prd.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/product-brief-BMAD CY-2026-03-20.md
---

# UX Design Specification BMAD CY

**Author:** Damien
**Date:** 2026-03-20

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

BMAD CY est une application iPhone locale, pensée comme un cockpit de tournée personnel pour un kinésithérapeute en EHPAD. L’objectif UX principal est de réduire la charge mentale dès l’ouverture de l’application, en affichant immédiatement la bonne journée, la bonne date, et une liste exploitable de tous les patients avec pointage rapide, suivi de transmission et accès direct aux fiches.

L’expérience doit rester sobre, utilitaire et robuste, sans codes visuels d’application grand public. La priorité est l’efficacité de terrain, pas l’effet visuel.

### Target Users

Le produit vise un utilisateur unique: un kinésithérapeute travaillant en EHPAD, utilisant l’application sur iPhone dans un contexte mobile, rapide, parfois interrompu, avec un faible volume de patients mais un besoin élevé de fiabilité et de simplicité.

L’usage doit être optimisé pour une interaction rapide au pouce, debout, sur iPhone, avec un minimum d’étapes et une lecture immédiate.

### Key Design Challenges

- Concevoir un écran `Journée` très dense mais encore lisible et rapide à manipuler sur iPhone.
- Distinguer clairement les concepts métier proches mais différents: séance `A/B`, transmission, note patient du jour, commentaire général, historique.
- Permettre des ajustements fréquents d’ordre et de priorité sans transformer l’interface en outil administratif lourd.
- Garantir un usage local-first fiable, avec une continuité claire entre action du jour, consultation ultérieure et export TXT compact.
- Garder une ligne patient assez légère pour pouvoir, si nécessaire plus tard, déplacer certaines actions comme le pointage `A/B` en fin de tournée sans casser la logique globale.

### Design Opportunities

- Créer un cockpit `Journée` extrêmement efficace, pensé pour être compris et utilisé en quelques secondes.
- Transformer la fiche patient en dossier vivant, consultable et modifiable sans friction, avec autosave invisible.
- Aligner l’interface sur le futur format TXT compact, pour que ce qui est vu, saisi et exporté raconte la même chose.
- Exploiter la sobriété du contexte solo/local pour éviter les patterns inutiles: recherche, confirmations lourdes, sur-navigation, écrans intermédiaires.
- Construire une UX minimale et robuste en v1, puis l’étoffer progressivement selon l’usage réel.

## Core User Experience

### Defining Experience

L’expérience cœur de BMAD CY est l’ouverture immédiate sur `Journée`, avec la bonne date, le bon sous-jour, et une liste complète de patients directement exploitable. Le geste central est de parcourir la tournée, ajuster l’ordre réel, puis pointer rapidement ce qui a été fait sans quitter le cockpit principal.

### Platform Strategy

Le produit est iPhone-first, tactile, pensé pour un usage au pouce, souvent debout, dans un contexte de travail rapide. Le mode hors ligne est une exigence structurelle. L’interface doit minimiser la navigation, les changements de contexte et les petits éléments tactiles trop fins.

### Effortless Interactions

Les interactions qui doivent devenir quasi automatiques sont:
- ouvrir l’app et comprendre immédiatement la journée en cours
- cocher `A` ou `B` sans friction
- déplier une note patient du jour depuis la ligne
- ouvrir une fiche patient et modifier un champ avec autosave
- voir d’un coup d’œil l’état des transmissions via le triangle coloré
- réordonner rapidement les patients et les séparateurs

### Critical Success Moments

Le premier moment critique est l’ouverture de l’application: l’utilisateur doit se sentir immédiatement orienté.  
Le deuxième est le pointage des séances: si cela devient lent ou ambigu, l’expérience échoue.  
Le troisième est la consultation ultérieure d’une période passée: l’utilisateur doit retrouver facilement ce qu’il a fait, sans reconstruction mentale.

### Experience Principles

- Priorité au cockpit `Journée` plutôt qu’à la navigation.
- Une action fréquente doit se faire en un geste ou presque.
- Toute ambiguïté entre séance, transmission, note du jour et historique doit être éliminée visuellement.
- La sobriété et la robustesse priment sur la richesse visuelle.
- Toute complexité future doit venir par extension, jamais en surcharge de la v1.

## Desired Emotional Response

### Primary Emotional Goals

L’application doit d’abord donner une sensation de clarté, de contrôle et de fiabilité. L’utilisateur doit se sentir moins perdu, moins chargé mentalement, et plus sûr de ce qu’il a à faire et de ce qu’il a déjà fait.

### Emotional Journey Mapping

- À l’ouverture: orientation immédiate, calme, lisibilité.
- Pendant la tournée: fluidité, contrôle, absence de friction.
- Après le pointage: soulagement, sentiment d’avoir bien tracé.
- Lors de la consultation passée: confiance dans la mémoire de l’outil.
- En cas d’erreur: correction simple, sans stress.

### Micro-Emotions

Les états émotionnels les plus importants sont:
- confiance plutôt que doute
- calme plutôt que dispersion
- satisfaction plutôt que lourdeur
- maîtrise plutôt que confusion
- sécurité plutôt qu’anxiété de perte d’information

### Design Implications

Pour produire ces émotions, l’UX doit:
- ouvrir directement sur le bon contexte
- rendre les actions fréquentes triviales
- éviter les couches inutiles
- séparer clairement les concepts métier
- donner des retours simples mais fiables
- rester stable visuellement et comportementalement

### Emotional Design Principles

- L’outil doit rassurer plus qu’impressionner.
- La rapidité doit produire du calme, pas de la précipitation.
- La fiabilité perçue est une composante UX centrale.
- Toute interaction doit réduire la charge mentale.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

L’inspiration principale pour BMAD CY ne vient pas d’une application spectaculaire, mais d’outils simples déjà utilisés dans le quotidien de l’utilisateur: listes, notes rapides, édition directe, consultation immédiate. La stratégie UX n’est donc pas de reproduire une app grand public, mais de récupérer les qualités utiles de ces outils fragmentés tout en supprimant leur dispersion.

Les références implicites sont:
- les listes simples et réordonnables
- les notes rapides modifiables sans friction
- les interfaces locales, sobres et peu décorées
- les écrans où l’état est visible immédiatement sans navigation secondaire

### Transferable UX Patterns

Les patterns à reprendre sont:
- liste principale comme cockpit d’action
- édition directe sans mode “modifier” séparé
- feedback d’état immédiat sur la ligne
- hiérarchie visuelle très simple
- navigation réduite à quelques espaces stables
- conservation d’un même langage entre saisie, consultation et export

### Anti-Patterns to Avoid

Les patterns à éviter sont:
- tableaux de bord surchargés ou très “produit SaaS”
- cartes visuelles trop grandes qui cassent la densité utile
- menus imbriqués ou actions cachées
- confirmations et étapes intermédiaires pour les gestes fréquents
- interfaces trop décoratives qui ralentissent la lecture
- séparation artificielle entre consultation et action

### Design Inspiration Strategy

BMAD CY doit adopter une logique de sobriété radicale:
- reprendre la rapidité d’une liste et d’une note
- garder la modification directe dès que c’est sûr
- privilégier le texte, les états et l’ordre visuel plutôt que les composants lourds
- éviter toute esthétique “grand public”
- faire en sorte que la vue `Journée` devienne le centre de gravité absolu du produit

## Design System Foundation

### 1.1 Design System Choice

Pour BMAD CY, le meilleur choix est un système léger et thèmeable, plutôt qu’un design system très marqué visuellement ou un système entièrement custom dès la v1.

### Rationale for Selection

- le produit doit aller vite en implémentation
- l’interface doit rester sobre et dense
- il faut garder la main sur la taille des lignes, des boutons et des états tactiles
- le projet n’a pas besoin d’une identité visuelle riche au départ
- un système trop imposé visuellement serait contre-productif pour un outil utilitaire mobile

### Implementation Approach

La v1 doit reposer sur:
- une base de composants simples et fiables
- quelques tokens visuels clairs pour les espacements, tailles tactiles, couleurs d’état et typographie
- très peu de variantes de composants
- priorité aux listes, champs, toggles, boutons et feuilles/modales simples

### Customization Strategy

La personnalisation doit rester minimale:
- palette sobre
- contrastes nets
- peu de couleur hors états métier
- composants ajustés pour la densité utile sur iPhone
- aucun habillage “marketing” ou “grand public”

## 2. Core User Experience

### 2.1 Defining Experience

L’expérience définissante de BMAD CY est la capacité à ouvrir l’application et se retrouver immédiatement dans la bonne journée de travail, avec tous les patients sous les yeux, dans un ordre utile, puis à tracer rapidement ce qui a été fait sans quitter ce cockpit principal.

Ce n’est pas une expérience “novatrice” au sens démonstratif. Sa force vient du fait qu’elle assemble des gestes familiers dans un enchaînement beaucoup plus fluide que les outils actuels.

### 2.2 User Mental Model

L’utilisateur pense sa matinée comme une tournée concrète, pas comme un dossier administratif. Il veut:
- voir d’un coup qui il a à gérer
- réordonner selon la réalité
- noter ce qu’il fait sans effort
- retrouver ensuite ce qui a été fait

Son modèle mental naturel est proche d’une liste de travail enrichie, pas d’un logiciel de cabinet complexe.

### 2.3 Success Criteria

L’expérience cœur est réussie si:
- l’ouverture donne immédiatement le bon contexte
- l’utilisateur ne cherche pas où agir
- le pointage `A/B` est quasi instantané
- les erreurs sont facilement corrigeables
- la consultation d’une journée passée ne demande pas de reconstruction mentale

### 2.4 Novel UX Patterns

Le produit repose principalement sur des patterns établis:
- liste réordonnable
- édition directe
- états visuels simples
- navigation par onglets

La singularité ne vient pas d’un pattern inédit, mais de la combinaison très ciblée de ces patterns pour une tournée EHPAD locale, solo et rapide.

### 2.5 Experience Mechanics

**Initiation**
- ouverture de l’app
- arrivée directe sur `Journée`
- bon sous-jour et date visibles

**Interaction**
- balayage visuel de la liste
- réorganisation si nécessaire
- ouverture d’une note patient via triangle
- pointage `A/B`
- accès fiche au toucher sur le patient

**Feedback**
- état coché visible immédiatement
- triangle coloré comme signal transmission
- ordre persisté
- autosave discret sur fiche

**Completion**
- la matinée est tracée
- la journée reste consultable plus tard
- l’export TXT devient possible sans retraitement lourd

## Visual Design Foundation

### Color System

Le système visuel doit être majoritairement neutre, avec très peu de couleurs hors états métier. La couleur doit servir avant tout à signaler l’information importante, notamment l’ancienneté des transmissions, et non à “habiller” l’interface.

Principes:
- fond clair et sobre
- texte très lisible
- couleurs réservées aux statuts et priorités utiles
- pas de palette riche ou marketing

### Typography System

La typographie doit privilégier la lisibilité et la densité utile sur iPhone:
- hiérarchie simple
- peu de tailles différentes
- titres courts et fonctionnels
- corps très lisible
- priorité à la lecture rapide plutôt qu’à la personnalité typographique

### Spacing & Layout Foundation

La mise en page doit être dense mais pas tassée:
- lignes compactes
- espacements réguliers
- zones tactiles suffisamment larges
- peu de marges décoratives
- structure stable d’écran à écran

### Accessibility Considerations

Les choix visuels doivent préserver:
- contraste élevé
- lisibilité en lecture rapide
- cibles tactiles fiables
- compréhension même sans surcharge de couleur
- stabilité de repères entre les écrans


## Clarifications pour le premier essai — 2026-09-15

Les réponses de Damien valident: accès explicite à toute date passée avec correction; historique patient réunissant séances et notes; triangle gris pour une transmission inconnue; sélection H à sept niveaux; suppression de la ligne vide dans le TXT. La première version utilisable inclut immédiatement l'archivage et la suppression confirmée des patients, et démarre avec des données fictives identifiables.

Navigation inférieure à trois onglets, date exacte visible, sélecteur L/J/V et accès date; écran Journée compact avec cibles tactiles d'au moins 44 px. La fiche d'un patient archivé reste consultable. Après suppression de la fiche, les traces anciennes restent exportables. Les écrans vides indiquent comment ajouter un patient; ils ne recréent pas automatiquement de données d'essai.
