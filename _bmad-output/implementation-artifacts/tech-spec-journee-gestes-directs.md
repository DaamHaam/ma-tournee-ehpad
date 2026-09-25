---
title: Journée — gestes directs et affichage fixe
type: feature
created: 2026-09-25
status: done
baseline_commit: 6d4c5a3
context:
  - ../planning-artifacts/ux-design-specification.md
  - tech-spec-v0-2-interface-epuree.md
---

# Journée — gestes directs et affichage fixe

## Retours de Damien après essai de la v0.3.0

- Supprimer le bouton « Aujourd’hui » : il décale toute la mise en page.
- Supprimer « Réorganiser » : un appui long sur une carte ou un repère la déplace directement (stories 2.3, 2.4).
- Triangle plus grand ; le toucher ouvre ou ferme le champ de note, masqué par défaut (story 3.3).
- Repères réduits à un simple trait, déplaçables par appui long.
- Aucun zoom au toucher d’un champ ; l’application reste fixe sur smartphone.
- Barre inférieure sans texte, icônes seules.

## Réalisation

- dnd-kit : capteurs souris et toucher avec délai de 350 ms (tolérance 6–8 px), clavier conservé sur la carte focalisée. Les appuis courts restent aux boutons A/B, au lien de fiche et au triangle ; le défilement reste possible. Le champ note n’active pas le glisser.
- Le clic natif émis au relâchement est bloqué pendant le glisser et 300 ms après, pour ne pas ouvrir la fiche.
- Callout iOS, sélection de texte et glisser natif des liens désactivés sur les cartes.
- Note : visible si elle contient du texte ou si le triangle a été touché ; ouverture avec focus. Le triangle (44 px) garde sa couleur de suivi éval/trans et son libellé accessible.
- Repères : trait de 2 px, zone de 28 px, `role="separator"` avec libellé « Repère n » pour les lecteurs d’écran.
- Zoom : champs en 16 px, `maximum-scale=1, user-scalable=no`, `touch-action: manipulation`.
- Navigation : icônes SVG locales, noms accessibles « Journée », « Patients », « Réglages / Export ».

## Vérification

- `npm test` 19/19, `npm run lint`, `npm run build` réussis.
- `npm run test:e2e` 4/4, dont un parcours WebKit iPhone : absence des boutons retirés, barre sans texte, trois repères sans libellé visible, note ouverte et fermée par le triangle avec police 16 px, appui long réordonnant un patient en tête sans ouvrir sa fiche, ordre conservé après rechargement.
- Contrôle visuel à 375 px. Le geste tactile réel reste à confirmer sur iPhone.
