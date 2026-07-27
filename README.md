# Food marketplace monorepo

Production two-sided food marketplace — **Layer 0: repository and Git governance**.

## Layout

| Path                    | Purpose                               |
| ----------------------- | ------------------------------------- |
| `apps/web`              | Customer-facing app (stub)            |
| `apps/admin`            | Operations / vendor admin app (stub)  |
| `packages/db`           | Database schema and access (stub)     |
| `packages/ui`           | Shared UI (stub)                      |
| `packages/config`       | Shared ESLint / TypeScript presets    |
| `packages/shared-types` | Cross-package TypeScript types        |
| `packages/shared`       | Sensitive shared modules (`authz.ts`) |

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## Git workflow (trunk-based)

- **`main` is always deployable.**
- Short-lived feature branches; **squash merge only** into `main`.
- **Conventional Commits** enforced by commitlint on every commit message.
- **Semantic versioning** via [Changesets](https://github.com/changesets/changesets) (`pnpm changeset` on user-facing package changes).

## Hooks

| Hook           | Behavior                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **pre-commit** | `lint-staged` (ESLint, Prettier, `tsc --noEmit` via `pnpm typecheck`) + **gitleaks** staged scan |
| **commit-msg** | commitlint (Conventional Commits)                                                                |
| **pre-push**   | `pnpm test` (unit tests)                                                                         |

Install [gitleaks](https://github.com/gitleaks/gitleaks) locally for pre-commit secret scanning (`brew install gitleaks`).

## Environment

Copy `.env.example` to a local env file (e.g. `.env.local`). **Never commit `.env` files** — they are gitignored.

## GitHub

- **CODEOWNERS**: `@venkata0573-alt` (see `.github/CODEOWNERS`).
- **Dependabot**: weekly grouped npm and GitHub Actions updates.
- **CI**: `.github/workflows/ci.yml` — gitleaks, ESLint, Prettier, typecheck, unit tests.
- **Branch protection**: see [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md).

## Scripts

- `scripts/gitleaks-staged.sh` — pre-commit secret scan
- `scripts/apply-branch-protection.sh` — apply `main` protection via `gh` (after remote exists)
