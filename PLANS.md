# Plans — Ma tournée EHPAD

Règles : `charte-agents/CHARTE.md` (plans numérotés, rien n'est codé sans ordre explicite). Le même plan peut toucher l'organisateur de bilans : sa part est notée dans `organisateur-bilans/PLANS.md`.

## État

- **Plan en préparation** : Plan 1
- **Plan à tester** : livraisons v0.39.0 à v0.42.0 (avant l'adoption des plans), voir « Tests à valider »
- **Revue de code** : pas à jour — `revue-ok` est resté avant la v0.39.0 (commits v0.39.0 → v0.42.0 non revus)

## Plan 1 — en préparation

1. **SPPB** (Short Physical Performance Battery), comme test normal suivi dans le temps.
   - Dans l'organisateur : rubrique « SPPB » (domaine Équilibre, étiquette « test ») : 3 temps d'équilibre (pieds joints, semi-tandem, tandem), vitesse de marche sur 4 m, 5 levers de chaise ; points 0 à 4 par épreuve selon le barème, score total /12 calculé ; compte rendu au score seul, comme le Tinetti.
   - Dans Ma tournée : chronomètre unique sur chaque épreuve ; le chronométrage des 5 levers remplit aussi le test « 5 levers de chaise » ; relier le SPPB à l'historique des ★ (`MEASURE_FIELDS`).
   - Test NS plus tard, peut-être (il n'est pas encore dans NetSoin) : à décider quand il y sera.
   - À préciser : barème exact retenu (seuils des points), ordre des épreuves, ce qui s'écrit dans le compte rendu en plus du score.
2. **Favori Chrome « Remplir le TUG » pour NetSoin** : sur l'iPhone, un bouton « Copier pour NetSoin » met les 5 durées dans le presse-papiers ; sur le Mac (Chrome, presse-papiers partagé avec l'iPhone), un favori cliqué sur la page de NetSoin répartit les 5 chiffres dans les 5 cases du TUG.
   - À préciser : fonctionnement à montrer et à essayer ensemble (installation du favori, test sur la vraie page NetSoin). Tinetti (cases à cocher) : plus tard.
3. **« Changer le sens du compte rendu des notes »** : sujet oublié, à retrouver ou à abandonner.

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
