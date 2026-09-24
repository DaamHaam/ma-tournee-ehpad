# BMAD CY — Ma tournée EHPAD

Ce dépôt regroupe l'application **Ma tournée EHPAD** et les documents BMAD qui ont guidé sa conception.

Version testable : [https://daamhaam.github.io/ma-tournee-ehpad/](https://daamhaam.github.io/ma-tournee-ehpad/)

- Application : [`bmad-cy/`](./bmad-cy/)
- Spécification du premier jalon : [`_bmad-output/implementation-artifacts/tech-spec-premiere-tournee-utilisable.md`](./_bmad-output/implementation-artifacts/tech-spec-premiere-tournee-utilisable.md)
- Suivi du sprint : [`_bmad-output/implementation-artifacts/sprint-status.yaml`](./_bmad-output/implementation-artifacts/sprint-status.yaml)

## Lancer l'application

```bash
cd bmad-cy
npm ci
npm run dev
```

## Vérifier la version

```bash
cd bmad-cy
npm test
npm run lint
npm run build
npm run test:e2e
```

Le workflow GitHub Actions vérifie les tests, le lint et la compilation, puis publie la version de production sur GitHub Pages depuis la branche `main`.

## Développer avec Codex ou Claude Code

Les règles communes sont dans [`AGENTS.md`](./AGENTS.md). Claude Code les charge par l'import présent dans [`CLAUDE.md`](./CLAUDE.md). Lancer `claude` depuis la racine du dépôt ou depuis `bmad-cy/` ; le fichier racine est découvert dans les deux cas.
