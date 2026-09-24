---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/planning-artifacts/product-brief-BMAD CY-2026-03-20.md
  - /Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad-output/brainstorming/brainstorming-session-2026-03-19-08-30-36.md
workflowType: 'prd'
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
classification:
  projectType: mobile_app
  domain: healthcare
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - BMAD CY

**Author:** Damien
**Date:** 2026-03-20

## Executive Summary

BMAD CY est une application iPhone locale de suivi de tournee en EHPAD, concue pour un usage individuel par un kinesitherapeute. Le produit centralise dans un seul outil le suivi quotidien des patients, le pointage des seances selon deux modalites, le suivi des transmissions, les informations de prescription, les antecedents utiles et les exports necessaires au pointage mensuel.

Le probleme principal n est pas seulement l absence d un dossier patient, mais la dispersion des informations entre plusieurs outils peu adaptes a une tournee rapide: Google Tasks, notes iPhone et logiciel EHPAD. Cette fragmentation genere de la charge mentale, ralentit la priorisation, favorise les oublis et oblige a reconstituer a posteriori ce qui a ete fait.

Le produit vise un resultat tres concret: permettre a l utilisateur de savoir immediatement qui il doit voir, d ajuster son ordre reel de passage, de pointer ses seances au fil de la matinee ou en fin de demi-journee, de suivre l anciennete des transmissions, puis de produire un export TXT compact exploitable sans retraitement lourd. La valeur attendue est immediate: moins de temps perdu, moins d oublis, meilleure fiabilite du suivi.

### What Makes This Special

BMAD CY se distingue par son cadrage volontairement etroit. Ce n est ni un logiciel cabinet generique, ni un dossier patient complexe, ni un outil multi-utilisateur. C est un cockpit de tournee personnel, local-first, pense pour un faible volume de patients mais une frequence d usage elevee et une forte sensibilite au temps.

L insight central est que la douleur reelle de l utilisateur n est pas de "stocker des informations", mais de ne pas se perdre dans l ordre du jour, de ne pas oublier ce qui a ete fait, et de pouvoir retrouver facilement un historique compact plusieurs semaines plus tard. La solution gagne donc par sobriete, vitesse d usage et adequation au flux reel de travail.

Le produit devient clairement meilleur que les alternatives actuelles des lors qu il permet, dans un meme espace, de visualiser la tournee utile, de cocher rapidement les seances, de suivre les transmissions et de consulter ou exporter facilement les journees passees. Cette combinaison, jointe a un stockage 100 % local, constitue son principal differenciateur.

## Project Classification

- **Project Type:** mobile_app
- **Domain:** healthcare
- **Complexity:** medium
- **Project Context:** greenfield

Le domaine releve de la sante car il porte sur le suivi de patients et des informations cliniques operationnelles. La complexite est classée `medium` car l usage reste individuel, local et sans synchronisation externe, ce qui reduit fortement la complexite produit et operationnelle par rapport a une solution de sante connectee ou multi-utilisateur.

## Success Criteria

### User Success

Le produit est reussi si, des l ouverture, l utilisateur arrive directement sur l onglet `Journee`, avec le bon sous-jour preselectionne lorsque la date correspond a un lundi, jeudi ou vendredi, et avec la date reelle affichee en haut. L utilisateur doit immediatement comprendre ou il en est dans sa tournee, voir l ensemble de ses patients, ajuster son ordre reel de passage et gerer les exceptions sans changer d outil.

Le produit doit reduire la charge mentale quotidienne en remplacant plusieurs supports disperses par un cockpit unique. L utilisateur doit pouvoir pointer rapidement les seances, suivre les transmissions, consulter facilement les journees passees et retrouver les informations utiles sans reconstitution manuelle.

### Business Success

Comme il s agit d un outil personnel, le succes business est defini par des gains operationnels concrets plutot que par des metriques de croissance ou de revenu.

Le produit est considere comme utile s il permet:
- un gain de temps quotidien dans l organisation et le pointage
- une baisse perceptible des oublis
- une meilleure fiabilite du suivi des transmissions
- une meilleure continuite entre la tournee, la consultation ulterieure et le pointage mensuel
- une base locale stable et extensible pour accueillir des evolutions futures

### Technical Success

Le produit est techniquement reussi si:
- les donnees locales restent fiables et persistantes sur iPhone
- les modifications sont sauvegardees automatiquement sans friction
- l application reste fluide dans le contexte d un petit volume de patients
- les journees passees restent consultables simplement
- les exports peuvent etre generes par periode, sans reexport global systematique
- l import/export du tableau patient permet une reinitialisation propre sur un nouvel appareil

### Measurable Outcomes

Les indicateurs mesurables retenus pour la version initiale sont:
- ouverture quotidienne sur l onglet `Journee` comme point d entree principal
- pointage complet d une matinee realisable en environ 1 minute dans le cas nominal, avec une cible plafond de moins de 5 minutes meme en fin de demi-journee
- export TXT mensuel ou bimensuel genere rapidement, avec une cible de moins de 2 minutes
- consultation d une journee passee realisable immediatement depuis l application
- reduction percue du besoin de revenir a Google Tasks, Notes iPhone ou a une reconstitution manuelle

## Product Scope

### MVP - Minimum Viable Product

Le MVP comprend:
- l onglet `Journee` comme cockpit principal
- les sous-jours `lundi`, `jeudi`, `vendredi` avec date reelle visible
- la liste complete des patients dans chaque sous-jour
- l ordre persistant par jour et les trois separateurs deplacables
- le pointage `A/B` exclusif
- le `H` global de journee
- le commentaire general de journee
- les notes patient du jour via triangle depliable
- le triangle colore base sur la derniere transmission
- la fiche patient avec en-tete, transmission, antecedents, administratif et historique simple
- l ajout, l archivage et la suppression des patients
- l export TXT par periode
- l import/export du tableau patient
- le stockage 100 % local

### Growth Features (Post-MVP)

Les extensions post-MVP incluent:
- bilans libres puis bilans structures
- filtres plus avances dans `Patients`
- historique patient enrichi
- ameliorations d ergonomie si la ligne `Journee` devient trop dense
- ajustements continus du produit selon l usage reel

### Vision (Future)

A terme, le produit peut devenir un environnement personnel de suivi de tournee plus riche, tout en conservant sa sobriete:
- redaction clinique plus structuree
- aide a la preparation ou a la copie de transmissions
- enrichissement progressif des bilans
- evolution continue pilotee par l usage reel

## User Journeys

### Journey 1: Demarrer la matinee et piloter la tournee

Damien ouvre l application en arrivant sur site. L application s ouvre sur l onglet `Journee`. Si nous sommes un lundi, jeudi ou vendredi, le bon sous-jour est deja selectionne et la date reelle du jour est visible immediatement. Il n a pas besoin de reflechir a "ou il est" dans l outil: il est deja dans son cockpit.

Il voit toute sa file de patients, pas seulement ceux theoriquement prevus ce jour-la. Cette vue exhaustive lui permet de gerer les exceptions sans changer d ecran. Il deplace si necessaire les separateurs et reordonne les patients selon la realite du jour. Les priorites visibles et la couleur du triangle l aident a reperer les urgences et les transmissions anciennes.

Au fil de la matinee, ou en fin de demi-journee, il coche `A` ou `B` pour chaque patient vu. La saisie est legere, immediate, sans validation supplementaire. A ce moment-la, il ressent que l outil remplace reellement Google Tasks et ses notes eparses.

**Valeur delivree:** clarte immediate, baisse de charge mentale, pointage rapide.  
**Capacites revelees:** ouverture contextuelle sur le bon sous-jour, date visible, ordre persistant, separateurs, pointage exclusif `A/B`, priorites, triangle transmission.

### Journey 2: Gerer une exception ou une observation sans seance

Pendant la tournee, Damien peut avoir besoin de noter quelque chose sur un patient qu il n a finalement pas vu, ou dont il veut simplement garder une trace contextuelle. Depuis la ligne du patient, il touche le triangle a gauche. La ligne se deplie et lui permet de saisir une note du jour specifique a ce patient, sans quitter l ecran.

Cette note n implique pas automatiquement une seance. Si aucune case `A` ou `B` n est cochee, la note reste possible. En fin de journee, cette distinction entre patient vu et patient commente mais non vu est conservee dans le rapport journalier.

Il peut aussi renseigner le `H` global du jour et un commentaire general de journee pour contextualiser toute la matinee. Le lendemain, l ecran repart vide pour le nouveau jour, tandis que les donnees de la veille restent consultables dans l historique/export.

**Valeur delivree:** tracabilite legere, sans forcer de faux actes.  
**Capacites revelees:** notes patient du jour, `H` global, commentaire general, distinction vu/non vu, remise a zero quotidienne, conservation historique.

### Journey 3: Consulter une fiche patient et mettre a jour le dossier vivant

En cliquant sur un patient depuis `Journee` ou `Patients`, Damien ouvre une fiche compacte. Il voit d abord l identite utile: nom, prenom, etage, chambre, age, date de naissance. Tres vite dans la fiche apparaissent la derniere transmission kine et la case "transmission faite aujourd hui".

Il peut ensuite modifier directement les antecedents et les informations administratives sans passer par un mode edition separe. Chaque champ se sauvegarde automatiquement lorsqu il est quitte. Si besoin, il consulte l historique du patient pour retrouver des notes passees ou, plus tard, des bilans libres.

Tout en bas, il peut archiver un patient pour le retirer du flux actif, ou le supprimer totalement avec confirmation simple. La fiche n est donc pas un dossier passif: elle sert a la fois de reference, de maintenance et de point d entree vers l historique.

**Valeur delivree:** consultation rapide et mise a jour sans friction.  
**Capacites revelees:** fiche patient compacte, autosave, transmission, antecedents, administratif, historique, archivage/suppression.

### Journey 4: Revenir sur une periode passee et produire le pointage

Lorsqu il doit pointer ses seances au cabinet, Damien n a pas a reconstruire ses journees a partir de souvenirs ou de notes dispersees. Depuis `Reglages / Export`, il choisit une periode utile, par exemple un mois ou deux mois. L application genere un apercu TXT compact, jour par jour.

Chaque journee affiche la date, la ligne `H`, la liste compacte des patients vus dans l ordre reel du jour, puis les eventuels "pas vus" commentes. Damien peut relire directement cette periode dans l application, puis exporter le TXT pour l utiliser au cabinet, l envoyer ou l enregistrer.

Ce moment est celui ou le produit prouve sa superiorite sur l existant: il transforme une reconstitution manuelle en consultation directe, compacte et fiable.

**Valeur delivree:** pointage mensuel rapide, historique exploitable, fiabilite.  
**Capacites revelees:** consultation des journees passees, export par periode, format TXT compact, respect de l ordre du jour, conservation des commentaires utiles.

### Journey Requirements Summary

Ces parcours revelent les capacites cles suivantes:

- un cockpit `Journee` ouvert par defaut et contextuel
- une vue exhaustive de tous les patients dans chaque sous-jour
- un ordre persistant, modulable au quotidien, avec separateurs
- un pointage `A/B` exclusif, immediat et reversible
- des notes patient du jour independantes de la realisation d une seance
- un `H` global et un commentaire general de journee
- une fiche patient concue comme dossier vivant, modifiable directement
- un suivi explicite des transmissions distinct des seances
- un historique consultable et exportable par periode
- un export TXT compact aligne sur le besoin reel de pointage
- une base patient locale, archivable, reimportable et extensible

## Domain-Specific Requirements

### Compliance & Regulatory

Le produit manipule des informations de sante operationnelles relatives a des patients en EHPAD. Bien qu il ne vise pas un usage multi-utilisateur, inter-etablissements ou interconnecte, il doit etre concu avec une attention particuliere a la confidentialite, a la consultation maitrisee des donnees et a la reduction des risques de fuite.

La version initiale ne cherche pas a couvrir un cadre reglementaire complexe de type solution cloud ou dossier patient partage. Le produit reste un outil local personnel, ce qui reduit fortement les exigences de conformite structurelle, mais n annule pas l exigence de prudence sur les donnees manipulees.

### Technical Constraints

Les donnees doivent rester stockees localement sur l iPhone, sans synchronisation externe obligatoire. La fiabilite de la persistance locale est une exigence centrale. Toute modification de la fiche patient doit etre sauvegardee automatiquement a la sortie du champ, et les donnees journalieres doivent etre consultables simplement tant qu elles n ont pas ete volontairement purgees apres export.

Le produit doit fonctionner de maniere fluide sur un faible volume de patients, avec une ergonomie pensee pour un usage en situation de tournee. Les operations critiques incluent l ouverture rapide de l onglet `Journee`, le pointage `A/B`, la mise a jour des transmissions, la consultation de l historique journalier et l export par periode.

### Integration Requirements

La version initiale n exige aucune integration technique directe avec le logiciel EHPAD ni avec d autres systemes externes. En revanche, elle doit produire des sorties utilisables dans le flux de travail existant, notamment un export TXT compact pour le pointage mensuel et un tableau patient reimportable pour migration ou restauration.

### Risk Mitigations

Les principaux risques a mitiger sont:
- perte de donnees locales
- confusion entre seance realisee et transmission effectuee
- pollution d une journee par les donnees de la veille
- surcharge ergonomique sur l ecran `Journee`
- dependance a des exports trop globaux ou trop lourds

Les reponses prevues dans le produit incluent:
- export patient reimportable
- export TXT par periode
- separation explicite entre seance et transmission
- remise a zero quotidienne des donnees de jour
- interface volontairement sobre et centree sur les gestes critiques

## Mobile App Specific Requirements

### Project-Type Overview

BMAD CY est un produit mobile iPhone-first, envisage en priorite comme une PWA utilisable depuis Safari. La version initiale ne cible pas un deploiement natif App Store. Le produit est concu pour un usage individuel, local, frequent, et oriente gestes rapides en situation de tournee.

### Technical Architecture Considerations

L application doit fonctionner de maniere fiable sur iPhone avec stockage local persistant, sans dependance a une connexion reseau pour les usages principaux. L architecture doit privilegier la robustesse du mode hors ligne, la simplicite du modele de donnees local, et une interface suffisamment legere pour rester fluide sur un faible volume de patients.

Les operations critiques a optimiser sont:
- ouverture de l onglet `Journee`
- pointage `A/B`
- modification des fiches patient
- mise a jour des transmissions
- consultation des journees passees
- export TXT par periode

### Platform Requirements

- cible primaire v1: iPhone
- iPad et Mac non prioritaires en version initiale
- approche produit iPhone-first, optimisee pour une utilisation tactile rapide

### Device Permissions

La version initiale doit limiter les permissions au strict necessaire:
- acces au stockage local
- acces aux mecanismes systeme de partage/export

Ne sont pas requis en v1:
- camera
- geolocalisation
- contacts
- micro

Le micro peut etre envisage plus tard comme extension potentielle pour la dictee de bilans, mais ne fait pas partie du MVP.

### Offline Mode

Le mode hors ligne est une exigence centrale. L application doit rester pleinement utile sans reseau pour:
- consulter les patients
- pointer les seances
- modifier les donnees patient
- suivre les transmissions
- consulter l historique local
- preparer les exports

### Push Strategy

Aucune strategie de notifications push n est requise pour la version initiale.

### Implementation Considerations

Le produit doit rester sobre, rapide et stable dans un contexte de petit volume de donnees. La simplicite de l architecture technique est une exigence produit en elle-meme: eviter toute dependance non indispensable, tout mecanisme de synchronisation premature et toute permission device non necessaire.

Le passage eventuel a une application native pourra etre reevalue plus tard si des besoins nouveaux apparaissent, notamment autour des permissions avancees ou d une meilleure integration systeme.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** problem-solving MVP ultra-cible.  
Le MVP doit resoudre un probleme quotidien reel des le premier usage, sans chercher a couvrir tout le dossier patient ou toute la documentation clinique.

**Resource Requirements:** produit concu pour etre realisable avec une mise en oeuvre legere, iterative, centree sur un seul utilisateur et un petit nombre de flux critiques.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- demarrer la tournee et piloter la journee
- pointer les seances `A/B`
- noter une exception ou un commentaire patient/jour
- consulter et modifier une fiche patient
- exporter une periode pour le pointage

**Must-Have Capabilities:**
- onglet `Journee` avec sous-jours, date reelle, ordre persistant, separateurs
- pointage exclusif `A/B`
- `H` global et commentaire de journee
- note du jour par patient
- triangle colore de transmission
- fiche patient complete pour la v1 ciblee
- historique simple
- export TXT par periode
- import/export tableau patient
- archivage / suppression
- stockage 100 % local

### Post-MVP Features

**Phase 2 (Post-MVP):**
- bilans libres
- filtres enrichis dans `Patients`
- historique patient plus fin
- amelioration d ergonomie si certaines lignes deviennent trop denses
- permissions supplementaires si besoin reel emerge

**Phase 3 (Expansion):**
- bilans structures
- aide a la redaction de transmissions
- eventuelle dictee via micro
- eventuel passage natif si la PWA devient limitante

### Risk Mitigation Strategy

**Technical Risks:**
- perte de donnees locales
- limites de persistance en environnement mobile/PWA
- surcharge de l ecran `Journee`

**Mitigation:**
- export reimportable patient
- export TXT par periode
- architecture locale simple
- interface sobre et iterative

**Market Risks:**
- le produit pourrait n etre qu une amelioration marginale si l usage reel reste disperse

**Mitigation:**
- focaliser le MVP sur les gestes critiques du matin et le pointage reel

**Resource Risks:**
- tentation de trop enrichir la v1 avec bilans, filtres avances, automatisations

**Mitigation:**
- garder la phase 1 concentree sur le cockpit `Journee`, la fiche patient et les exports

## Functional Requirements

### Daily Workflow Management

- FR1: L utilisateur peut ouvrir l application directement sur l onglet `Journee`.
- FR2: L utilisateur peut voir la date reelle associee au sous-jour actuellement consulte.
- FR3: L utilisateur peut acceder a des sous-jours distincts correspondant a `lundi`, `jeudi` et `vendredi`.
- FR4: L utilisateur peut voir la liste complete des patients dans chaque sous-jour.
- FR5: L utilisateur peut utiliser un ordre de patients different pour chaque sous-jour.
- FR6: L utilisateur peut reorganiser l ordre des patients au sein de chaque sous-jour.
- FR7: L utilisateur peut conserver de maniere persistante l ordre defini pour chaque sous-jour.
- FR8: L utilisateur peut utiliser trois separateurs visuels distincts dans chaque sous-jour.
- FR9: L utilisateur peut deplacer les separateurs au sein de chaque sous-jour.
- FR10: L utilisateur peut conserver de maniere persistante la position des separateurs dans chaque sous-jour.
- FR11: L utilisateur peut voir tous les patients, y compris ceux non prevus ce jour-la, afin de gerer les exceptions.
- FR12: L utilisateur peut basculer manuellement entre les sous-jours, y compris hors du jour reel de presence.

### Session Tracking & Daily Notes

- FR13: L utilisateur peut marquer un patient comme vu selon la modalite `A`.
- FR14: L utilisateur peut marquer un patient comme vu selon la modalite `B`.
- FR15: L utilisateur ne peut attribuer qu une seule modalite `A` ou `B` par patient et par jour.
- FR16: L utilisateur peut decocher une modalite deja selectionnee pour corriger une erreur.
- FR17: Le systeme considere qu un patient non coche n a pas ete vu ce jour-la.
- FR18: L utilisateur peut saisir une note du jour specifique a un patient depuis la vue `Journee`.
- FR19: L utilisateur peut saisir une note patient meme si aucune seance n a ete pointee.
- FR20: L utilisateur peut renseigner un indicateur global `H` pour une journee parmi sept niveaux: `H---`, `H--`, `H-`, `H`, `H+`, `H++`, `H+++`. Le niveau neutre `H` est distinct d une absence de saisie.
- FR21: L utilisateur peut renseigner un commentaire general de journee.
- FR22: Le systeme reinitialise les donnees quotidiennes d un nouveau jour sans reutiliser les valeurs de la veille.
- FR23: Le systeme conserve les donnees journalieres passees pour consultation et export tant qu elles n ont pas ete purgees volontairement.
- FR24: Le systeme distingue les patients vus et les patients non vus mais commentes dans les donnees journalieres.

### Transmission Tracking

- FR25: L utilisateur peut enregistrer la date de derniere transmission pour un patient.
- FR26: L utilisateur peut indiquer depuis la fiche patient qu une transmission a ete faite aujourd hui.
- FR27: Le systeme met a jour la date de derniere transmission lorsqu une transmission est enregistree.
- FR28: Le systeme distingue explicitement le suivi des transmissions du suivi des seances.
- FR29: Le systeme peut afficher un indicateur visuel de transmission pour chaque patient dans la vue `Journee`.
- FR30: Le systeme peut calculer cet indicateur visuel a partir de l anciennete de la derniere transmission.

### Patient Record Management

- FR31: L utilisateur peut consulter une fiche individuelle pour chaque patient.
- FR32: L utilisateur peut voir dans la fiche les informations d identite et de reperage utiles du patient.
- FR33: L utilisateur peut consulter et modifier les antecedents d un patient.
- FR34: L utilisateur peut consulter et modifier les informations administratives d un patient.
- FR35: L utilisateur peut modifier directement les champs administratifs sans passer par un mode edition separe.
- FR36: Le systeme sauvegarde automatiquement les modifications lorsqu un champ est quitte.
- FR37: L utilisateur peut definir les jours habituels de prise en charge d un patient.
- FR38: L utilisateur peut definir un niveau de priorite global pour un patient.
- FR39: L utilisateur peut consulter un historique associe a un patient, du plus recent au plus ancien, reunissant date, seance A/B eventuelle et note du jour, y compris seances sans commentaire et notes sans seance.
- FR40: L utilisateur peut acceder ulterieurement a des bilans libres puis structures depuis la fiche patient.
- FR41: L utilisateur peut creer un nouveau patient depuis l onglet `Patients`.
- FR42: Le systeme exige au minimum le nom et le prenom pour creer un patient.
- FR43: Le systeme ajoute automatiquement un nouveau patient aux sous-jours actifs prevus.
- FR44: L utilisateur peut archiver un patient.
- FR45: Le systeme retire automatiquement un patient archive du flux `Journee`.
- FR46: L utilisateur peut consulter les patients archives depuis l onglet `Patients`.
- FR47: L utilisateur peut supprimer definitivement un patient avec confirmation simple.

### Patient List & Filtering

- FR48: L utilisateur peut consulter une liste generale de patients distincte de l onglet `Journee`.
- FR49: Le systeme presente cette liste generale par ordre alphabetique par defaut.
- FR50: L utilisateur peut ouvrir la fiche patient depuis la liste generale.
- FR51: L utilisateur peut acceder a des filtres depuis un bouton dedie dans l onglet `Patients`.
- FR52: L utilisateur peut appliquer des filtres metier a la liste generale.
- FR53: L utilisateur peut filtrer les patients archives.
- FR54: L utilisateur peut filtrer les patients selon des criteres administratifs ou cliniques simples.
- FR55: Le systeme peut proposer des filtres predefinis, notamment autour des prescriptions proches de leur fin.

### History, Export & Import

- FR56: L utilisateur peut consulter et corriger les journees passees dans l application, a toute date explicitement ouverte (seances, notes, H et commentaire).
- FR57: L utilisateur peut consulter une periode passee regroupant plusieurs journees.
- FR58: L utilisateur peut generer un export TXT compact des journees sur une periode choisie.
- FR59: Le systeme structure l export TXT jour par jour.
- FR60: Le systeme respecte l ordre reel du sous-jour dans l export TXT.
- FR61: Le systeme peut inclure les commentaires patient et de journee dans l export TXT.
- FR62: Le systeme peut distinguer dans l export les patients vus et les patients non vus mais commentes.
- FR63: L utilisateur peut previsualiser le contenu d export avant partage ou enregistrement.
- FR64: L utilisateur peut exporter un tableau patient reimportable.
- FR65: L utilisateur peut importer un tableau patient dans une application vide.
- FR66: Le systeme reconstruit la base patient a partir de ce tableau importe.
- FR67: Le systeme place automatiquement les patients importes dans les sous-jours prevus avec un ordre initial neutre.
- FR68: L utilisateur peut supprimer les donnees journalieres anciennes apres export.
- FR69: Le systeme conserve la base patient independamment de la purge des journaux quotidiens.

### Local Data & Application Behavior

- FR70: Le systeme fonctionne sans synchronisation externe obligatoire.
- FR71: Le systeme conserve les donnees localement sur l iPhone.
- FR72: Le systeme permet un usage principal hors ligne.
- FR73: Le systeme permet de consulter, modifier et exporter les donnees sans dependre d un service distant.
- FR74: Le systeme limite les acces device aux permissions necessaires au fonctionnement v1.

### Detailed Interaction & Output Rules

- FR75: Le systeme affiche la priorite d un patient dans la vue `Journee` juste apres le nom du patient lorsque cette information est visible dans la ligne.
- FR76: Le systeme affiche par defaut uniquement le nom du patient dans la vue `Journee`, et ajoute l initiale du prenom uniquement en cas d homonymie.
- FR77: Le systeme place l acces a la note patient du jour et l indicateur de transmission au debut de la ligne patient dans la vue `Journee`.
- FR78: Le systeme fournit une zone tactile elargie pour l interaction avec le triangle de debut de ligne dans la vue `Journee`.
- FR79: Le systeme laisse visible en permanence la poignee de reorganisation dans la vue `Journee`.
- FR80: Le systeme ouvre automatiquement le sous-jour correspondant lorsqu il est lance un jour reel de presence.
- FR81: Le systeme conserve le sous-jour precedent tant qu aucun nouveau vrai jour de presence ne justifie un basculement automatique.
- FR82: Le systeme associe chaque sous-jour consulte aux dates correspondantes de la semaine courante.
- FR83: Le systeme encode dans l export TXT la modalite `A/B` par la casse du debut du nom du patient.
- FR84: Le systeme structure chaque journee exportee au format TXT avec une ligne de date, une ligne compacte de signes et commentaire general, une ligne continue des patients vus et une ligne `pas vus :` lorsque necessaire. L indicateur `H` est exporte uniquement par ses signes ASCII: `---`, `--`, `-`, chaine vide, `+`, `++`, `+++` respectivement. Le prefixe `H` n est jamais ajoute par l exporteur; le commentaire general est conserve meme au niveau neutre. Si signes et commentaire sont tous deux vides, la ligne est omise; si seul le commentaire est present, il est exporte seul.
- FR85: Le systeme inclut dans l export TXT les patients vus sur une seule ligne continue en conservant l ordre du sous-jour consulte.
- FR86: Le systeme place les patients non vus mais commentes dans une section distincte `pas vus :` dans l export TXT.
- FR87: Le systeme applique un code couleur de transmission fonde sur l anciennete de la derniere transmission en utilisant quatre etats visuels distincts. Si la date est inconnue, le triangle est gris avec un libelle accessible explicite.

## Non-Functional Requirements

<!-- Clarification utilisateur du 2026-09-15: FR20 et FR84 precisent les sept niveaux H et leur encodage TXT sans prefixe H. Cette decision remplace les exemples H++ du brainstorming initial. La ligne est omise lorsque signes et commentaire sont tous deux vides (confirme par Damien). -->

### Performance

- NFR1: L application doit ouvrir l onglet `Journee` sans latence perceptible dans des conditions nominales d usage.
- NFR2: Les actions critiques de pointage `A/B`, d ouverture de note patient et de modification de fiche doivent produire un retour immediat a l utilisateur.
- NFR3: La consultation d une periode passee et la generation d un export TXT doivent rester rapides pour un historique couvrant plusieurs mois.
- NFR4: Le produit doit rester fluide avec un faible volume de donnees, correspondant a environ 12 a 15 patients actifs et a plusieurs mois d historique journalier.

### Reliability

- NFR5: Les donnees patient et journalieres doivent etre persistees localement de maniere fiable.
- NFR6: Toute modification d un champ editable doit etre sauvegardee automatiquement a la sortie du champ.
- NFR7: Le systeme ne doit pas reutiliser les donnees quotidiennes d un jour precedent lors de l ouverture d un nouveau jour.
- NFR8: Les ordres de sous-jours, positions des separateurs, statuts patients et informations administratives doivent rester coherents apres fermeture et reeouverture de l application.
- NFR9: Les exports doivent refleter fidelement les donnees visibles dans l application au moment de leur generation.

### Security & Confidentiality

- NFR10: Les donnees doivent rester stockees localement sur l appareil sans synchronisation externe obligatoire.
- NFR11: Le produit doit limiter les acces device et les echanges externes aux seuls mecanismes necessaires au fonctionnement v1.
- NFR12: Les exports doivent etre declenches explicitement par l utilisateur, jamais envoyes automatiquement.
- NFR13: Le produit doit reduire le risque d exposition involontaire des donnees en evitant les integrations externes non essentielles dans la version initiale.

### Offline & Availability

- NFR14: Les usages principaux doivent rester disponibles sans connexion reseau.
- NFR15: L utilisateur doit pouvoir consulter, pointer, modifier et preparer ses exports sans dependre d un service distant.
- NFR16: L absence de reseau ne doit pas empecher l utilisation courante du produit.

### Usability

- NFR17: Le produit doit privilegier une interface sobre, lisible et compatible avec un usage rapide en situation de tournee.
- NFR18: Les fonctions critiques doivent rester accessibles depuis un nombre reduit d ecrans et d actions.
- NFR19: Le produit doit minimiser la charge mentale en evitant les confirmations, modes intermediaires et ecrans superflus pour les actions courantes.

### Accessibility

- NFR20: L interface doit rester utilisable en conditions de lecture rapide sur iPhone, avec contrastes suffisants et elements tactiles exploitables.
- NFR21: Les elements interactifs critiques, notamment le triangle de note/transmission, les cases `A/B` et les poignees de reorganisation, doivent etre dimensionnes pour un usage tactile fiable.

### Data Portability

- NFR22: Le produit doit fournir un export patient reimportable pour permettre une migration ou une restauration simple.
- NFR23: Le produit doit fournir des exports TXT par periode sans imposer de reexport global complet.
- NFR24: La purge des donnees journalieres anciennes ne doit pas affecter la base patient active.

### Domain Display Conventions

- NFR25: Le code couleur de transmission doit rester lisible et coherent avec les seuils suivants: rouge au-dela de 2 mois, orange entre 1,5 et 2 mois, vert fonce entre 1 et 1,5 mois, vert clair en dessous de 1 mois.
- NFR26: Le format TXT exporte doit rester compact, stable et lisible avec une grammaire constante entre les periodes exportees.
