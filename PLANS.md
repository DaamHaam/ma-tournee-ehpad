# Plans — Ma tournée EHPAD

Règles : `charte-agents/CHARTE.md` (plans numérotés, rien n'est codé sans ordre explicite). Le même plan peut toucher l'organisateur de bilans : sa part est notée dans `organisateur-bilans/PLANS.md`.

## État

- **Plan en préparation** : Plan 2
- **Plan à tester** : Plan 1 (v0.43.0), et les livraisons v0.39.0 à v0.42.0, voir « Tests à valider »
- **Revue de code** : pas à jour — `revue-ok` est resté avant la v0.39.0 (commits v0.39.0 → v0.43.0 non revus)

## Plan 1 — à tester (livré en v0.43.0, organisateur v0.8.0)

SPPB dans les repères (points et total calculés depuis le catalogue), couleurs de fin d’ordonnance revues, pointage définitif corrigeable après coup, niveaux d’alerte « ! » « !! » « !!! », favori Chrome « Remplir le TUG » pour NetSoin. Tests à faire : voir « Tests à valider ».

## Plan 2 — en préparation

1. **Suivi des retraits du pointage définitif** — pour équilibrer les patients vus mais non pointés (remplace le post-it à bâtons).
   - Idée (2026-11-26) : une **date de début de la session de pointage** (ex. 1er novembre pour un pointage octobre-novembre) ; à côté de chaque patient du pointage, un petit chiffre = nombre de fois où il est passé d'orange (B) à « Non pointés » depuis cette date ; le chiffre monte au fil des jours, on voit qui a déjà souvent sauté.
   - Décidé : le chiffre seulement sur les boutons des patients ; pas de récapitulatif en tête de la vue (s'il en faut un un jour, en dehors de la liste, pour pouvoir copier la liste seule) ; on ne compte que les oranges retirés, pas les bleus.
   - Décidé : la période d'export du pointage reprend par défaut la date de début de session, et sa fin par défaut = début + 2 mois ronds (ex. 1er octobre → fin novembre) ; les deux restent modifiables (1 ou 3 mois).
   - Les retraits sont déjà enregistrés jour par jour (`entry.unpointed`) : le compte se calcule sans rien stocker de plus que la date de début.
2. **Ordre des « ★ Dernières mesures »** (bilan libre) : d'abord les tests faits le plus de fois ; à nombre égal, le plus récent en haut.
   - À préciser : même ordre pour la ★ de la fiche patient (aujourd'hui : plus fréquents d'abord, sans départager par la date).
   - Décidé (2026-11-26) : **même liste** dans le bilan et dans la ★ de la fiche : pour chaque test, la dernière valeur, sa date et le nombre de fois où il a été fait en tout (pas d'historique sur 3 mois). Les plus fréquents en haut, puis du plus récent au plus ancien. Les mesures du jour même ne sont pas montrées dans le bilan.
4. **Bug — position de la liste de la journée** : en revenant d'un bilan (glissement sur le côté), la liste repart en haut ; depuis la fiche patient, elle revient au bon endroit. Elle doit rester là où elle était (souvent pour repartir sur le même patient).
   - Cause probable : la page du bilan bloque le défilement de la page entière, ce qui remet la position à zéro ; correction prévue : mémoriser la position de la journée en la quittant et la rétablir au retour.
   - Constaté aussi en quittant le bilan par la flèche ‹. À corriger dans le Plan 2, pas avant.
6. **Évals / transmissions jamais faites** : un patient sans aucun bilan est oublié. À côté des petits triangles de couleur (bilan ancien), afficher un **triangle rouge sans chiffre** pour un patient qui n'a jamais eu de bilan.
   - À préciser plus tard : où (journée, liste, fiche), éval et transmission séparées ou non.
5. **Historique du patient depuis le haut de la fiche** : une petite icône en haut à droite de la fiche ouvre l'historique complet du patient, dans l'ordre : notes du jour, séances, bilans et transmissions (copiés ou non, signalés comme tels).
   - À préciser : plus récent en haut ? remplace-t-il le bouton « Séances (n) » du bas de la fiche, ou s'y ajoute-t-il ? les tests NS (✓ recopié) y figurent-ils aussi ?
7. **Journée : bouton « + » de la même taille que A et B.**
8. **Journée : date mise en évidence quand c'est aujourd'hui** (couleur ou signe distinctif dans l'en-tête), pour ne pas pointer par erreur un autre jour consulté.
9. **Bug — mise à jour de l'application** : fermer puis rouvrir sur l'iPhone ne montre pas la dernière version. Cause probable : iOS ne fait que remettre l'application au premier plan ; la nouvelle version se télécharge en arrière-plan mais la page n'est pas rechargée. Correction prévue : vérifier la mise à jour au retour au premier plan et recharger dès qu'elle est prête (sans perdre une saisie en cours).
10. **Fiche patient — nouvelle mise en page** :
   - En haut : flèche de retour seule (sans la date), plus grande, qui revient là où on en était.
   - Puis le **nom** du patient, avec la ★ et une petite icône « Séances » (remplace le bouton « Séances » du bas, voir point 5) ; dessous, la **chambre** si elle est renseignée.
   - Puis les niveaux d'alerte (– ! !! !!!) et, dessous, une case pas trop grande marquée seulement « Motif ».
   - Puis Éval et Trans.
   - Les champs rarement modifiés (nom, prénom, chambre, etc.) tout en bas de la fiche.
11. **Nouvelle prescription** : saisir la date suffit, la durée vaut 1 an d'office sans rien cocher ; elle reste modifiable ensuite.
12. **Historique des séances : texte sur toute la largeur** ; les boutons Copier et Supprimer passent au-dessus du texte.
13. **Suivi des tests NS à revoir** : un Tinetti recopié à la main dans NetSoin n'est pas compté (« Dernier test NS : jamais »), car seul le ✓ vert du panneau NS (onglet Bilans → bouton « NS ») l'enregistre ; copier le bilan ne suffit pas.
   - Damien réfléchit à un meilleur suivi des bilans NS. À reprendre avec lui : rendre le ✓ plus visible, ou proposer « Recopié dans NetSoin ? » au moment de la copie, ou permettre de saisir la date d'un test NS déjà fait.

## Plan 3 — pour plus tard

- **Mode express** (à porter dans la charte) : pendant les visites, Damien lance des idées sans répondre aux détails ; l'agent note, répond « OK » et garde ses questions pour plus tard.

## À faire sur le Mac

- Production Convex (même contenu que le développement, site et applications branchés dessus) et suppression de la branche `dev` de l'organisateur : `organisateur-bilans/docs/A_FAIRE_MAC.md`.

## Tests à valider

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
