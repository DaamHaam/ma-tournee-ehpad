# Assistant de rédaction IA — lot C (v0.14.0)

## Principes (décidés avec l’utilisateur)

- **Une seule passe d’IA** par demande : rédaction et correction ensemble, sans aller-retour ni seconde passe.
- **L’IA ne remplace jamais une cotation choisie par l’utilisateur.** Règle propre à Tinetti (v0.14.1, après le premier essai réel) : une ligne laissée vide mais décrite dans la dictée est cotée par l’IA (marquée ✨ IA dans la relecture, ⚠ si incertaine) ; d’autres bilans pourront garder les lignes vides. Le score est toujours calculé par l’application.
- **Relecture courte** : liste compacte des réponses cochées, ⚠ et raison très courte sur les lignes que la dictée contredit ou rend douteuses, puis texte final modifiable (G I S, clavier) et **Valider**.
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
5. **Valider** inscrit aussi les cotations de l’IA dans la grille et garde la synthèse (observations, ⚠, lignes ✨, dictée résumée). Barre « Synthèse » distincte des onglets : **Voir** la rouvre sans nouvel appel, **Relancer** refait l’appel. Modifier ensuite la cotation ou la dictée efface le texte validé (la copie revient au résultat automatique) ; « Voir » repropose alors le texte avec la grille actuelle et signale si la dictée a changé.
6. Dans la relecture, « Données envoyées à l’IA » montre exactement la requête (anonymisée).

## Bilan libre : bouton ✨ Corriger

Une passe : texte anonymisé + sexe → texte corrigé (orthographe, grammaire, accords, mots parasites), balises conservées. Les noms retirés sont remis à leur place si l’IA a gardé autant de `[patient]` qu’envoyés. « Annuler la correction » rétablit le texte précédent.

## Données

Seuls partent la grille, le texte dicté anonymisé et le sexe sous forme de mot. Ni nom, ni prénom, ni chambre, ni identifiant. Exception documentée dans `AGENTS.md`.
