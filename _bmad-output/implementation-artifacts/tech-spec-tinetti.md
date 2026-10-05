# Test de Tinetti — lot B (v0.13.0)

## Objectif

Premier test standardisé de la refonte des bilans : la grille de Tinetti sous les yeux en plein écran, cotée d’un appui, avec la dictée en parallèle. Le score est calculé par l’application ; la synthèse par IA (fusion dicté + coché, correction, DeepSeek via OpenRouter) viendra au lot C.

## Grille

POMA de Tinetti (1986), 28 points, libellés de la grille habituelle de l’utilisateur (`bmad-cy/src/domain/tinetti.ts`) :
- Équilibre, 9 items, /16 (item 8 en deux lignes : pas, stabilité).
- Marche, 7 items, /12 (item 11 en quatre lignes : pied D et pied G, dépasse et se détache du sol).
- Interprétation de la grille : < 26, problème d’équilibre ou de marche ; < 19, risque de chute multiplié par cinq. Affichée seulement pour une cotation complète.

## Parcours

- « + » sur une carte de la Journée propose « Bilan libre » ou « Test de Tinetti ».
- Écran plein écran : en-tête (retour, nom et prénom, total, copier, ✕), onglets Équilibre x/16 · Marche y/12 · Dictée, volets qu’on fait glisser horizontalement (ou qu’on choisit par l’onglet), micro en bas sur tous les volets.
- Chaque ligne se cote d’un appui ; un second appui sur la même cotation l’efface.
- Les cotations du dernier Tinetti antérieur du patient sont marquées ★, avec son total et sa date.
- Le volet Dictée reçoit le texte dicté (éditeur enrichi, sans clavier, ↵ pour aller à la ligne).
- ✕ quitte en remettant le test comme à l’ouverture (supprimé s’il était nouveau) ; ‹ quitte en gardant.

## Résultat et copie

Résultat court mis en forme : « **Tinetti** (souligné) : **total/28** (équilibre x/16, marche y/12) », interprétation, items non cotés si incomplet, puis le texte dicté. Copier place HTML et texte brut dans le presse-papiers, marque le test copié et coche **Éval** du jour de la copie. Le test apparaît dans l’onglet Bilans (« Tinetti x/28 ») et dans l’historique des séances, copiable et supprimable.

## Stockage

`entries[id].tests.tinetti = { scores, notes, notesHtml?, at, copied? }` dans la journée : un test par type et par jour, pas de changement de schéma Dexie. La structure `tests` accueillera les autres tests standardisés. Sauvegarde v1 : `tests` relu et validé s’il existe, fichiers antérieurs acceptés.

## Lot A livré avec (page bilan)

En-tête sur une ligne (‹ · nom/prénom · G I S · copier · ✕ qui annule et quitte) ; en mode clavier, plus de barre de dictée, seulement une flèche ⌄ pour rentrer le clavier.
