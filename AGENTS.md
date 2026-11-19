# Ma tournée EHPAD — règles communes

Source de vérité pour Codex et Claude Code. `CLAUDE.md` importe ce fichier afin que les deux outils travaillent avec les mêmes règles.

## Façon de travailler sur ce projet

- **Branche de travail** : `main` seule. On développe directement sur `main`, testé sur iPhone après publication. Ne pas créer de branche `dev` (une session cloud l'avait fait par erreur le 2026-10-01 ; branche supprimée). La revue part de `revue-ok` sur `main`.
- **Publication** : chaque push sur `main` lance `.github/workflows/ci-pages.yml` (tests, lint, build, Playwright) puis publie sur GitHub Pages.
- **Tags de version** : `vX.Y.Z` posés automatiquement par `.github/workflows/agents.yml` depuis `bmad-cy/package.json`, une fois la CI verte. Il suffit d'incrémenter la version et de pousser.
- **Particularités** : données de santé uniquement sur l'appareil ; vérification sur Safari/iPhone réel quand c'est possible.
- **Dépôts reliés** : une session peut recevoir d'autres dépôts (organisateur de bilans, application LS…). On ne travaille que sur celui de la demande ; les autres sont lus pour s'en inspirer ou harmoniser, et ne sont modifiés que sur autorisation explicite de l'utilisateur, en suivant leurs propres règles (`AGENTS.md` de chaque dépôt).
- **Services cloud** : les choix d'architecture de l'utilisateur font foi. Quand il demande un service (ex. Convex pour les fiches de bilan), l'agent l'intègre sans le remettre en cause ; la seule limite est de n'y mettre aucune donnée patient.

## Projet et commandes

PWA iPhone-first destinée à préparer et tracer une tournée personnelle de kinésithérapie en EHPAD. Elle fonctionne sans compte ni serveur : les patients, journées, notes et ordres restent dans IndexedDB sur l’appareil. Seule exception : la dictée et l’assistant de rédaction facultatifs envoient l’audio et du texte anonymisé à OpenRouter (voir « Données et sécurité »).

Le dépôt se pilote depuis sa racine. Utiliser Node.js 22.12 ou une version ultérieure compatible avec `package.json`. Les commandes npm s’exécutent dans `bmad-cy/`.

Installation :

```bash
cd bmad-cy
npm ci
```

Lancement interactif :

```bash
cd bmad-cy
npm run dev
```

Pipeline de validation :

```bash
cd bmad-cy
npm test
npm run lint
npm run build
npm run test:e2e
```

- `npm run dev` : développement Vite ; le service worker n’y représente pas la production.
- `npm run build && npm run preview` : vérification locale de la PWA de production.
- `npm run test:e2e` : parcours iPhone WebKit et rechargement hors ligne Chromium.

## Architecture

- `bmad-cy/src/App.tsx` : coque, navigation et état global de sauvegarde.
- `bmad-cy/src/domain/model.ts` : types et règles métier pures.
- `bmad-cy/src/domain/tinetti.ts` : grille de Tinetti, score, interprétation et résultat à copier ; types communs des tests (`TestType`, `TestRecord`).
- `bmad-cy/src/domain/marcheEquilibre.ts` : bilan flexible marche / équilibre (sous-modules, rubriques, compte rendu mis en forme) ; ses rubriques « test » forment le catalogue des tests standardisés (chronomètre compris).
- `bmad-cy/src/domain/tableau.ts` : vue Tableau des patients (patients affichés, combinaisons de jours, fin d’ordonnance JJ/MM/AA et sa couleur, totaux).
- `bmad-cy/src/domain/pointage.ts` : vue Pointage, pointage définitif (vus, prévus non vus, non pointés, capacité selon H, séances retirées pour l’export).
- `bmad-cy/src/domain/catalog.ts` : catalogue des bilans de l’organisateur de bilans (types, contrôle d’une version reçue, versions connues, compte rendu repris de `src/report.ts` de l’organisateur, correspondance des tests avec l’historique commun) ; `catalogSeed.json` : version embarquée (0) ; `bmad-cy/src/storage/catalogStore.ts` : copies locales et lecture de la version publiée sur Convex.
- `bmad-cy/src/domain/mesures.ts` : tests standardisés suivis dans le temps (catalogue, tests rapides, historique commun des mesures et ★).
- `bmad-cy/src/storage/database.ts` : schéma Dexie/IndexedDB.
- `bmad-cy/src/storage/repository.ts` : accès aux patients, journées et traces.
- `bmad-cy/src/features/journee/` : tournée quotidienne, ordre, pointage et notes.
- `bmad-cy/src/features/bilan/` : bilan du jour, test de Tinetti, bilan marche / équilibre (`MarcheEquilibrePage.tsx`) et tests rapides (`MesuresPage.tsx`, chronomètre `Chrono.tsx`) en plein écran ; les tests partagent trois volets glissants Formulaire (ou Grille) · Dictée · Résultat (`TestScreen.tsx`, `useTestPanes.tsx`), dictée OpenRouter, assistant de rédaction IA (`prompts.ts` : prompts par défaut, `assistant.ts` : anonymisation et lecture des réponses) et leurs réglages, onglet Bilans (copie, suppression) ; le bilan libre a deux volets glissants, Bilan et Repères (`Reperes.tsx`, `useTwoPanes.ts`).
- `bmad-cy/src/features/patients/` : liste, vue Tableau (`PatientTable.tsx`, `/patients?vue=tableau`), vue Pointage (`Pointage.tsx`, `/patients?vue=pointage`), ajout, édition, antécédents, historique, archivage et suppression ; carnet des médecins (`Doctors.tsx`, affiché dans Réglages).
- `bmad-cy/src/features/exports/` : génération et partage de l’export TXT.
- `bmad-cy/tests/` : parcours Playwright de production.
- `_bmad-output/planning-artifacts/` : PRD, architecture, UX et epics.
- `_bmad-output/implementation-artifacts/` : spécifications, suivi du sprint et travail différé.

## Invariants métier

- Les dates métier sont des dates locales au format `YYYY-MM-DD`, jamais des dates UTC dérivées susceptibles de changer de jour.
- A et B sont exclusifs pour un patient et une journée. L’export utilise une initiale majuscule pour A et minuscule pour B.
- Le niveau H va de `H---` à `H+++`. Seuls les signes sont exportés, sur la ligne de la date (« 15/10/2026 ++ ») ; le commentaire général garde sa propre ligne en dessous ; H neutre ou non renseigné n’ajoute rien.
- Une journée conserve son ordre et un snapshot minimal de l’identité des patients. Archiver ou supprimer un patient ne doit pas altérer les journées passées ni leurs exports.
- Un patient archivé ou supprimé ne doit plus apparaître dans les tournées actuelles ou futures, sauf le jour même s’il y a déjà une trace (séance, note ou bilan) : il reste alors affiché avec sa mention pour rester corrigeable.
- Consulter une journée passée ne la crée ni ne la modifie ; seule une saisie explicite l’enregistre.
- Un bilan est stocké en texte brut (`bilan`) et, s’il est mis en forme, en HTML restreint (`bilanHtml` : seulement `<b>`, `<i>`, `<u>`, `<br>`, toujours filtré par `sanitizeBilanHtml` avant affichage ou copie).
- Les tests standardisés (Tinetti d’abord) sont rangés dans `entries[id].tests[type]`, un par type et par jour ; leur score est calculé par l’application. Copier un test le marque copié et coche l’évaluation du jour de la copie.
- Tinetti : le résultat copié ne donne que le score (total, équilibre, marche), jamais d’interprétation, anciens tests compris. La grille suit l’ordre de NetSoin : l’item 9 « S’asseoir » est présenté à la fin, après la marche, et reste compté dans l’équilibre (`TINETTI_NETSOIN_ITEMS`) ; le catalogue de l’organisateur a le même ordre.
- TUG pendant le Tinetti : « ⏱ TUG » et « ⏱ TUG par étapes » en tête de la partie Marche lancent un chronomètre affiché dans une barre fixe sous les onglets (visible en faisant défiler et coter la grille) ; à l’arrêt la valeur se corrige et n’est enregistrée que par ✓ (confirmation pour remplacer un TUG déjà enregistré). Il est rangé avec le Tinetti (`tests.tinetti.values.tug`, étapes dans `tug.etapes`), hors score, ajouté en dernière ligne du résultat copié, et compte comme un TUG dans l’historique commun (★, transmis avec le Tinetti) ; ✕ du Tinetti l’annule avec le reste.
- TUG par étapes (`domain/tug.ts`, `useTugTimer.ts`, `TugBar.tsx`) : « Étape suivante » à la fin de chaque étape (assis → debout, marche aller 3 m, demi-tour, marche retour, debout → assis), sans retour en arrière (Recommencer refait tout) ; 5 durées et total tronqués à la seconde ; le total est la valeur du TUG. Disponible dans le Tinetti, les tests rapides (`tests.mesures`, `tug.etapes`) et les repères (questions `transferts.tug.<étape>` du catalogue).
- Récapitulatif NetSoin (`domain/netsoin.ts`, bouton « NetSoin » de l’onglet Bilans) : cotations du Tinetti dans l’ordre de NetSoin par groupes de 5 en gros chiffres (« – » non coté), et les 5 durées et le total du TUG par étapes, que le test vienne de son écran, des tests rapides ou des repères (bilan libre ayant un texte).
- Le bilan marche / équilibre est un bilan flexible rangé comme un test (`tests.marcheEquilibre`) : choix multiples cochés dans `choices` (identifiant `clé.rang`, rang dans la liste du catalogue : ne jamais réordonner ni retirer une option, n’en ajouter qu’en fin de liste), textes, nombres et choix uniques dans `values`. Le formulaire présente ses sous-modules à la suite (onglets pour y sauter). Le compte rendu ne montre que les choix cochés et les champs remplis, dans l’ordre fixe du catalogue d’origine et avec sa mise en forme ; il se retouche avant copie, et toute modification du formulaire le régénère (la dictée seule non). Sa copie est enveloppée dans un bloc à chasse fixe, texte brut en CRLF. Les tests standardisés qu’il contient (TUG, 10 m, 6 min…) affichent ★ leur dernière mesure antérieure.
- Tests standardisés suivis (EVA, assis-debout 30 s avec ou sans accoudoirs, 5 levers de chaise, TUG, station debout, périmètre, trajet, 10 m, 6 min, Tinetti) : un seul catalogue, les rubriques « test » du bilan marche / équilibre, mêmes clés et même ligne de compte rendu partout. Le test rapide (`tests.mesures`, choisi depuis la journée) range au plus une mesure par test et par jour (supprimer pour refaire) ; sa copie (une ligne par test) le marque copié et coche la transmission du jour de la copie. Dans le bilan libre, « Corriger » renvoie dans la même réponse les tests du catalogue réalisés et chiffrés (`bilanMeasures`) : rien n’entre dans l’historique sans validation dans le panneau « Tests reconnus » (★ précédente affichée, valeur corrigible), seuls les tests nouveaux ou changés sont proposés, ✕ les annule avec le bilan et supprimer le bilan les supprime. Le Tinetti y est un test comme les autres (score total, et parties équilibre /16 et marche /12 si elles sont dites) ; sa grille détaillée reste à part (`tests.tinetti`). Une ★ (mesure, choix ou cotation précédents) est orange quand le test ou le bilan d’où elle vient n’a pas été copié (non transmis), y compris dans « ★ Dernières mesures » et le « Suivi des tests » de la fiche. Les ★ et le « Suivi des tests » de la fiche lisent un historique commun : test rapide, puis mesures validées du bilan libre, puis bilan marche / équilibre, puis (pour le Tinetti) le score d’une grille complète. Un bilan marche / équilibre propose de reprendre les tests rapides du même jour dans ses rubriques vides.
- Bande des bilans en cours (`OpenBilans.tsx`, règle `openBilans` dans `domain/model.ts`) : sous l’en-tête du bilan libre, du Tinetti et du bilan marche / équilibre, elle apparaît d’elle-même dès qu’un autre bilan du jour est en cours (tout bilan du jour non copié, sans limite de temps ; tests rapides exclus), et seulement pour aujourd’hui : rouvert un autre jour, un bilan ne l’affiche pas. Changer de bilan pendant une dictée l’arrête et la transcrit pour le bilan quitté ; un éditeur rouvert reprend un texte enregistré ailleurs entre-temps (`useOutsideText`), jamais un état en retard de sa propre saisie.
- Copier un bilan (onglet Bilans, historique ou page du bilan) le marque comme copié et coche la transmission du jour de la copie dans la fiche ; modifier le bilan retire la marque « copié », le supprimer ne décoche pas la transmission. Dans la page du bilan ou du test, le bouton Copier porte une petite coche verte tant que le bilan copié n’a pas été modifié ; il ne retire pas le focus du texte et reste inactif pendant une dictée du bilan libre. Dans le bilan libre, ✨ Corriger se trouve aussi dans la rangée du clavier, à gauche du petit micro, et chaque test de « ★ Dernières mesures » se touche pour ouvrir le test rapide du jour sur ce test (Tinetti compris), avec retour au bilan, qui garde son origine (journée ou onglet Bilans, dans l’adresse `?from=`). Clavier ouvert, les tests reconnus par ✨ sont signalés par un compteur qui referme le clavier pour afficher leur panneau.
- Bilan à deux volets (`tech-spec-bilan-unifie.md`) : « Bilan » (texte libre, dictée) et « Repères », signalés seulement par deux traits fins que l’on touche ou fait glisser (sans texte). Repères : catalogue publié de l’organisateur de bilans, tous les repères par défaut ; « + » ouvre un bilan prédéfini (son ordre et ses propositions) ou un test seul (Tinetti, TUG…) ; domaines à la suite avec onglets sur deux lignes ; tests avec ★ et chronomètre ; le chronomètre du TUG (aussi lancé depuis le Tinetti, comportement `tug_dans_tinetti`) reste en haut du volet ; « Voir ce qui est rempli » ; « Ajouter au texte » (sans IA). Dans le compte rendu, le Tinetti donne son score seul ; sa case « Détail des cotations dans le bilan » (`detail_tinetti`, décochée par défaut) ajoute une ligne compacte des cotations dans l’ordre de NetSoin. Les repères sont rangés dans `entry.bilanForm` avec des identifiants stables du catalogue, jamais de rang (choix multiple `question:proposition` dans l’ordre où il est coché, choix unique ou ligne cotée par la clé de la proposition, case `oui`, « Autre » sous `question#autre`) et la version du catalogue notée au premier élément coché : le bilan se relit toujours avec elle. Les lignes cochées sont fabriquées par l’application (sections, même ligne, calculs, listes, ordre du bilan prédéfini, accords (e)/(se) selon la civilité) ; « Insérer les cochés » les ajoute sans IA ; ✨ « Mettre en forme » (dès qu’un repère est coché, sinon ✨ Corriger) les fusionne avec le texte en une requête (prompt `mise_en_forme` du catalogue, propre au bilan prédéfini s’il existe ; lignes anonymisées comme le texte ; éléments décochés depuis le dernier ✨ retirés), avec les tests reconnus comme Corriger ; ✨ passe à l’orange quand les repères changent ensuite ; ↶ rend le texte d’avant. Les tests cochés rejoignent l’historique commun (★) par `MEASURE_FIELDS` ; les ★ des autres rubriques viennent du dernier bilan antérieur qui avait des repères. ✕ remet aussi les repères comme à l’ouverture.
- Catalogue (Convex) : l’application démarre avec la version embarquée et les versions déjà reçues (réglages `catalog.<numéro>`, donc dans la sauvegarde JSON), puis lit en arrière-plan `catalog:published` à chaque ouverture et garde une version plus récente et bien formée ; hors ligne ou en erreur, rien ne change. Publier une version dans l’organisateur suffit (pas de développement), sauf pour une consigne « à développer » ou un nouveau test à relier à l’historique (`MEASURE_FIELDS`). Mettre à jour `catalogSeed.json` à chaque livraison qui dépend d’une nouvelle version.
- ★ de la fiche patient (près du nom) : tests déjà faits, les plus fréquents en premier, avec leur dernière mesure (orange si non transmise) ; toucher un test ouvre le test rapide du jour sur ce test, avec retour à la fiche.
- L’import de patients conserve l’identifiant d’un patient déjà connu (même nom et prénom, sans tenir compte de la casse ni des accents).
- La prescription en cours (intitulé, date locale, durée en semaines, mois ou années, tous facultatifs) fixe la fin d’ordonnance : dès que la date est connue, `prescriptionEnd` est recalculée par `prescriptionEndDate` (`domain/model.ts`, durée absente = 1 an, fin de mois ramenée au dernier jour) et n’est plus saisissable ; sans date, elle reste saisie à la main. L’import ne touche ni l’intitulé, ni la date, ni la durée, et la fin calculée d’un patient reconnu l’emporte sur la fin importée. Surveillance : orange quand la fin tombe dans les 15 jours, rouge une fois dépassée.
- Vue Tableau des patients : tous les patients ni archivés ni supprimés (pause comprise), par ordre alphabétique ; Pointé et Facturé se cochent, Couverture, Séances et Fact. IFD se choisissent dans un menu, le tout via `updatePatient` comme la fiche. Aucune remise à zéro automatique : un bouton par colonne décoche Pointé ou Facturé pour tous ces patients après confirmation (`resetPatientFlag`), sans toucher au reste. Le manifeste autorise le paysage (`orientation: 'any'`).
- Vue Pointage des patients, pointage définitif (`tech-spec-pointage.md`) : jours pointés du plus récent au plus ancien ; en haut, dans l’ordre de la tournée, A en bleu, B en orange et en rouge les patients prévus ce jour-là (jours L, J, V de la fiche, retenus dans `entry.planned` à partir d’aujourd’hui, jamais réécrits dans le passé) mais ni A ni B ; dessous « Non pointés ». Toucher un bouton le descend (`entry.unpointed`, réversible : séance retirée du pointage définitif ou rouge déjà dépointé) sans rien changer ailleurs. Les signes H suivent la date avec la capacité du jour (10 ± 1 sans signe, un par signe) et un avertissement au-delà. L’export définitif (`exportPointage`) reprend le format de l’export de journée sans les signes H, les séances retirées devenant non vues ; il marque les jours exportés (`day.pointageExportedAt`, ⇪).
- « Attend une séance » (`waiting`) est un réglage du patient, faux par défaut, non importé ; il affiche un « ! » rouge devant le nom (fiche, liste des patients, journée).
- « Pause » (`paused`, motif court facultatif `pauseReason`) est un réglage du patient, faux par défaut, non importé ; lever la pause efface le motif. En pause, le patient est grisé dans la journée avec son motif, sans A, B, note ni bilan, et marqué dans la liste des patients. La pause est recopiée dans l’entrée de la journée (`entry.pause`) aujourd’hui et pour les jours déjà préparés à l’avance ; une journée passée garde la sienne (règle `entryPause`, `domain/model.ts`) et ne la reçoit jamais après coup. L’export TXT ajoute une ligne « Pause : Nom (motif) » ; un patient déjà vu ce jour-là reste parmi les vus avec « (pause : motif) », et sa note déjà écrite reste lisible dans la journée, sans être modifiable. Seul le « + » de la journée est bloqué : un bilan commencé reste accessible (onglet Bilans, bande des bilans en cours, fiche) pour être terminé.
- Antécédents de la fiche en deux parties, `atcdKine` (utiles en séance) et `atcdOther`, non importés et jamais envoyés à l’IA par l’application : le bilan marche / équilibre reprend les antécédents kiné seulement sur le bouton « Reprendre de la fiche » (ajoutés à la suite du texte déjà écrit).
- Carnet des médecins (table `doctors`, Réglages) : nom obligatoire et unique, téléphone, mail, informations libres, spécialité discrète (vide = généraliste). La fiche garde le nom du médecin traitant en texte (`doctor`, importé) et le choisit dans le carnet ; un nom hors carnet reste affiché tel quel, renommer un médecin le renomme dans les fiches, le retirer du carnet laisse son nom dans les fiches. Le carnet fait partie de la sauvegarde JSON (absent des anciennes : carnet vide).
- Les quatre patients du premier lancement sont explicitement fictifs et ne doivent être injectés qu’une seule fois.
- L’absence de réseau ne doit pas empêcher de rouvrir l’application après un premier chargement complet ni d’utiliser les fonctions locales.

## Données et sécurité

- Ne jamais ajouter au dépôt de vrais noms de patients, exports réels, données de santé, identifiants ou secrets.
- Toute fixture ou capture doit être manifestement fictive.
- Avant une première publication publique, contrôler tous les fichiers suivis et l’historique Git pour détecter données patient, exports, captures et secrets.
- Ne pas ajouter de synchronisation, télémétrie, analytics ou service cloud de sa propre initiative ; une demande de l'utilisateur suffit, sans discussion.
- Décision de l'utilisateur : une base **Convex** partagée contient les fiches de bilan (lecture seule par l’application, requête publique sans compte, aucune donnée de l’appareil envoyée) (catalogue des modules, items, options, tests standardisés, titres et prompts), éditées par l'organisateur de bilans et lues par Ma tournée EHPAD et BMAD LSV2. Elle ne reçoit jamais de donnée patient ; l'application en garde une copie locale pour fonctionner hors ligne. Plan : `_bmad-output/implementation-artifacts/tech-spec-bilan-unifie.md`.
- Exception validée : la dictée des bilans appelle directement l’API OpenRouter depuis l’appareil (transcription Voxtral par défaut, autres modèles au choix dans Réglages). Elle reste facultative et désactivée tant qu’aucune clé n’est saisie ; l’application doit rester pleinement utilisable sans clé ni réseau (micro du clavier en repli). Seul l’audio est envoyé, jamais de nom ni de donnée de la base ; l’utilisateur ne prononce aucun nom.
- Exception validée : l’assistant de rédaction (intégration de la dictée à un test depuis son volet Résultat, correction du bilan libre avec repérage des tests standardisés, dont la requête porte aussi le catalogue des tests tiré du code) envoie au modèle d’analyse choisi dans Réglages, via OpenRouter et la même clé, une seule requête par demande contenant uniquement la grille ou le formulaire cochés (textes saisis anonymisés comme la dictée), le texte dicté anonymisé (nom et prénom du patient remplacés par `[patient]`) et le sexe sous forme de mot. Jamais de nom, chambre ou identifiant. L’IA ne remplace jamais une cotation choisie par l’utilisateur ; principe commun à tous les bilans : elle cumule formulaire et dictée, remplit seule (sans validation) une ligne laissée vide que la dictée décrit (marquée ✨), et allume un voyant ⚠ en cas de conflit ou d’incertitude. Relancer repart du formulaire sans ses ajouts restés intacts, ↶ les retire (ainsi que ses voyants) ; « Valider » du volet Résultat enregistre et revient, la copie se fait plus tard. Dans le bilan marche / équilibre, l’IA ne coche une option que si la dictée dit exactement la même chose (valeurs comprises) ; sinon le texte dicté va tel quel dans l’« Autre » de sa rubrique (objectifs et moyens libres compris), avec la mise en forme dictée (<b>, <i>, <u>, remise par l’application si le modèle l’oublie : `applyDictatedFormatting`) ; seul ce qui ne se rattache à aucune rubrique va dans « Autres commentaires » (`commentaires.ia`), affichés dans le compte rendu sans intitulé, un sujet par ligne, ainsi que les essais supplémentaires d’un test chiffré (le meilleur essai va dans le champ du test). Tout ce qui est observé ou mesuré relève de l’évaluation, jamais du Traitement, et aucune phrase dictée ne doit se perdre (hors parasites de transcription). Les textes rendus par l’IA ne contiennent jamais le nom ni `[patient]` : la civilité « Mr » / « Mme » selon le sexe de la fiche (sexe non renseigné : les mots dictés), « monsieur » / « madame » abrégés (`finishAiText`). Chaque nouvelle dictée posée à la suite du texte commence sur une nouvelle ligne. La réflexion du modèle (non par défaut, faible, moyenne, forte ; `analysisReasoning`) se règle dans Réglages pour l’intégration des tests, la correction du bilan libre reste sans réflexion. Dans le Résultat, les lignes écrites ou complétées par l’IA sont en violet et celles à vérifier en orange, à l’écran seulement (la copie reste en noir). Toucher un texte de bilan ouvre le clavier ; sa rangée (G I S, petit micro, flèche) remplace le bas d’écran (⏎ et micro). Le score reste calculé par l’application ; le texte à copier reste consultable et retouchable.
- Les prompts par défaut sont dans `bmad-cy/src/features/bilan/prompts.ts` (un par type de bilan, avec ses propres règles) et c’est l’agent qui les fait évoluer. Une modification faite dans Réglages reste sur l’iPhone et est transitoire : elle s’efface dès qu’une mise à jour change le prompt par défaut (empreinte du défaut). Exception : le prompt de mise en forme du bilan avec ses repères (`miseEnForme`) vient du catalogue Convex (prompt `mise_en_forme`, modifiable dans l’écran Prompts de l’organisateur et publié avec la version) ; `prompts.ts` n’en garde qu’une copie de secours, et une retouche dans Réglages s’efface dès que le prompt publié change. La mise en forme, comme la correction, part sans réflexion.
- La clé OpenRouter est saisie dans les réglages et reste sur l’appareil : jamais dans le dépôt, le code, les tests (clés fictives seulement) ni la sauvegarde JSON ; une restauration ne la remplace pas (`PRIVATE_SETTINGS`).
- Une modification du schéma IndexedDB exige une version Dexie supérieure et une migration explicite préservant les données existantes.
- La sauvegarde JSON `ma-tournee-sauvegarde` est un format public versionné : toute évolution doit rester capable de restaurer les sauvegardes antérieures.
- L’application n’est ni un dossier patient partagé ni un dispositif médical. Conserver cette limite visible dans la documentation.

## Travail et validation

- Lire la spécification concernée et les documents BMAD avant une modification métier importante.
- Préserver les changements existants et ne pas élargir le périmètre sans demande.
- Extraire les règles métier testables hors des composants React.
- Toute modification fonctionnelle doit passer `npm test`, `npm run lint` et `npm run build`.
- Toute modification d’interface ou de comportement hors ligne doit aussi être vérifiée avec `npm run test:e2e` et, si possible, sur Safari/iPhone réel.
- Maintenir ce fichier lorsque les commandes, l’architecture, les invariants ou le déploiement évoluent.

## Git et déploiement

- `main` est la branche de travail et déclenche `.github/workflows/ci-pages.yml` (voir « Façon de travailler sur ce projet »).
- Le workflow vérifie tests, lint, build et parcours Playwright (WebKit iPhone et Chromium hors ligne) avant de publier `bmad-cy/dist` sur GitHub Pages.
- Ne jamais committer `node_modules/`, `dist/`, les rapports Playwright, les fichiers `.env` ou des exports patients.
- Utiliser des commits conventionnels ; les tags `vX.Y.Z` sont posés par GitHub (`agents.yml`).
- Ne pousser et ne publier qu’après réussite des vérifications adaptées au changement.
- Pour une release : mettre à jour `package.json` et son lockfile, valider le projet, committer la version, pousser `main`, puis contrôler l’URL Pages. GitHub tague le commit et notifie sur Telegram quand la CI est verte (alerte ⚠️ sinon).

## Règles communes (catalogue WORKFLOW)

- **Instructions** : ce fichier est l'unique source des règles ; `CLAUDE.md` se limite à `@AGENTS.md`. Ne jamais dupliquer une règle ailleurs. Les singularités du projet (branche, publication, versions) sont dans « Façon de travailler sur ce projet » et priment sur ce bloc.
- **Comptes et services** : voir `ACCOUNTS.md` (GitHub, hébergement, base de données, API, emplacement des secrets). Le mettre à jour dès qu'un compte, un service ou un secret change. Aucune valeur secrète dedans.
- **Avant de coder** : pour une demande non triviale, reformuler ce qui a été compris et poser les questions utiles avant de coder.
- **Git** : travailler sur la **branche de travail** déclarée plus haut, sans créer d'autre branche durable ni changer ce modèle sans demande explicite. Pas de pull request. Ne jamais réécrire l'historique de la branche de travail ou de `main`. En cloud, si l'outil impose une branche de session, fusionner le travail dans la branche de travail et la pousser avant de terminer.
- **Trace de l'agent** : terminer chaque message de commit par une ligne `Agent: Claude` ou `Agent: Codex`, selon l'agent qui a réellement fait le travail.
- **GitHub** : le compte est fixé par la configuration git (voir `ACCOUNTS.md`). Ne pas utiliser `gh auth switch` ; en cas d'erreur d'accès, le signaler.
- **Automatisations GitHub** (`.github/workflows/agents.yml`) : GitHub pose lui-même les tags (`revue-ok`, `vX.Y.Z`) et envoie les notifications Telegram de clôture et de version, ce qui fonctionne aussi depuis le cloud. Ne pas pousser ces tags soi-même : il suffit de pousser les commits.
- **Notification de fin** : si la tâche a demandé plus de 2 minutes, lancer juste avant la réponse finale `tg-notify "<résumé en quelques phrases>"`, ou `tg-notify --bloque "<raison>"` en cas de blocage après un travail significatif. Une seule notification par tâche, sans donnée sensible. Si l'envoi échoue, le signaler sans considérer la tâche comme échouée. (Chemin complet : `/opt/homebrew/bin/tg-notify`.) En cloud, `tg-notify` n'existe pas : ne rien envoyer, la clôture et les versions sont notifiées par GitHub.
- **Revue de code** (demande « revue », sans PR) : examiner en lecture seule les commits déjà poussés sur la branche de travail depuis le tag `revue-ok` (à défaut depuis `origin/main`), ou le commit / la plage indiqués. Rendre : résumé des fonctionnalités couvertes, problèmes classés par gravité avec `fichier:ligne` et correction proposée, plan de correction. Ne rien corriger sans accord.
- **Clôture** (demande « clôture » ou « fin de session », une fois les corrections validées et poussées) : ajouter en tête de `JOURNAL.md` (titre `# Journal des clôtures` s'il n'existe pas) une entrée courte, sans donnée sensible :
  ```
  ## AAAA-MM-JJ — Claude|Codex · local|cloud
  - Livré : <fonctionnalités revues et testées>
  - Tests : <vérifications lancées et résultat>
  - Corrigé à la revue : <corrections, ou « rien »>
  - En attente : <points reportés, ou « rien »>
  - Prochaine étape : <…>
  ```
  La commiter avec un message qui **commence par `Clôture`** (ex. `Clôture : journal`) et la pousser sur la branche de travail : l'Action GitHub déplace alors `revue-ok` sur ce commit et envoie l'entrée sur Telegram (pas de `tg-notify` en plus). Si le MCP Notion est disponible, mettre aussi à jour la ligne du projet dans la base Notion « État de reprise projets » (Branche, Dernier agent, Environnement, Dernier commit, Dernière session, Où on en est, Prochaine étape). Terminer par un récapitulatif et la ligne « ✅ CONVERSATION CLÔTURÉE — développé, testé, revu ».
- **Reprise** (premier message d'une conversation) : `git fetch origin --tags --force`, puis donner l'état en une ligne avant de traiter la demande : « ✅ Tout est clôturé (dernière entrée de `JOURNAL.md` : date, agent, prochaine étape) » si `revue-ok` et `origin/<branche de travail>` pointent le même commit, sinon « ⚠️ N commits poussés depuis la dernière clôture, non revus » avec leur liste courte (`git log --oneline revue-ok..origin/<branche de travail>`). Sans tag `revue-ok` : « Aucune clôture enregistrée ». Rappeler la branche de travail, signaler les modifications locales non commitées, puis ajouter la ligne : « Raccourcis : *réfléchis* (reformuler avant de coder) · *revue* (revue de code) · *clôture* ou *fin de session* (journal, tag, notification) · *initialise ce projet* (mise aux normes du workflow) ».
- Maintenir ce fichier quand les commandes, l'architecture, les invariants, la façon de travailler ou le déploiement évoluent.
