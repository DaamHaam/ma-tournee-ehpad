# Plans — Ma tournée EHPAD

Règles : `charte-agents/CHARTE.md` (plans numérotés, rien n'est codé sans ordre explicite). Le même plan peut toucher l'organisateur de bilans : sa part est notée dans `organisateur-bilans/PLANS.md`.

## État

- **Plan en préparation** : Plan 1
- **Plan à tester** : livraisons v0.39.0 à v0.42.0 (avant l'adoption des plans), voir « Tests à valider »
- **Revue de code** : pas à jour — `revue-ok` est resté avant la v0.39.0 (commits v0.39.0 → v0.42.0 non revus)

## Plan 1 — en préparation

1. **SPPB** (Short Physical Performance Battery), comme test normal suivi dans le temps.
   - Barème (fiche fournie le 2026-11-26), score total /12 :
     - **Équilibre** (/4), dans l'ordre, chacun 10 s : pieds joints (10 s → 1 pt ; moins → 0 et on passe à la marche) ; semi-tandem (10 s → +1 ; moins → 0 et on passe à la marche) ; tandem (10 s → +2 ; 3 à 9 s → +1 ; moins de 3 s → 0).
     - **Vitesse de marche sur 4 m** (/4), rythme normal, meilleur de deux essais : moins de 4,82 s → 4 ; 4,82 à 6,20 s → 3 ; 6,21 à 8,70 s → 2 ; plus de 8,70 s → 1 ; incapable → 0.
     - **Lever de chaise** (/4) : pré-test (se lever une fois bras croisés ; incapable → 0 et arrêt), puis 5 levers bras croisés le plus vite possible : moins de 11,19 s → 4 ; 11,20 à 13,69 s → 3 ; 13,70 à 16,69 s → 2 ; plus de 16,7 s → 1 ; plus de 60 s ou incapable → 0.
   - Dans l'organisateur : rubrique « SPPB » (domaine Équilibre, étiquette « test »), questions de chaque épreuve, points et total calculés par l'application, compte rendu au score seul (comme le Tinetti).
   - Dans Ma tournée : chronomètre unique sur chaque épreuve (10 s pour l'équilibre, chronomètre pour la marche et les levers) ; le chronométrage des 5 levers remplit aussi le test « 5 levers de chaise » ; lien avec l'historique des ★ (`MEASURE_FIELDS`).
   - Test NS plus tard peut-être (pas encore dans NetSoin).
   - À préciser :
     - le barème utilise des centièmes (4,82 s ; 11,19 s…) alors que la règle actuelle est « secondes entières, sans dixièmes » : garder les centièmes pour la marche et les levers du SPPB, ou appliquer le barème sur les secondes entières (un 4,9 s compterait 4 s) ;
     - les 5 levers du SPPB se font bras croisés : est-ce aussi la façon dont vous faites le test « 5 levers de chaise » habituel (sinon, ne pas remplir l'un avec l'autre) ;
     - marche sur 4 m : noter les deux essais, ou seulement le meilleur.
2. **Favori Chrome « Remplir le TUG » pour NetSoin** : sur l'iPhone, un bouton « Copier pour NetSoin » met les 5 durées dans le presse-papiers ; sur le Mac (Chrome, presse-papiers partagé avec l'iPhone), un favori cliqué sur la page de NetSoin répartit les 5 chiffres dans les 5 cases du TUG.
   - À préciser : fonctionnement à montrer et à essayer ensemble (installation du favori, test sur la vraie page NetSoin). Tinetti (cases à cocher) : plus tard.

## Plan 2 — pour plus tard

(rien pour l'instant)

## À faire sur le Mac

- Production Convex (même contenu que le développement, site et applications branchés dessus) et suppression de la branche `dev` de l'organisateur : `organisateur-bilans/docs/A_FAIRE_MAC.md`.

## Tests à valider

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
