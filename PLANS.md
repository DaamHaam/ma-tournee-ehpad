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
3. **Historique du patient depuis le haut de la fiche** : une petite icône en haut à droite de la fiche ouvre l'historique complet du patient, dans l'ordre : notes du jour, séances, bilans et transmissions (copiés ou non, signalés comme tels).
   - À préciser : plus récent en haut ? remplace-t-il le bouton « Séances (n) » du bas de la fiche, ou s'y ajoute-t-il ? les tests NS (✓ recopié) y figurent-ils aussi ?

## Plan 3 — pour plus tard

(rien pour l'instant)

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
