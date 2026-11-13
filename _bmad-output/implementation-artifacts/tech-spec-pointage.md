# Vue « Pointage » des patients (pointage définitif) — codée (v0.38.0)

Décidée avec l’utilisateur le 2026-11-13. Le cabinet pré-pointe les patients dans son propre logiciel d’après leurs jours de séance (L, J, V de la fiche ou du Tableau) ; cette vue sert à faire le **pointage définitif** : repérer ceux à dépointer, puis exporter la liste restante. Elle ne concerne que les lundis, jeudis et vendredis (seuls jours de présence dans l’établissement).

## Décisions

1. **Accès** : troisième bouton du sélecteur de Patients (« Liste · Tableau · Pointage », adresse `/patients?vue=pointage`).
2. **Jours affichés** : les jours où au moins une séance A ou B est cochée, du plus récent (en haut) au plus ancien, regroupés par mois ; un sélecteur « Aller au mois » saute au mois choisi.
3. **En haut, en boutons** (ordre de la tournée, note du jour et pause éventuelle en petit dessous) :
   - bleu : vu en A ; orange : vu en B ;
   - **rouge : prévu ce jour-là mais ni A ni B** (pré-pointé à tort, à dépointer), pause comprise.
4. **Dessous, en petit, « Non pointés »** : les patients non prévus et non vus (simple texte), ainsi que ceux descendus d’un toucher.
5. **Toucher un bouton le descend** dans « Non pointés » (`entry.unpointed`), un toucher l’y remonte :
   - un bleu ou un orange descendu est retiré du pointage définitif (affiché avec sa séance, ex. « Nom (B) ») ;
   - un rouge descendu est marqué dépointé (✓) : le travail est fait.
   Rien d’autre ne change : la journée, son export habituel et la fiche gardent A ou B. Modifier la journée après coup ne lève pas un retrait.
6. **Prévu** : patient dont les jours de séance contiennent la lettre du jour (`plannedOn`, `weekdayLetter` dans `domain/model.ts`). Les jours prévus sont retenus dans l’entrée de la journée (`entry.planned`) pour aujourd’hui et les jours suivants, mis à jour quand la fiche change, jamais pour le passé ; une journée plus ancienne sans cette information prend les jours actuels de la fiche.
7. **Niveau H et capacité** : les signes H suivent la date. Capacité = 10 patients sans signe, un de plus par « + », un de moins par « − », à ± 1 près. A et B comptent pareil (les groupes ne sont pas distingués). Un petit avertissement « ⚠ n pour c ± 1 » apparaît quand le nombre de séances gardées s’écarte de plus de 1 de la capacité, dans un sens ou dans l’autre. Un total « n A · n B » par jour, à l’écran seulement.
8. **Export du pointage définitif** : période Du / Au (par défaut du 1er du mois précédent à aujourd’hui), aperçu, Copier, Télécharger .txt, Partager. Format de l’export de journée (`exportTxt`), **sans les signes H** : date, commentaire du jour, noms A (majuscule initiale) et B (minuscules) avec notes entre parenthèses, « Pas vus » avec leurs notes, « Pause ». Une séance retirée est traitée comme non vue : disparaît des vus, sa note éventuelle passe dans « Pas vus ». Pas de total dans l’export. L’export « avant pointage » reste celui des Réglages, pas dans cette vue.
9. **Marque d’export** : copier, télécharger ou partager marque chaque jour pointé de la période (`day.pointageExportedAt`) ; un petit ⇪ suit la date, pour retrouver où l’on s’était arrêté.

## Données

Champs facultatifs sans index (`entry.unpointed`, `entry.planned`, `day.pointageExportedAt`) : pas de nouvelle version Dexie. Ils passent dans la sauvegarde JSON (validés à la restauration ; absents des anciennes sauvegardes).

## Code

`domain/pointage.ts` (`pointageView`, `capacity`, `withoutUnpointed`…), `plannedOn` / `weekdayLetter` dans `domain/model.ts`, `exportPointage` dans `features/exports/exportTxt.ts`, `repository.toggleUnpointed`, `markPointageExported` et la reprise des jours prévus (`syncPlanned`), vue `features/patients/Pointage.tsx`. Tests : `pointage.test.ts`, `repository.test.ts`, `backup.test.ts`, parcours Playwright « pointage définitif ».
