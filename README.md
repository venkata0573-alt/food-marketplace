# Food marketplace monorepo

Production two-sided food marketplace — **Layer 0** (Git governance) and **Layer 1** (environments & secrets).

## Layer 1 — Environments & secrets

Four environments: **local**, **preview** (per-PR), **staging**, **production**. Each has its own database and Stripe keys. Production credentials never load on developer machines (enforced in `@food-marketplace/config/env`).

- **Docs:** [docs/environments-and-secrets.md](docs/environments-and-secrets.md)
- **Boot validation:** `validateEnvAtBoot()` / `loadServerEnv()` / `loadClientEnv()` in `packages/config/src/env.ts`
- **Client bundle rule:** ESLint `food-marketplace/no-server-env-in-client` — non-`NEXT_PUBLIC_` `process.env` in `"use client"` files is a **lint error** (fails CI / build)
- **Secrets:** Vercel environment variables + Supabase Vault (see docs); `.env.example` only in git

## Layout

| Path                    | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `apps/web`              | Customer-facing app (stub)                                   |
| `apps/admin`            | Operations / vendor admin app (stub)                         |
| `packages/db`           | Database schema and access (stub)                            |
| `packages/ui`           | Shared UI (stub)                                             |
| `packages/config`       | Shared TS presets, **Zod env validation**, ESLint env plugin |
| `packages/shared-types` | Cross-package TypeScript types                               |
| `packages/shared`       | Sensitive shared modules (`authz.ts`)                        |

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

Copy root or app `.env.example` to `.env.local`. **Never commit `.env` files.** Production/staging values live in Vercel only.

## GitHub

- **CODEOWNERS**: `@venkata0573-alt` (see `.github/CODEOWNERS`).
- **Dependabot**: weekly grouped npm and GitHub Actions updates.
- **CI**: `.github/workflows/ci.yml` — gitleaks, ESLint, Prettier, typecheck, unit tests.
- **Branch protection**: see [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md).

## Scripts

- `scripts/gitleaks-staged.sh` — pre-commit secret scan
- `scripts/apply-branch-protection.sh` — apply `main` protection via `gh` (after remote exists)
