# Reprise du projet — 15 septembre 2026

## Décisions confirmées par Damien

- Le besoin initial reste valable: tournée de kinésithérapie en EHPAD, iPhone, lundi/jeudi/vendredi, usage individuel et données locales.
- Sept niveaux de H: `H---`, `H--`, `H-`, `H`, `H+`, `H++`, `H+++` (tirets normalisés en caractères ASCII).
- Export TXT: uniquement les signes, sans préfixe H; aucune contribution de l'indicateur au texte pour le niveau neutre H.
- Poser plusieurs questions ensemble pour accélérer la clarification.

Ces précisions sur H remplacent les anciens exemples du brainstorming avec préfixe H. Elles sont reportées dans le PRD, l'architecture et les critères des stories 3.4 et 7.1.

## Arbitrages confirmés par Damien

1. Les journées passées peuvent être corrigées à n'importe quelle date via une ouverture explicite de la journée. Cela couvre séances, notes, H et commentaire et remplace la clôture au lendemain évoquée dans le brainstorming.
2. Export TXT: omettre complètement la ligne des signes/commentaire si les deux sont vides. Si seul le commentaire est présent, l'exporter seul.
3. Transmission sans date connue: triangle gris, avec indication textuelle accessible « date inconnue ».
4. Historique de la fiche: dates, séances A/B et notes du jour, du plus récent au plus ancien, y compris séances sans commentaire et notes sans séance.
5. Premier ensemble à essayer: ajout de patients, Journée, pointage A/B, notes, H, sauvegarde locale, fonctionnement hors ligne et export TXT. Le périmètre complet du MVP reste prévu ensuite.
6. Première utilisation avec patients fictifs, et possibilité immédiate de supprimer ou d'archiver des patients. Les données fictives ne doivent pas réapparaître après suppression.

## Premier jalon autorisé

La demande « Reprends » autorise la mise en œuvre de cet ensemble. Le détail d'exécution et les vérifications sont suivis dans `../implementation-artifacts/tech-spec-premiere-tournee-utilisable.md`.

## État technique constaté à la reprise

- Stories 1.1 et 1.2 marquées terminées; prochaine story planifiée: 1.3, navigation à trois onglets.
- Code actuel: base Vite/React/TypeScript/Tailwind, écran statique avec patient fictif.
- Compilation et lint réussis le 2026-09-15.
- Aucun rapport distinct de vérification globale avant implémentation retrouvé.
- UX: progression consignée jusqu'à l'étape 8.

Les arbitrages ci-dessus ont été validés par les réponses numérotées de Damien dans la conversation de reprise.
