# Assistant de rédaction IA — lot C (v0.14.0)

## Principes (décidés avec l’utilisateur)

- **Une seule passe d’IA** par demande : rédaction et correction ensemble, sans aller-retour ni seconde passe.
- **L’IA ne remplace jamais une cotation choisie par l’utilisateur.** Règle propre à Tinetti (v0.14.1, après le premier essai réel) : une ligne laissée vide mais décrite dans la dictée est cotée par l’IA (marquée ✨ IA dans la relecture, ⚠ si incertaine) ; d’autres bilans pourront garder les lignes vides. Le score est toujours calculé par l’application.
- **Principe commun à tous les bilans** (en tête de chaque prompt) : l’utilisateur coche et dicte ; l’IA cumule les deux sources, remplit seule les lignes vides décrites dans la dictée et allume un voyant ⚠ en cas de conflit ou d’incertitude.
- **Aucune validation** (v0.14.2) : « Lancer » remplit directement la grille (✨ sur les cotations de l’IA, ⚠ et sa raison sous la ligne concernée) et garde les observations rédigées. « Voir » est une consultation facultative (réponses, texte à copier retouchable, données envoyées).
- **Règles propres à chaque bilan** : un prompt par type (Tinetti d’abord ; les bilans à nombreuses questions non toutes renseignées auront leurs propres règles), modifiable dans Réglages par l’utilisateur et mis à jour dans le code par l’agent (`bmad-cy/src/features/bilan/prompts.ts`). Un prompt identique au défaut n’est pas enregistré ; « Rétablir » revient au défaut.

## Réglages

- « Modèle d’analyse » : identifiant OpenRouter saisi par l’utilisateur (DeepSeek prévu), bouton « Tester le modèle ». Même clé OpenRouter que la dictée.
- Prompts modifiables : « Synthèse du test de Tinetti », « Correction du bilan libre ».
- Fiche patient : sexe F / H (migration Dexie v4, vide par défaut), envoyé seul sous la forme « patiente », « patient » ou « patient(e) » pour les accords.

## Tinetti : bouton ✨ Synthèse

1. La dictée est convertie en texte et anonymisée (nom et prénom du patient remplacés par `[patient]`, sans tenir compte de la casse ni des accents).
2. Envoi unique à `POST /api/v1/chat/completions` (réponse JSON) : grille (ligne, partie, item, options, cotation ou null), dictée, sexe.
3. Réponse attendue : `{"cotations": {"e1": 1}, "observations": "…", "a_verifier": [{"ligne": "e6", "raison": "…"}]}`. Cotations retenues seulement pour les lignes vides et les options existantes ; HTML filtré (`<b>`, `<i>`, `<u>`, `<br>`) ; lignes inconnues ignorées.
4. Texte final proposé = ligne de score calculée par l’application + interprétation + items non cotés + observations rédigées. Modifiable, puis **Valider** l’enregistre (`tests.tinetti.resultHtml`) ; c’est ce texte que copient la page, l’onglet Bilans et l’historique.
5. Le résultat est appliqué et enregistré aussitôt (cotations de l’IA dans la grille, observations, ⚠, lignes ✨, dictée résumée). Barre « Synthèse » distincte des onglets : **Voir** sans nouvel appel, **Relancer**. Texte copié = texte retouché s’il existe, sinon score recalculé + observations de l’IA (tant que la dictée n’a pas changé, sinon la dictée brute). Retoucher une cotation à la main efface ses marques ✨ / ⚠.
6. Dans la relecture, « Données envoyées à l’IA » montre exactement la requête (anonymisée).

## Bilan libre : bouton ✨ Corriger

Une passe : texte anonymisé + sexe → texte corrigé (orthographe, grammaire, accords, mots parasites), balises conservées. Les noms retirés sont remis à leur place si l’IA a gardé autant de `[patient]` qu’envoyés. « Annuler la correction » rétablit le texte précédent.

## Données

Seuls partent la grille, le texte dicté anonymisé et le sexe sous forme de mot. Ni nom, ni prénom, ni chambre, ni identifiant. Exception documentée dans `AGENTS.md`.

## v0.15.0 — synthèse en deux écrans, prompts transitoires

- « ✨ Lancer » remplit la grille puis ouvre l’**écran 1 « Réponses »** : uniquement ce qui est catégorisé dans le formulaire (✨ seul pour une cotation de l’IA, ⚠ et sa raison), items non cotés, données envoyées. Boutons « Retour à la grille » et « Valider » (possible malgré les ⚠).
- **Écran 2 « Transmission »** en plein écran : texte prêt à transmettre (score, interprétation, observations), dictée au curseur, ↵, G I S, clavier facultatif (fermé par défaut), « Valider » enregistre le texte final et ramène à la journée. La copie se fait ensuite ailleurs (onglet Bilans…) et reprend ce texte.
- « Voir » rouvre l’écran 1 sans nouvel appel. « Relancer » demande l’autorisation si un texte de transmission est enregistré.
- Prompts : c’est l’agent qui fait évoluer les prompts par défaut. Une modification faite dans Réglages est transitoire (stockée avec l’empreinte du prompt par défaut d’origine) et disparaît à la mise à jour suivante qui change ce prompt. Bouton « Copier » pour montrer sa version. Partage par fichiers du dépôt : idée notée dans Notion pour plus tard.

## v0.15.1 — rapidité de la synthèse

Constat : 25 à 30 s pour une synthèse avec un modèle « flash ». L’application ne fait qu’un appel ; le temps vient du modèle. Mesures :
- `reasoning: { enabled: false }` (réflexion du modèle désactivée, inutile pour cette tâche) ; si le modèle impose sa réflexion (erreur 400 qui la mentionne), l’appel est refait une fois sans l’option ;
- `provider: { sort: 'latency' }` : OpenRouter choisit l’hébergeur le plus réactif ;
- requête allégée : options envoyées seulement pour les lignes non cochées (une ligne cochée porte son libellé).
- Mesure affichée : durée dans la barre (« ✓ Synthèse faite en 3,2 s ») et, dans « Données envoyées », jetons envoyés, reçus et de réflexion. « Tester le modèle » affiche aussi la durée.

## v0.15.2 — voyants plus justes

Après la correction de vitesse (1,2 s, 181 jetons reçus, aucun de réflexion), le modèle signalait « cotation incertaine » sur des lignes pourtant dictées explicitement. Le prompt précise désormais : voyant seulement pour une dictée vague, partielle ou ambiguë, ou une contradiction avec une ligne cochée ; jamais pour une ligne décrite clairement (exemples items 7 et 8) ; raison précise, jamais une formule générale. Piste notée : Jev (modèle de décision avec probabilités) pour la catégorisation, LLM pour la rédaction.

## v0.15.3 — corrections de revue
- Anonymisation : le nom complet (« Le Gall », « de La Tour ») est remplacé d’abord ; les particules (le, la, de, du…) ne sont plus retirées seules du texte dicté.
- Grille Tinetti verrouillée pendant la synthèse (la réponse est fusionnée avec la grille envoyée).
- Le pied de dictée de la page Tinetti est masqué sous les écrans Réponses et Transmission.
- Micro libéré si l’enregistreur ne démarre pas ; un collage sur plusieurs lignes garde ses retours à la ligne.
