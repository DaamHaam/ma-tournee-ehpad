---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/brainstorming/brainstorming-session-2026-03-19-08-30-36.md
date: 2026-03-20
author: Damien
---

# Product Brief: BMAD CY

## Executive Summary

BMAD CY est une application iPhone locale, pensee pour un usage individuel en EHPAD, qui centralise le suivi quotidien des patients, les seances effectuees, les transmissions, les priorites, les prescriptions et les notes utiles a la tournee.

Aujourd hui, ces informations sont dispersees entre Google Tasks, notes iPhone et logiciel EHPAD, ce qui cree de la lenteur, de la double saisie et des oublis. L objectif du produit est de fournir un cockpit quotidien simple et rapide, permettant de voir immediatement les patients a gerer, de pointer les seances au fil de la matinee ou en fin de demi-journee, de suivre les transmissions et de produire un export TXT compact pour le pointage mensuel au cabinet.

La version initiale se concentre sur trois espaces: `Journee`, `Patients` et `Reglages / Export`, avec un stockage 100 % local et une ergonomie concue pour un tres petit volume de patients mais un usage frequent et sensible au temps.

---

## Core Vision

### Problem Statement

Le suivi quotidien des patients en EHPAD repose aujourd hui sur plusieurs outils disperses et peu adaptes a une tournee rapide: listes Google Tasks, notes iPhone et logiciel EHPAD. Cette fragmentation complique la priorisation, ralentit la saisie, favorise les oublis et rend le pointage mensuel plus laborieux.

### Problem Impact

Sans outil centralise, le praticien perd du temps a retrouver l ordre reel de passage, a noter a posteriori les seances effectuees, a suivre les transmissions deja faites ou en retard, et a reconstituer les informations necessaires pour le pointage administratif. Cela augmente la charge mentale et diminue la fluidite du travail quotidien.

### Why Existing Solutions Fall Short

Les solutions actuelles sont trop dispersees, trop generales, ou trop lentes pour un usage en tournee. Elles ne sont pas concues pour un flux mobile, individuel, local-first, avec besoin de cocher rapidement les seances, ajuster les priorites, suivre les transmissions et exporter un resume compact exploitable au cabinet.

### Proposed Solution

Creer une application iPhone locale, optimisee pour une tournee de 12 a 15 patients en EHPAD, avec un tableau de bord `Journee` centre sur l action, une fiche patient legere mais complete, un suivi clair des transmissions, et des exports adaptes a la fois au pointage mensuel et a la conservation des donnees patient essentielles.

### Key Differentiators

- Application ultra-ciblee pour un seul praticien et un contexte EHPAD precis
- Stockage 100 % local, sans dependance a une synchronisation externe
- Ergonomie pensee pour la vitesse de tournee, pas pour un dossier patient generique
- Distinction claire entre seance, transmission, note du jour, historique et export
- Export TXT compact directement aligne avec le besoin reel de pointage mensuel
- Base extensible pour accueillir plus tard des bilans libres puis structures

## Target Users

### Primary Users

Le produit est concu pour un utilisateur unique: un kinesitherapeute exercant en EHPAD, qui gere seul sa tournee, ses priorites, ses transmissions, ses prescriptions et son suivi quotidien des patients.

Cet utilisateur travaille dans un contexte de temps contraint, avec un petit volume de patients mais un besoin fort de fiabilite, de rapidite et de clarte. Il utilise le produit comme outil personnel de pilotage de tournee et de preparation du pointage mensuel.

Son critere de succes est immediat: ouvrir l application, voir la liste utile du jour, ajuster l ordre reel de passage, pointer rapidement les seances, suivre les transmissions et produire un export exploitable sans retraitement.

### Secondary Users

Aucun utilisateur secondaire direct n est retenu pour la version initiale. Le produit est pense pour un usage strictement individuel.

### User Journey

L utilisateur decouvre la valeur du produit des la premiere utilisation utile en tournee: il ouvre l onglet `Journee`, retrouve immediatement ses patients, ajuste ses priorites, coche ses seances au fil de la matinee ou en fin de demi-journee, puis exporte un resume TXT compact pour son pointage.

A long terme, le produit devient un outil de routine quotidienne, utilise comme cockpit de suivi personnel local, avec une fiche patient legere, un suivi simple des transmissions et une base evolutive pour integrer plus tard des bilans plus riches.

## Success Metrics

Le succes de BMAD CY se mesure d abord par sa capacite a devenir l outil quotidien unique de suivi de tournee pour son utilisateur principal.

Les principaux signes de reussite sont:
- reduction des oublis de seances, de notes utiles et de transmissions
- reduction de la double saisie entre outils disperses
- gain de temps dans l organisation de la matinee et le pointage quotidien
- meilleure visibilite sur les priorites, les prescriptions et l anciennete des transmissions

Le produit est considere comme reussi si l utilisateur l ouvre naturellement pour piloter sa tournee, y note ses seances au fil de l eau ou en fin de demi-journee, suit ses transmissions depuis le meme espace, puis produit un export TXT compact exploitable sans retraitement lourd.

### Business Objectives

Comme il s agit d un outil personnel en version initiale, les objectifs business ne sont pas financiers ni orientes croissance multi-utilisateurs.

Les objectifs principaux sont:
- gagner du temps au quotidien
- reduire la charge mentale liee a la dispersion des informations
- diminuer les oublis de suivi
- fiabiliser le pointage mensuel et le suivi des transmissions
- creer une base locale extensible pour de futures fonctionnalites, notamment les bilans

### Key Performance Indicators

Les indicateurs de reussite retenus pour la version initiale sont:

- utilisation quotidienne de l onglet `Journee` comme point d entree principal
- pointage des seances realise entierement dans l application
- export TXT mensuel ou bimensuel utilisable sans retraitement significatif
- capacite a identifier rapidement les patients en retard de transmission
- diminution percue des oublis et du temps perdu a reconstituer les informations
- adoption stable de l application comme outil principal de tournee

## MVP Scope

### Core Features

Le MVP doit inclure:

- un onglet `Journee` avec sous-jours `lundi`, `jeudi`, `vendredi`
- la liste complete des patients dans chaque sous-jour
- un ordre persistant par jour et trois separateurs deplacables
- un pointage `A/B` exclusif
- un `H` global de journee
- un commentaire general de journee
- une note du jour par patient via triangle depliable
- un triangle colore base sur la derniere transmission
- une fiche patient avec en-tete, transmission, antecedents, administratif et historique simple
- l ajout d un patient
- l archivage et la suppression
- l export TXT par periode
- l import/export du tableau patient
- un stockage 100 % local

### Out of Scope for MVP

Ne font pas partie du MVP:

- les bilans structures
- la copie directe vers le logiciel EHPAD
- la synchronisation cloud
- le multi-utilisateur
- la recherche texte
- la reactivation d archives
- un historique avance avec filtres riches
- les rappels automatiques d export
- un mode reorganisation separe

### MVP Success Criteria

Le MVP est considere comme valide si:

- l onglet `Journee` devient le point d entree principal d usage
- les seances sont pointees dans l application sans retour aux notes iPhone
- les transmissions peuvent etre suivies sans oubli majeur
- un export TXT mensuel ou bimensuel exploitable peut etre produit
- l utilisateur constate un gain de temps et une reduction de la charge mentale

### Future Vision

Apres le MVP, le produit peut evoluer vers:

- des bilans libres puis structures
- des filtres plus avances dans `Patients` et l historique
- une aide a la redaction ou a la copie de transmissions
- une evolution progressive de l outil sans perdre sa sobriete d origine
