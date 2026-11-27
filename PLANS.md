# Plans — Ma tournée EHPAD

Règles : `charte-agents/CHARTE.md` (plans numérotés, rien n'est codé sans ordre explicite). Le même plan peut toucher l'organisateur de bilans : sa part est notée dans `organisateur-bilans/PLANS.md`.

## État

- **Plan à tester** : Plan 2 (v0.44.0, organisateur v0.9.0), Plan 1 (v0.43.0), et les livraisons v0.39.0 à v0.42.0, voir « Tests à valider »
- **Revue de code** : pas à jour — `revue-ok` est resté avant la v0.39.0 (commits v0.39.0 → v0.43.0 non revus)

## Plan 1 — à tester (livré en v0.43.0, organisateur v0.8.0)

SPPB dans les repères (points et total calculés depuis le catalogue), couleurs de fin d’ordonnance revues, pointage définitif corrigeable après coup, niveaux d’alerte « ! » « !! » « !!! », favori Chrome « Remplir le TUG » pour NetSoin. Tests à faire : voir « Tests à valider ».

## Plan 2 — à tester (livré en v0.44.0, organisateur v0.9.0)

Décisions du 2026-11-27 : « ok pour tout » sur les propositions ci-dessous.

1. **Pointage — suivi des retraits** : champ « Début de session » en haut de la vue Pointage ; sur chaque bouton, petit chiffre = nombre de fois où le patient est passé d'orange (B) à « Non pointés » depuis cette date (bleus non comptés) ; pas de récapitulatif. L'export du pointage prend par défaut ce début et une fin à début + 2 mois ronds, tous deux modifiables.
2. **★ identiques dans le bilan et la fiche** : pour chaque test, la dernière valeur, sa date et le nombre de fois en tout ; plus fréquents en haut, puis du plus récent au plus ancien. Le bilan ne montre pas les mesures du jour même.
3. **Bug — position de la liste de la journée** perdue au retour d'un bilan (glissement ou flèche ‹) : mémoriser la position en quittant la journée et la rétablir au retour.
4. **Triangle rouge sans chiffre** pour un patient qui n'a jamais eu ni éval ni trans, partout où il y a déjà les petits triangles.
5. **En haut de la fiche, près du nom et de la ★** : une icône Historique (remplace le bouton « Séances » du bas ; plus récent en haut : notes, séances, bilans copiés ou non, ✓ NS des tests validés) et un petit « + » qui fait comme le « + » de la journée (bilan libre du jour).
6. **Journée : « + » de la même taille que A et B.**
7. **Journée : date mise en évidence quand c'est aujourd'hui.**
8. **Bug — mise à jour sur l'iPhone** : vérifier la mise à jour au retour au premier plan et recharger dès qu'elle est prête, sans perdre une saisie.
9. **Fiche — mise en page** : grande flèche de retour seule (revient là où on en était) ; nom avec ★, Historique et « + », chambre dessous si renseignée ; niveaux d'alerte et petite case « Motif » ; Éval, Trans (et NS, point 13) ; champs rarement modifiés (nom, prénom, chambre…) tout en bas.
10. **Nouvelle prescription** : la date suffit, durée 1 an d'office, modifiable ensuite.
11. **Historique des séances sur toute la largeur**, boutons Copier et Supprimer au-dessus du texte.
12. **Journée : « !!! » = fond orange seul**, sans les points d'exclamation ; le motif reste affiché.
13. **Suivi des tests NS à part** : ligne « NS » dans la fiche à côté d'Éval et Trans (date du dernier test NS) ; triangle NS dans la journée sur le modèle des autres ; à la copie d'un bilan contenant un test NS, question « Recopié dans NetSoin ? » ; saisie à la main de la date d'un test NS déjà fait.
14. **TUG par étapes — retour visuel** : numéro d'étape en grand, signal à chaque toucher, chaque durée remplie dans sa case dès la fin de l'étape.
15. **TUG par étapes — ★ par étape** : durée précédente et date en petit à côté de chaque case.
16. **Bouton Pause sur tous les chronomètres** (TUG simple et par étapes, 10 m, 6 min…), puis reprise.
17. **Test des 10 m — aide technique facultative** (rollator, déambulateur à roues, canne…), reprise dans le compte rendu (« 18 s, 33 pas, avec rollator ») ; d'abord dans le catalogue de l'organisateur.

## Plan 3 — pour plus tard

- **Mode express** (à porter dans la charte) : pendant les visites, Damien lance des idées sans répondre aux détails ; l'agent note, répond « OK » et garde ses questions pour plus tard.

## À faire sur le Mac

- Production Convex (même contenu que le développement, site et applications branchés dessus) et suppression de la branche `dev` de l'organisateur : `organisateur-bilans/docs/A_FAIRE_MAC.md`.

## Tests à valider

Plan 2 (v0.44.0) :
- Mise à jour : après une publication, revenir dans l'application (sans la tuer) suffit à passer à la nouvelle version (vérifier le numéro en bas à droite) ; jamais de rechargement pendant un bilan ou une saisie.
- Journée : date verte « Aujourd'hui » ; un autre jour en orange avec « Revenir à aujourd'hui » ; « + » de la même taille que A et B.
- Journée : descendre dans la liste, ouvrir un bilan, revenir (flèche ‹ ou glissement) : la liste est au même endroit.
- Journée : triangle rouge sans chiffre pour un patient sans aucune éval ni trans ; sigle « NS » vert (moins de 3 mois) ou orange.
- Journée : « !!! » = fond orange seul, motif affiché, sans points d'exclamation.
- Fiche : grande flèche de retour ; nom avec ★, icône Historique et « + » ; chambre dessous ; « ! » puis « Motif » ; Éval, Trans, NS ; nom, prénom, chambre, priorité tout en bas.
- Fiche : « + » ouvre le bilan du jour (retour à la fiche) ; Historique sur toute la largeur, Copier / Supprimer au-dessus du texte, ✓ NS des tests validés.
- Fiche : NS — case du jour, et toucher la date sous NS pour ajouter la date d'un test NS déjà fait (ex. le Tinetti du 20/11).
- ★ : même liste dans la fiche et dans le bilan (dernière valeur, date, « n fois ») ; plus fréquents en haut, puis plus récents.
- Prescription : saisir seulement la date → durée 1 an affichée, fin calculée ; durée et unité modifiables.
- Copier un bilan libre avec Tinetti ou TUG pas encore validé : question « recopié dans NetSoin ? » ; Oui = ✓ NS (date NS, Éval).
- TUG par étapes : « 1/5 », « 2/5 »… en grand, signal à chaque toucher, chaque case remplie au fur et à mesure ; ★ de chaque étape (durée et date du dernier TUG par étapes).
- Chronomètres : bouton Pause (Ⅱ) puis Reprendre (▶) ; le temps repart d'où il était (TUG, 10 m, 6 min…).
- Pointage : « Début de session » en haut ; un B descendu dans « Non pointés » affiche un petit chiffre sur le bouton (nombre de retraits depuis le début) ; export proposé du début à deux mois ronds.
- Test des 10 m (repères) : case « Aide technique » ; compte rendu « Test des 10m : 18sec et 33 pas, avec rollator ».

Plan 1 et livraisons précédentes :

Plan 1 (v0.43.0, iPhone et Mac) :
- SPPB : « + » des repères → SPPB ; un chronomètre par épreuve (✕ annule) ; marche et levers affichés au dixième ; points et score /12 justes selon la fiche ; ✨ écrit « SPPB : x/12 » ; les 5 levers remplissent aussi « 5 levers de chaise » ; le SPPB apparaît dans les ★.
- Fin d’ordonnance : tableau jaune (< 3 mois), orange (< 1 mois), rouge (dépassée) ; liste, fiche et journée : seulement orange et rouge (sigle « Ordo »).
- Pointage définitif : un rouge touché descend dans « Non pointés » ; dans « Non pointés », n’importe quel patient se remonte en bleu, orange ou rouge ; la journée et son export ne changent pas ; l’export du pointage suit les corrections.
- Alertes : en haut à droite de la fiche, –, !, !!, !!! et motif ; les anciens « Attend une séance » sont devenus « ! » ; dans la journée, l’alerte disparaît une fois le patient vu (A ou B) et revient les jours suivants ; « !!! » : ligne orange dans la journée, nom orange dans la fiche.
- **Bloquant pour s’en servir** — favori « Remplir le TUG » : l’installer dans Chrome sur le Mac (Réglages → « NetSoin : remplir le TUG d’un clic »), puis sur la vraie page du TUG de NetSoin : « Copier pour NetSoin » sur l’iPhone, clic sur le favori sur le Mac, les 5 cases se remplissent.

Livraisons v0.39.0 → v0.42.0 :

Livraisons v0.39.0 → v0.42.0 (iPhone) :
- Bilan libre seul écran de bilan : le « + » de la journée ouvre directement le bilan ; les anciens bilans (Tinetti, marche / équilibre, tests rapides) restent lisibles et copiables dans l'onglet Bilans.
- Deux traits fins en haut du bilan : glisser ou toucher pour passer de Bilan à Repères.
- Repères : « + » au bout des domaines (bilans prédéfinis, tests seuls), étiquette « nom ✕ » pour revenir à tout, domaines sur deux lignes, « Voir ce qui est rempli », « Reprendre de la fiche » dans les antécédents.
- Chronomètre unique : un toucher lance, barre en haut avec Arrêter / Étape suivante et ✕ qui annule ; valeur mise directement dans le champ ; plus aucun dixième.
- TUG par étapes (5 durées + total) depuis le TUG et depuis le Tinetti (épreuve de marche).
- Tinetti : score seul (sans interprétation), item 9 à la fin, case « Détail des cotations ».
- ✨ fusionne repères et dictée (même sans dictée) ; sans clé ni réseau, ✨ ajoute les lignes des repères.
- Onglet Bilans : bouton « NS » (gros chiffres, commentaire commun), ✓ vert par test qui coche Éval ; bouton NS vert quand tout est recopié.
- Fiche : « Dernier test NS » ; ★ près du nom (liste en pleine largeur) qui ouvre le bilan du jour sur le test choisi.
- Liste des résidents : filtres Priorité et Dernier test NS.
- Copier un bilan libre coche Trans.
