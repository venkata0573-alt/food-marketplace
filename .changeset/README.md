# Changesets

When a PR includes user-visible or publishable package changes, add a changeset:

```bash
pnpm changeset
```

Version bumps on `main` are applied with `pnpm version-packages` (typically via a release workflow later).
