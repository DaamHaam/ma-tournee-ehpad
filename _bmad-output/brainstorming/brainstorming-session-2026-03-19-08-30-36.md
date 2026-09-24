---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Application iPhone locale pour gerer des patients en EHPAD, organiser la tournee quotidienne, suivre les seances A/B, tracer les transmissions et conserver un historique clair.'
session_goals: 'Explorer la structure produit, l ergonomie quotidienne, la logique metier, les risques, l import/export et les options de priorisation afin de concevoir un outil simple, rapide et fiable pour un usage individuel en EHPAD.'
selected_approach: 'ai-recommended'
techniques_used: ['Question Storming', 'Morphological Analysis', 'Reverse Brainstorming']
ideas_generated: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67]
context_file: '/Users/damienhamon/Documents/DEV/VIBE CODING/BMAD CY/_bmad/bmm/data/project-context-template.md'
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** Damien
**Date:** 2026-03-19 08:30:36

## Session Overview

**Topic:** Application iPhone locale pour gerer des patients en EHPAD, organiser la tournee quotidienne, suivre les seances A/B, tracer les transmissions et conserver un historique clair.
**Goals:** Explorer la structure produit, l ergonomie quotidienne, la logique metier, les risques, l import/export et les options de priorisation afin de concevoir un outil simple, rapide et fiable pour un usage individuel en EHPAD.

### Context Guidance

Le cadre de brainstorming privilegie l exploration de problemes utilisateur, idees de fonctionnalites, approches techniques, experience utilisateur, valeur business, differenciation, risques techniques et metriques de succes.

### Session Setup

Le besoin exprime est celui d un outil personnel, local-first, sans synchronisation externe, optimise pour une demi-journee de prise en charge d environ 12 a 15 patients. Les domaines fonctionnels deja identifies sont la gestion patient, la priorisation visuelle, l organisation par jour, le suivi quotidien des seances, les transmissions, l historique, l import/export et l ajout de patients.

Le champ `H` est traite comme un champ autonome de commentaire supplementaire pour la journee, et non comme une variable d evolution clinique.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Application iPhone locale pour EHPAD avec forte contrainte de rapidite d usage, de clarte clinique et de stockage 100 pourcent local

**Recommended Techniques:**

- **Question Storming:** pour reveler les questions cachees qui influenceront le plus l ergonomie, la securite d usage et la logique metier quotidienne.
- **Morphological Analysis:** pour construire plusieurs architectures fonctionnelles credibles en combinant vues, modules, actions et comportements.
- **Reverse Brainstorming:** pour identifier comment l application pourrait devenir lente, ambiguë ou risquee, puis transformer ces echecs potentiels en garde-fous concrets.

**AI Rationale:** La sequence part d un besoin deja riche et detaille. Elle ouvre d abord les angles morts, explore ensuite l espace des solutions de maniere systematique, puis termine par une chasse active aux irritants et risques de terrain afin de produire une application simple en surface mais robuste en pratique.

## Technique Execution

### Question Storming

**Captured ideas after first exploration:**

**[Category #1]**: Pointage Instantane
_Concept_: La vue principale doit afficher tous les patients en moins de deux secondes et permettre de cocher immediatement la modalite A ou B sans ressaisie ni validation lourde. L action de pointage doit enregistrer la donnee au moment du geste, meme en contexte presse.
_Novelty_: L ergonomie est pensee d abord comme un outil de tournee en mouvement, pas comme un dossier patient classique centre sur les formulaires.

**[Category #2]**: Double Vue Metier
_Concept_: L application doit distinguer une liste de planification par jour de semaine et une liste de pointage quotidien contenant tout le monde. La premiere sert a visualiser l intention et les priorites, la seconde sert a la realite du terrain et doit rester exhaustive.
_Novelty_: On ne force pas la logique planning sur la logique d execution; on accepte explicitement l ecart entre le prevu et le reel.

**[Category #3]**: Fiche Patient Actionnable
_Concept_: Chaque patient doit ouvrir une fiche consultable et editable rapidement, avec informations de base, antecedents, reglages de prise en charge, puis un bouton plus pour ajouter plus tard bilans et notes specifiques conserves en local. La fiche devient a la fois reference, espace de mise a jour et point d entree vers l historique.
_Novelty_: La fiche n est pas seulement informative, elle sert de carrefour entre consultation rapide, maintenance du dossier et enrichissement clinique progressif.

**[Category #4]**: Reversibilite Locale
_Concept_: Le stockage local ne suffit pas; il faut aussi une strategie simple d export des donnees patient et surtout des pointages journaliers dans un format texte exploitable pour le pointage mensuel du cabinet. L export doit etre assez leger pour pouvoir etre envoye par mail sans transformation complexe.
_Novelty_: La fonction d export n est pas une commodite annexe mais une protection contre la perte et un pont direct vers votre processus administratif reel.

**[Category #5]**: PWA de Terrain
_Concept_: Une approche PWA via Safari peut fournir un acces direct depuis l ecran d accueil tout en conservant un fonctionnement hors connexion et un stockage local persistant. Cela oriente fortement les choix techniques et les risques a valider.
_Novelty_: Le canal de livraison lui-meme devient un element de brainstorming car il influence la robustesse du stockage, de l installation et des exports sur iPhone.

**[Category #6]**: Ecran du Matin Minimal
_Concept_: L ecran d ouverture ne doit pas afficher les details patients, mais uniquement la liste journaliere globale avec, pour chaque patient, les actions de pointage `A`, `B`, le champ `H` et les commentaires du jour. Les informations detaillees n apparaissent qu apres avoir touche le patient.
_Novelty_: On separe radicalement l ecran de production rapide du dossier patient pour eviter toute surcharge cognitive au debut de la tournee.

**[Category #7]**: Transmission Hors Pointage
_Concept_: Le fait d avoir vu un patient et le fait d avoir effectue une transmission sont deux evenements distincts. La transmission doit pouvoir etre marquee dans la fiche patient via une case "transmission faite aujourd hui", ce qui met a jour la date de derniere transmission.
_Novelty_: Le modele metier refuse de fusionner a tort suivi de seance et suivi administratif, ce qui evite des confusions de tracabilite.

**[Category #8]**: Tableau de Surveillance des Transmissions
_Concept_: Une liste generale dediee au suivi des transmissions doit permettre de consulter depuis combien de temps chaque patient n a pas eu de transmission, avec tri par anciennete et rond de couleur associe. Cette vue sert de radar temporel plutot que d espace de saisie clinique.
_Novelty_: On introduit un troisieme espace specialise, centre sur la vigilance documentaire plutot que sur la visite ou la fiche.

**[Category #9]**: H Global de Journee
_Concept_: L option `H` est un marqueur global de la journee et non une information liee a un patient. Elle doit apparaitre une seule fois sur l ecran journalier, avec les sept choix definis, idealement en haut de l ecran pour cadrer rapidement la tonalite du jour.
_Novelty_: On preserve la signification du champ `H` en l ancrant au niveau journee, ce qui evite de le diluer dans des saisies patient par patient.

**[Category #10]**: Tiroir Patient du Jour
_Concept_: Chaque ligne patient dans la liste generale peut comporter a gauche un petit triangle depliable. Ce tiroir ouvre un espace compact permettant de saisir une note du jour specifique a ce patient, distincte du pointage `A/B`.
_Novelty_: On garde la liste principale tres rapide, tout en offrant un second niveau de detail contextuel sans quitter l ecran de tournee.

**[Category #11]**: Double Couche de Commentaires
_Concept_: L application doit distinguer clairement un commentaire general de journee et une note de jour par patient. Le commentaire general peut se trouver en bas de l ecran journalier, tandis que la note patient vit dans le tiroir de la ligne concernée.
_Novelty_: Cette separation evite de melanger ambiance generale de la matinee, evenements transverses et observations liees a une personne precise.

**[Category #12]**: Notes Rapides vs Bilans Structures
_Concept_: Les notes du jour saisies depuis la liste journaliere sont des annotations legeres et contextuelles. Les bilans seront ajoutes plus tard dans le developpement, mais eux aussi sont destines a etre saisis en presence du patient pendant la tournee, depuis la fiche patient via un bouton plus.
_Novelty_: On distingue la profondeur de saisie sans opposer temps reel et documentation plus riche; les deux peuvent vivre dans le flux de tournee, a des niveaux differents de structure.

**[Category #13]**: Historique Journalier Compact
_Concept_: L historique d une journee doit afficher la date, la valeur `H`, le commentaire general du jour, puis une liste compacte de tous les patients avec leur eventuel commentaire du jour entre parentheses. Le rendu doit etre suffisamment sobre et lineaire pour etre exportable tel quel en texte.
_Novelty_: L historique n est pas pense comme un tableau lourd mais comme un journal lisible et directement reutilisable pour les besoins administratifs.

**[Category #14]**: Codage A/B Par Casse
_Concept_: Dans l historique exporte, la modalite est encodee de facon ultra-legere: nom du patient commencant par une majuscule si `A`, et par une minuscule si `B`. Aucun marqueur supplementaire n est necessaire.
_Novelty_: On remplace une notation plus verbeuse par un code visuel minimaliste, concis et adapte a un export TXT compact.

**[Category #15]**: Export TXT Cumulatif
_Concept_: Toutes les journees doivent pouvoir etre exportees dans un seul fichier texte simple, avec passages a la ligne, en conservant une structure compacte et repetitive. Le format d historique doit donc etre pense des le depart comme une sortie texte exploitable sans nettoyage.
_Novelty_: Le format d affichage de l historique et le format d export ne sont plus deux choses differentes; on conçoit une seule grammaire de trace, lisible a l ecran et reusable hors de l app.

**[Category #16]**: Onglet Journee a Sous-Jours
_Concept_: L onglet `Journee` comporte un sous-menu interne permettant de basculer rapidement entre `lundi`, `jeudi` et `vendredi`, chacun affichant la liste complete des patients mais avec un ordre propre. Le jour selectionne devient un tableau de bord operatoire specifique a cette journee-type.
_Novelty_: On ne derive pas simplement l ordre depuis une planification abstraite; on donne a chaque jour son propre paysage de travail persistant.

**[Category #17]**: Ordre Persistant Par Jour
_Concept_: Chaque sous-jour doit memoriser son propre ordre de patients, modifiable par glisser-deposer via les trois petits traits situes a droite de chaque ligne. Cet ordre reste stable jusqu a nouvelle modification.
_Novelty_: La priorisation n est pas seulement un attribut, elle est encodee dans la chorégraphie meme de la liste selon chaque journee-type.

**[Category #18]**: Separateurs Repositionnables
_Concept_: Chaque journee doit pouvoir contenir au moins deux ou trois separateurs horizontaux libres, deplacables au meme titre que les patients, afin de structurer visuellement la tournee en blocs ou niveaux de priorite. Ces separateurs sont memorises dans l ordre du jour concerne.
_Novelty_: On introduit des objets de structure non patients dans la liste, ce qui transforme la liste en veritable plan de passage editable.

**[Category #19]**: Priorite Globale, Ordre Local
_Concept_: Les points d exclamation restent des attributs globaux du patient et apparaissent donc dans toutes les vues, tandis que l ordre varie selon le jour. La priorite statique et la priorite contextuelle coexistent sans se confondre.
_Novelty_: Le systeme distingue une urgence inherente au patient d une strategie d organisation propre a la journee.

**[Category #20]**: Onglet Patients Exploratoire
_Concept_: En plus de l onglet `Journee`, un onglet `Patients` reste necessaire pour consulter la liste generale et appliquer plus tard des filtres riches, par exemple par medecin prescripteur, bilans ou autres criteres dossier. Cet espace sert a l exploration et a l administration, pas au pointage rapide.
_Novelty_: On separe un cockpit de production quotidienne d une base de consultation et de tri plus analytique.

**[Category #21]**: Triangle-Transmission
_Concept_: Le petit triangle depliable situe a gauche de chaque patient dans l onglet `Journee` peut aussi servir d indicateur de transmission grace a sa couleur, calculee depuis la date de derniere transmission saisie dans la fiche patient. Ainsi, le meme element combine acces a la note du jour et radar visuel sur l anciennete des transmissions.
_Novelty_: Un seul micro-composant remplit deux fonctions critiques sans alourdir la ligne: ouvrir la note et signaler la vigilance documentaire.

**[Category #22]**: V1 a Trois Onglets
_Concept_: La version 1 se limite a trois onglets principaux: `Journee`, `Patients` et `Reglages / Export`. Les fonctions d historique et de transmissions dediees sont absorbees provisoirement par ces trois espaces pour garder une surface simple.
_Novelty_: Le produit privilegie une compression intelligente des usages plutot qu une multiplication prematuree des sections.

**[Category #23]**: Sous-Jours Preconfigures
_Concept_: Les sous-onglets `lundi`, `jeudi`, `vendredi` representent les jours fixes de presence de l utilisateur et peuvent etre codes en dur au depart. L application doit preselctionner automatiquement le bon sous-jour selon la date courante, avec possibilite de bascule manuelle.
_Novelty_: Le systeme assume un rythme professionnel reel et stable au lieu d imposer une abstraction de planning trop generique des la v1.

**[Category #24]**: Reglages comme Hub d Export
_Concept_: L onglet `Reglages / Export` doit centraliser la generation du fichier TXT d historique et proposer plusieurs sorties simples: affichage local, enregistrement sur l iPhone, envoi par mail et, si faisable techniquement, depot vers un service comme Google Drive.
_Novelty_: Les reglages ne sont pas qu un espace de preferences; ils deviennent le point de sortie administratif du systeme local.

**[Category #25]**: Liste Patients a Filtres Metier
_Concept_: L onglet `Patients` doit evoluer vers une liste generale avec filtres simples puis filtres metier predéfinis, comme les prescriptions se terminant dans moins de trois mois. Cette vue sert a l anticipation et au suivi transversal, distinctement du pilotage journalier.
_Novelty_: On fait de la liste generale un outil de surveillance proactive, pas seulement un annuaire.

**[Category #26]**: Pointage Exclusif Reversible
_Concept_: Pour un patient donne et une date donnee, les modalites `A` et `B` sont strictement exclusives. Un second appui sur la modalite deja selectionnee doit la decocher instantanement, ce qui permet de corriger une erreur sans friction.
_Novelty_: L interaction adopte une logique de bascule tres legere, adaptee a la realite d un pointage rapide sur mobile.

**[Category #27]**: Patient Non Vu = Silence
_Concept_: Si un patient n est pas vu, aucune case n est cochee. L absence de pointage vaut information, sans necessiter d etat supplementaire explicite.
_Novelty_: On garde la semantique la plus economique possible en evitant d ajouter un troisieme statut inutile.

**[Category #28]**: Note Sans Seance
_Concept_: Une note du jour patient peut etre saisie meme si aucune modalite `A` ou `B` n a ete cochee. Cela permet de tracer un evenement, une information contextuelle ou une absence de prise en charge sans forcer une seance fictive.
_Novelty_: Le modele accepte que la trace narrative et l acte realise soient deux choses distinctes.

**[Category #29]**: Sous-Jours Ancres a la Semaine Courante
_Concept_: Meme lorsqu on consulte l application un jour non prevu comme le samedi, les sous-onglets `lundi`, `jeudi`, `vendredi` doivent pointer vers les dates correspondantes de la semaine courante. Cela permet de completer ou corriger un oubli recent sans ambiguite majeure.
_Novelty_: On remplace un calendrier complet par une logique d ancrage hebdomadaire beaucoup plus legere, calibree pour un usage de rattrapage realiste.

**[Category #30]**: Export des Non-Vus Commentes
_Concept_: Dans le rapport TXT d une journee, les patients vus figurent d abord dans la liste principale. Si un patient n a ni `A` ni `B` mais possede un commentaire du jour, il doit apparaitre dans une section separee placee plus bas, apres une ligne vide, sous l etiquette `patient non vu:`.
_Novelty_: Le format texte distingue clairement l activite realisee de l information contextuelle, sans perdre les observations saisies hors seance.

**[Category #31]**: Entete Clinique Compacte
_Concept_: La fiche patient doit commencer par le nom et prenom en grand, puis juste en dessous, en plus petit, l etage, la chambre, l age et la date de naissance. L objectif est d offrir une lecture identitaire immediate sans encombrer le reste de la fiche.
_Novelty_: On concentre les informations de reperage physique et biographique dans une entete compacte, lisible d un coup d oeil au lit du patient.

**[Category #32]**: Bloc Transmission Avant Administratif
_Concept_: La fiche patient doit faire remonter tres haut la zone `derniere transmission kine`, avec la date connue et une case pour indiquer qu une transmission a ete faite aujourd hui. Les antecedents sont egalement presents rapidement dans la fiche, avant les elements plus administratifs.
_Novelty_: La fiche est ordonnee selon la frequence et l utilite terrain des actions, pas selon une logique de formulaire administratif classique.

**[Category #33]**: Historique et Plus en Actions Hautes
_Concept_: En haut a droite de la fiche patient, un bouton `plus` permet d ajouter plus tard un bilan libre puis d autres bilans structures. A gauche de ce bouton, un bouton `historique` ouvre une vue chronologique inverse regroupant notes journalieres patient, bilans libres et futurs bilans filtres.
_Novelty_: Au lieu d enfouir l historique et les ajouts dans le corps de la fiche, on les transforme en actions de premier plan orientees consultation et saisie rapide.

**[Category #34]**: Syntaxe TXT Ultra-Compacte
_Concept_: Une journee exportee doit tenir sur quelques lignes tres compactes: une ligne de date au format `JJ/MM/AAAA`, une ligne `H` fusionnant la valeur et le commentaire de jour si present, puis une ligne listant les patients vus avec leurs commentaires entre parentheses lorsque necessaire. Les patients non vus mais commentes sont resumes ensuite sur une ligne `pas vus :`.
_Novelty_: Le format abandonne toute verbosite pour devenir presque une notation personnelle, lisible vite et exploitable sans retraitement.

**[Category #35]**: H et Commentaire Fusionnes
_Concept_: Au lieu de separer `H:` et `Commentaire jour:`, la ligne de jour combine directement les deux sous une forme courte, par exemple `H++ retour d hospitalisation`. Si rien n est renseigne, la ligne peut rester minimale.
_Novelty_: On traite l entete de jour comme une phrase compacte, pas comme un mini formulaire exporte.

**[Category #36]**: Patients Vus sur Ligne Continue
_Concept_: Les patients vus d une journee sont exportes sur une seule ligne continue, separes par des espaces, avec commentaire local entre parentheses uniquement si necessaire. La modalite `A/B` reste encodee par la casse du debut du nom.
_Novelty_: L export prend la forme d une liste textuelle fluide, beaucoup plus dense qu un rendu ligne par ligne traditionnel.

**[Category #37]**: Export Respectant l Ordre du Jour
_Concept_: Dans le fichier TXT, les patients doivent apparaitre dans le meme ordre que celui visible dans la liste du sous-jour correspondant. L export prolonge ainsi la logique de tournee au lieu de la reclasser artificiellement.
_Novelty_: Le texte exporte devient une trace fidele de l organisation reelle, pas seulement un relevé des patients vus.

**[Category #38]**: Desambiguïsation par Initiale
_Concept_: Si deux patients partagent le meme nom de famille, la liste et l export doivent afficher l initiale du prenom pour les differencier. On garde ainsi la compacite du nom de famille comme etiquette principale, tout en evitant les ambiguïtés.
_Novelty_: La regle de nommage reste minimaliste mais devient suffisamment robuste pour un usage reel avec homonymes.

**[Category #39]**: Double Sortie de Fiche
_Concept_: Tout en bas de la fiche patient, deux gros boutons doivent etre disponibles: `Archiver le patient` et `Supprimer totalement`. L archivage retire le patient du flux actif sans detruire ses donnees, tandis que la suppression efface completement la fiche.
_Novelty_: On assume explicitement deux intentions metier distinctes au lieu de les cacher derriere une seule action ambiguë.

**[Category #40]**: Archives Reconsultables
_Concept_: Un patient archive doit rester accessible depuis l onglet `Patients` via un filtre dedie affichant les patients archives. Depuis cette fiche archivee, on peut encore consulter les informations puis, si necessaire, proceder ensuite a la suppression definitive.
_Novelty_: L archivage devient une zone tampon reversible de consultation, pas un simple cimetière opaque.

**[Category #41]**: Creation Complete a Seuil Minimal
_Concept_: L ajout d un patient se fait depuis un bouton `plus` dans l onglet `Patients`, avec un formulaire deja assez complet. Toutefois, seuls le nom et le prenom sont obligatoires pour valider la creation; tous les autres champs peuvent etre renseignes plus tard.
_Novelty_: On conserve un parcours d ajout rapide meme quand le schema de fiche est riche, en separant completude du formulaire et obligation de saisie.

**[Category #42]**: Affichage Resume, Edition Administrative
_Concept_: Dans la fiche patient, certaines informations telles que chambre, date de naissance, etage et medecin traitant doivent etre visibles en petit et en grise dans l entete informative, sans etre modifiables directement a cet endroit. Leur edition se fait plus bas dans une section `administratif` dediee.
_Novelty_: On dissocie clairement lecture rapide et zone d edition, ce qui stabilise la fiche et reduit les manipulations accidentelles.

**[Category #43]**: Double Export, Deux Fonctions
_Concept_: L application doit proposer deux familles d export distinctes: un export TXT compact pour le pointage mensuel, et un export complet en tableau reimportable contenant l ensemble des donnees patients et journalières pour migration ou restauration lors d un changement d iPhone.
_Novelty_: L export n est plus un bloc unique; il repond a deux usages radicalement differents, l un administratif et l autre patrimonial.

**[Category #44]**: Suppression Apres Externalisation
_Concept_: La suppression totale d un patient est autorisee avec une simple confirmation, mais elle intervient dans une logique ou les donnees ont deja vocation a avoir ete exportees au moins une fois et conservees a part. La securite repose davantage sur la discipline d export que sur une friction excessive dans l interface.
_Novelty_: On protege sans infantiliser: la confirmation reste legere, car la vraie sauvegarde est externalisee avant la purge.

**[Category #45]**: Pas de Rappel d Export en V1
_Concept_: La version 1 ne force pas de rappel ou d alerte du type `pensez a exporter`. L utilisateur garde la maitrise volontaire de ce rituel de sauvegarde.
_Novelty_: On privilegie une interface sobre et non intrusive, en reservant les nudges de sauvegarde a une evolution future si le besoin emerge.

**[Category #46]**: Archivage = Sortie du Flux Journalier
_Concept_: Un patient archive doit disparaitre automatiquement des sous-jours `lundi`, `jeudi`, `vendredi` et donc du tableau de bord operatoire. Il reste consultable uniquement depuis la liste generale via les filtres archives.
_Novelty_: L archivage modifie immediatement le terrain de travail quotidien sans detruire la memoire du dossier.

**[Category #47]**: Export Patrimonial Reduit au Noyau Patient
_Concept_: L export complet reimportable ne doit contenir qu un tableau patient avec les donnees structurantes: identite, coordonnees utiles, medecin, antecedents et informations administratives pertinentes. Les journees, notes quotidiennes et bilans n en font pas partie, car ils ont vocation a etre deja exportes et exploites ailleurs.
_Novelty_: On redefinit la sauvegarde longue duree comme une reconstruction du carnet patient actif, pas comme une image totale de tout l historique operationnel.

**[Category #48]**: Reimport de Reinitialisation
_Concept_: Le reimport de ce tableau patient est pense pour etre effectue dans une application vide, avec une logique simple de remplacement total. Aucun mecanisme de fusion complexe n est necessaire en v1.
_Novelty_: On supprime d avance toute complexite de synchronisation ou de dedoublonnage, car le cas d usage cible est la remise en route propre sur un nouvel appareil.

**[Category #49]**: Liste Generale Alphabetique puis Filtres
_Concept_: L onglet `Patients` s ouvre par defaut sur un tri alphabetique simple. Des filtres permettent ensuite d explorer la base selon des besoins metier comme la fin proche de prescription, le medecin traitant, l etage ou d autres criteres a venir.
_Novelty_: On choisit une porte d entree universelle et stable, puis on reserve l intelligence contextuelle aux filtres plutot qu au tri par defaut.

**[Category #50]**: Liste Generale Minimaliste
_Concept_: Dans la version 1, chaque ligne de l onglet `Patients` n affiche que le nom et le prenom. Les autres informations restent dans la fiche patient ou dans les filtres, afin de ne pas surcharger la vue generale.
_Novelty_: On pousse la sobriete jusqu au bout pour faire de la liste generale un point d entree neutre et tres lisible, distinct du tableau de bord `Journee`.

**[Category #51]**: Filtres en Panneau Valide
_Concept_: L onglet `Patients` doit proposer en haut un bouton `Filtres` ouvrant un menu ou panneau de selection, puis l utilisateur valide ses choix pour appliquer le filtrage. Les criteres ne sont donc pas exposes en permanence a l ecran.
_Novelty_: On preserve une liste generale tres epuree tout en gardant une puissance de recherche contextuelle activable a la demande.

**[Category #52]**: Pas de Recherche pour Petit Volume
_Concept_: La version 1 n a pas besoin de barre de recherche dans l onglet `Patients`, car la file active reste tres petite, autour d une quinzaine de patients. Le tri alphabetique et les filtres suffisent largement.
_Novelty_: On retire une fonctionnalite souvent ajoutee par reflexe, car elle n apporte pas de valeur dans un contexte a faible cardinalite.

**[Category #53]**: Edition Administrative Directe
_Concept_: Dans la section `administratif` de la fiche patient, les champs doivent etre directement modifiables sans passer par un mode `Modifier` puis `Enregistrer`. La mise a jour se fait de facon fluide, au fil de la consultation.
_Novelty_: La fiche adopte une logique de carnet vivant plutot qu un cycle de formulaire verrouille, ce qui colle mieux a un usage mobile individuel.

**[Category #54]**: Sauvegarde au Sortir du Champ
_Concept_: Toute modification faite dans un champ de la fiche patient doit etre sauvegardee automatiquement des que l utilisateur quitte ce champ. Aucun bouton global `Enregistrer` n est requis pour la version 1.
_Novelty_: La persistance devient presque invisible, ce qui renforce la sensation d un outil fiable et immediat plutot que d une application administrative a etapes.

**[Category #55]**: Trois Separateurs Vides Par Jour
_Concept_: Chaque sous-jour doit contenir exactement trois separateurs, sans titre ni texte, representes comme une ligne simple ou double. Ils servent uniquement a structurer visuellement la liste des patients.
_Novelty_: On donne a l utilisateur des balises d organisation tres legeres, sans transformer la liste en systeme de categories nommees.

**[Category #56]**: Separateurs Deplacables et Persistants
_Concept_: Les separateurs se deplacent dans la liste exactement comme les patients et leur position est memorisee pour chaque jour. Par defaut, ils commencent en haut, puis l utilisateur les place selon sa logique de tournee.
_Novelty_: Les separateurs deviennent des objets de chorégraphie du parcours journalier, pas de simples ornements fixes.

**[Category #57]**: Aucune Maintenance Automatique des Separateurs
_Concept_: Si un patient est archive ou si un separateur devient temporairement inutile, l application ne le repositionne pas et ne le supprime pas. L utilisateur conserve la main sur cette structure et peut laisser les separateurs inutilises en bas de liste.
_Novelty_: On refuse les automatismes correctifs qui brouilleraient le plan de passage personnel construit manuellement.

**[Category #58]**: Sous-Jour Auto-Selectionne au Bon Moment
_Concept_: Quand l application est ouverte un jour de presence reel, par exemple le jeudi, l onglet `Journee` doit s ouvrir directement sur le sous-jour correspondant de la semaine en cours, sans demander de confirmation. Le comportement doit sembler evident et immediat.
_Novelty_: L application agit comme un assistant contextuel silencieux qui anticipe le bon cadre de travail.

**[Category #59]**: Persistance du Sous-Jour Jusqu au Changement Reel
_Concept_: Si l utilisateur etait positionne sur `lundi`, ce sous-jour reste affiche tant qu on n a pas bascule dans un autre vrai jour de presence, par exemple jeudi. L application n a pas besoin de remettre systematiquement un sous-jour par defaut chaque matin si le contexte hebdomadaire n a pas vraiment change.
_Novelty_: On melange intelligemment memoire d usage et repere calendaire, au lieu d imposer soit une persistance aveugle, soit un recalcul agressif.

**[Category #60]**: Date Reelle Toujours Visible
_Concept_: L ecran `Journee` doit afficher la date exacte correspondant au sous-jour actuellement consulte afin d eviter toute ambiguïte, notamment lors d un rattrapage ou d une consultation hors jour habituel.
_Novelty_: Le sous-jour n est pas seulement une etiquette de routine; il est toujours relie explicitement a une date reelle.

**[Category #61]**: Commentaire General = Etat Final du Jour
_Concept_: Le commentaire general de journee est un champ libre unique representant l etat final du jour. Il peut etre saisi, complete ou modifie pendant la journee concernee, sans historique de versions.
_Novelty_: On privilegie une trace simple et finale plutot qu un journal d edition inutilement complexe.

**[Category #62]**: Note Patient Ephémère puis Archivee
_Concept_: La note du jour patient est un texte libre unique rattaché a la journee en cours. Elle reste modifiable pendant cette journee, puis disparait de la vue active le lendemain tout en restant sauvegardee dans l historique et les comptes rendus journaliers.
_Novelty_: La note est traitee comme un outil de terrain temporaire qui se transforme ensuite en trace archivee, sans encombrer le present.

**[Category #63]**: Fenetre de Modification Limitee au Jour Meme
_Concept_: Les commentaires de journee et les notes patient peuvent etre completes ou corriges le soir meme, mais ne doivent plus etre editables le lendemain dans le flux normal. Le lendemain, on consulte la trace plutot qu on ne la reecrit.
_Novelty_: On introduit une cloture temporelle legere qui protege la fiabilite du journal sans imposer de workflow lourd.

**[Category #64]**: Jour Nouveau, Ecran Neuf
_Concept_: A chaque nouvelle date, l ecran `Journee` doit repartir entierement vide pour les donnees quotidiennes: `A/B`, `H`, commentaire general et notes du jour par patient. Seuls persistent l ordre du sous-jour, les separateurs, les informations structurelles du patient et les indicateurs de transmission.
_Novelty_: On traite chaque journee comme une feuille fraiche, ce qui elimine tout risque de confusion entre trace passee et travail du jour.

**[Category #65]**: Import = Presence dans Tous les Sous-Jours
_Concept_: Lors d un import initial du tableau patient, chaque patient doit etre automatiquement ajoute aux trois sous-jours `lundi`, `jeudi` et `vendredi`, puisque tous les patients figurent dans chaque journee-type. L import alimente donc a la fois la base `Patients` et les tableaux de bord journaliers.
_Novelty_: L import n est pas une simple alimentation de fiche; il precompose immediatement le terrain operatoire complet de l application.

**[Category #66]**: Ordre Initial Alphabetique
_Concept_: Apres import, l ordre de depart dans chacun des sous-jours doit etre alphabetique. Cet ordre sert de base neutre avant tout remaniement manuel avec glisser-deposer.
_Novelty_: On commence avec une structure universelle et lisible, puis l intelligence contextuelle vient ensuite du rearrangement quotidien par l utilisateur.

**[Category #67]**: Tableau Patient Reimportable
_Concept_: Le tableau patient servant d import/export patrimonial peut inclure: nom, prenom, date de naissance, etage, chambre, medecin traitant, date debut prescription, date fin prescription, cotation, ALD, mutuelle, 100 pourcent, jours habituels `L/J/V`, priorite, antecedents, date derniere transmission et statut archive ou non. L age n a pas besoin d etre stocke comme colonne puisqu il peut etre calcule.
_Novelty_: Le schema d echange se limite au noyau durable du dossier patient, suffisamment riche pour reconstruire l activite, mais assez compact pour rester simple a maintenir.

**Question Storming Summary**

- La V1 converge vers trois onglets: `Journee`, `Patients`, `Reglages / Export`.
- `Journee` est le cockpit principal, avec sous-jours `lundi`, `jeudi`, `vendredi`, ordre persistant, trois separateurs, pointage `A/B`, `H` global, commentaire general et notes patient depliables.
- `Patients` reste une liste generale alphabetique, minimale, avec filtres et acces aux fiches.
- La fiche patient privilegie l identite, la transmission et les antecedents avant l administratif, avec historique et futurs bilans en actions hautes.
- Deux exports distincts emergent: un TXT ultra-compact pour le pointage mensuel et un tableau patient reimportable pour migration/restauration.

### Morphological Analysis

**Goal:** decomposer l application en dimensions de conception puis comparer plusieurs combinaisons plausibles.

**First architecture choices captured:**

- **Navigation principale:** Option C - `Journee` / `Patients` / `Reglages-Exports`
- **Structure de `Journee`:** Option C - sous-jours visibles en permanence, type mini-onglets
- **Ligne patient dans `Journee`:** Option C - triangle colore, nom, `A`, `B`, priorite visible, poignee de reordre
- **Placement priorite dans `Journee`:** juste apres le nom, avec possibilite de la retirer si la ligne devient trop chargee sur iPhone
- **Etiquette patient dans `Journee`:** nom seul par defaut, initiale du prenom uniquement en cas d homonymie
- **Poignee de reordre:** toujours visible en v1, avec possibilite d introduire plus tard un mode reorganisation si la ligne parait trop chargee
- **Triangle colore dans `Journee`:** option B - tout a gauche avec zone tactile elargie, pour combiner indicateur de transmission et ouverture de note patient sans mauvais clics
- **Fiche patient:** Option A confirmee - en-tete compacte, transmission, antecedents, administratif, avec actions hautes `Historique` et `+`
- **Bloc transmission:** visible haut dans la fiche, juste sous l entete
- **Bloc antecedents:** grand champ texte libre modifiable directement
- **Bloc administratif:** ouvert par defaut, non replie
- **Jours habituels `L/J/V`:** cases a cocher simples
- **Priorite patient:** modifiable directement dans la fiche par appui sur `!`, `!!`, `!!!`
- **Onglet `Reglages / Export`:** trois actions visibles - voir le TXT, exporter le TXT, importer/exporter le tableau patient
- **Export TXT:** apercu dans l app avant partage ou enregistrement
- **Suppression totale patient:** bouton supprimer puis confirmation simple
- **Historique patient:** ordre chronologique inverse, plus recent en haut
- **Bilan libre plus tard:** texte libre d abord, formulaires structures ensuite
- **Import tableau patient:** remplace la base patient actuelle dans une application vide
- **Export:** Option C - TXT compact + tableau patient + apercu export dans l app
- **Stockage local:** Option B - local + export manuel declenche depuis reglages
- **Export TXT par periode:** l apercu et l export doivent permettre de choisir une periode utile, par exemple un mois ou deux mois, avec un rendu cumule jour par jour sur cette plage
- **Retention journaliere:** apres export, les donnees journalieres de plus de 4 mois peuvent etre supprimees de l application

## Idea Organization and Prioritization

### Thematic Organization

**Theme 1: Cockpit Journee**
_Focus: execution ultra-rapide de la tournee quotidienne_

- Onglet `Journee` comme point d entree principal
- Mini-onglets `lundi`, `jeudi`, `vendredi` avec date reelle visible
- Tous les patients presents dans chaque sous-jour
- Ordre persistant par jour, trois separateurs fixes et deplacables
- Ligne patient compacte: triangle colore, nom, priorite, `A`, `B`, poignee de reordre
- `H` global de journee, commentaire general, notes patient depliables

**Pattern Insight:** Le coeur de valeur de l application n est pas la fiche patient mais la fluidite de pointage dans un tableau de bord quotidien tres compacte.

**Theme 2: Dossier Patient Actionnable**
_Focus: consultation rapide, edition directe et tracabilite legere_

- En-tete clinique compacte
- Bloc transmission haut dans la fiche
- Antecedents modifiables directement
- Bloc administratif editable en direct avec sauvegarde au sortir du champ
- Historique patient separe
- Bouton `+` pour futurs bilans
- Archivage et suppression en bas de fiche

**Pattern Insight:** La fiche doit agir comme un carnet vivant, stable et rapide a consulter, sans devenir un formulaire lourd.

**Theme 3: Export, Retention et Reversibilite**
_Focus: proteger les donnees sans complexifier l usage quotidien_

- Export TXT compact par periode
- Export respectant l ordre du jour
- Tableau patient reimportable
- Reimport par remplacement dans application vide
- Suppression possible des donnees journalieres apres export au-dela de 4 mois
- Difference nette entre export metier et export patrimonial

**Pattern Insight:** L application locale reste simple parce qu elle dissocie la trace administrative courte et la base patient durable.

**Theme 4: Simplicite Deliberee de la V1**
_Focus: retirer tout ce qui ne sert pas directement le terrain_

- Trois onglets seulement
- Pas de recherche
- Liste generale minimaliste
- Filtres en panneau valide
- Pas de rappel d export
- Pas de fusion complexe au reimport
- Pas d automatisme sur les separateurs

**Pattern Insight:** La force du produit vient autant de ce qui est retire que de ce qui est ajoute.

### Breakthrough Concepts

- **Triangle-Transmission:** un seul micro-composant combine indicateur de transmission et ouverture de note patient du jour.
- **Codage A/B par casse:** la modalite est encodee dans le nom exporte, ce qui rend le TXT tres compact.
- **Jour Nouveau, Ecran Neuf:** chaque date repart proprement sans residu visuel ni donnees quotidiennes persistantes.
- **Export par periode avec retention:** l application garde un coeur leger tout en restant compatible avec le pointage mensuel reel.

### Prioritization Results

**Top Priority Ideas**

1. **Cockpit `Journee` complet**
   Raison: c est l espace qui concentre la valeur quotidienne immediate.
2. **Fiche patient rapide et editable**
   Raison: elle soutient la consultation, la transmission et la maintenance du dossier sans casser le rythme.
3. **Export TXT compact par periode**
   Raison: il relie l application au processus mensuel reel de pointage.

**Quick Win Opportunities**

- Liste generale alphabetique minimaliste
- Filtres simples sur l onglet `Patients`
- Archivage avec sortie automatique des sous-jours
- Priorite patient modifiable directement

**Breakthrough Concepts for Later**

- Bilans libres puis structures
- Filtres avances dans l historique patient
- Eventuel mode reorganisation si la ligne `Journee` devient trop chargee
- Eventuelle reactivation d un patient archive

### Action Planning

**Priority 1: Cockpit `Journee`**

1. Fixer le layout exact de la ligne patient sur iPhone
2. Modéliser la structure de donnees d une journee reelle et des trois sous-jours
3. Implementer le pointage exclusif `A/B`, les notes patient du jour et le `H` global

**Resources Needed:** schema de donnees, ecrans maquettes basse fidelite, choix technique de stockage local  
**Timeline:** premier bloc de mise en oeuvre  
**Success Indicators:** pointage realisable en quelques secondes, comprehension immediate de l ecran, aucune confusion entre seance et transmission

**Priority 2: Fiche Patient**

1. Fixer l ordre final des blocs
2. Implementer l edition directe avec autosave au sortir du champ
3. Ajouter transmission, antecedents, administratif, historique et actions de fin de fiche

**Resources Needed:** schema patient, composants de formulaire, logique d archivage  
**Timeline:** deuxieme bloc de mise en oeuvre  
**Success Indicators:** consultation rapide, modification sans friction, distinction nette entre lecture et edition

**Priority 3: Export TXT et Export Tableau**

1. Formaliser exactement le format TXT final
2. Definir les colonnes du tableau patient reimportable
3. Ajouter dans `Reglages / Export` l apercu, l export et l import

**Resources Needed:** generateur texte, parseur import tableau, interface de partage iPhone/PWA  
**Timeline:** troisieme bloc de mise en oeuvre  
**Success Indicators:** export lisible sans retouche, reimport propre dans application vide, retention journaliere possible

## Session Summary and Insights

**Key Achievements:**

- 67 idees explicites formulees et precisees
- une architecture v1 claire en trois onglets
- une distinction metier robuste entre seance, transmission, note du jour, historique et export
- une strategie de stockage local realiste, avec sortie administrative et sauvegarde patrimoniale separees

**Session Reflections:**

Le point fort majeur de la session est la clarte du centre de gravite produit: l application n est pas un dossier medical generique, mais un outil de tournee personnel, local, rapide et discipline. Le cockpit `Journee` porte la valeur principale. La fiche patient et les exports servent ce cockpit, ils ne le remplacent pas.

Le second enseignement fort est la recherche active de sobriete: peu d onglets, peu de champs visibles en meme temps, pas de recherche inutile, pas de confirmations excessives, pas de synchronisation externe. Cette austerite est en realite un avantage structurel du produit.

## Final Session Wrap-Up

**Session Outcome:** brainstorming complete avec convergence suffisante pour passer a une phase de specification ou de cadrage technique.

**Recommended Next Step:** transformer cette synthese en document produit exploitable, par exemple brief produit, PRD, specification rapide ou architecture de solution.
