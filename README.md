# Food marketplace monorepo

Production two-sided food marketplace — **Layer 0** (Git governance) and **Layer 1** (environments & secrets).

## Layer 1 — Environments & secrets

Four environments: **local**, **preview** (per-PR), **staging**, **production**. Each has its own database and Stripe keys. Production credentials never load on developer machines (enforced in `@food-marketplace/config/env`).

- **Docs:** [docs/environments-and-secrets.md](docs/environments-and-secrets.md)
- **Boot validation:** `validateEnvAtBoot()` / `loadServerEnv()` / `loadClientEnv()` in `packages/config/src/env.ts`
- **Client bundle rule:** ESLint `food-marketplace/no-server-env-in-client` — non-`NEXT_PUBLIC_` `process.env` in `"use client"` files is a **lint error** (fails CI / build)
- **Secrets:** Vercel environment variables + Supabase Vault (see docs); `.env.example` only in git

## Layer 2 — Sandbox & local isolation

Docker Compose local stack (Postgres, Redis, MinIO, Mailpit, Stripe CLI), **`pnpm dev:seed`** deterministic data, and Dev Container config. **No production data on developer machines.**

- **Docs:** [docs/sandbox-and-local-isolation.md](docs/sandbox-and-local-isolation.md)
- **Commands:** `pnpm dev:up`, `pnpm dev:seed`, `pnpm dev:down`

## Layer 3 — Database & data governance

Postgres via **Drizzle Kit** (schema in code, paired SQL migrations, RLS on every table, default deny). Money in integer cents; `timestamptz` UTC; optimistic inventory decrements; idempotency keys; soft deletes; PII comments + pgcrypto; append-only audit log.

- **Docs:** [docs/database-governance.md](docs/database-governance.md)
- **Migrations:** `packages/db/drizzle/migrations/*.up.sql` + required `*.down.sql`
- **RLS tests:** `RUN_DB_INTEGRATION=1 pnpm test` (Postgres must be running / seeded)

## Layer 4 — Authentication & sessions

Supabase Auth (email + phone OTP, Google/Apple OAuth), `__Host-` HttpOnly session cookies, rotating refresh with reuse detection, CSRF double-submit + Origin checks, cookie consent, device revocation, step-up auth, admin TOTP, OTP rate limits + Turnstile.

- **Docs:** [docs/authentication-and-sessions.md](docs/authentication-and-sessions.md)
- **Package:** `@food-marketplace/auth` (+ `/server`, `/react`)
- **Supabase:** [supabase/config.toml](supabase/config.toml)

## Layer 5 — Authorization & governance

RBAC (`customer` → `superadmin`) in [`packages/shared/authz.ts`](packages/shared/authz.ts) via `can(user, action, resource)`. JWT `app_role` re-verified against `user_roles` on privileged ops. Admin audit + destructive reasons, retention jobs, DSAR export/delete.

- **Docs:** [docs/authorization-and-governance.md](docs/authorization-and-governance.md)
- **Jobs:** `pnpm jobs:retention`

## Layer 6 — Backend architecture

Next.js App Router (server-first), ESLint layer boundaries (`routes → services → repositories → db`), Zod at boundaries, `Result` types in services, Stripe webhook + Inngest async jobs, feature flags.

- **Docs:** [docs/backend-architecture.md](docs/backend-architecture.md)
- **App:** `apps/web` (`pnpm --filter @food-marketplace/web dev`)

## Layer 7 — Performance & latency budget

Hard CI gates for Web Vitals, API latency, bundle size, and SQL round-trips. PgBouncer transaction pooling, Redis tag cache, cursor pagination (no OFFSET), ISR browse feed, static marketing, image processing queue.

- **Docs:** [docs/performance-and-latency-budget.md](docs/performance-and-latency-budget.md)
- **Checks:** `pnpm perf:check`, `node scripts/perf/check-bundle-budget.mjs`

## Layer 8 — Traffic, resilience & scale

CDN cache headers, Cloudflare WAF/DDoS, Redis sliding-window rate limits (429 + Retry-After), circuit breakers (Stripe/Twilio/Mapbox), graceful Redis/queue degradation, k6 dinner burst, `/health/live` + `/health/ready`.

- **Docs:** [docs/traffic-resilience-scale.md](docs/traffic-resilience-scale.md)
- **Load test:** `k6 run load/k6/dinner-burst.js`

## Layer 9 — Frontend architecture

Strict TS, RSC-first with justified `"use client"`, four async states, error boundaries + Sentry, optimistic cart/favorites, PWA offline queue, RHF + shared Zod.

- **Docs:** [docs/frontend-architecture.md](docs/frontend-architecture.md)

## Layer 10 — UI system

Design tokens (no hardcoded hex/px in components), Storybook per component state, WCAG 2.2 AA gates (jsx-a11y + axe in CI), mobile-first 375px / 44px touch targets, **next-intl** (`en`, `es`, `zh`), dark mode + reduced motion via tokens.

- **Docs:** [docs/ui-system.md](docs/ui-system.md)
- **Storybook:** `pnpm --filter @food-marketplace/ui storybook`
- **A11y tests:** `pnpm test:a11y`

## Layer 11 — Testing & CI/CD

Vitest unit + **80% packages coverage**, Postgres integration + **RLS suite**, Stripe **contract fixtures**, Playwright **five critical paths**, full PR CI (typecheck → lint → unit → integration → build → bundle → E2E → Lighthouse → gitleaks → audit), preview DB branch deploy, production **canary 10%** with rollback.

- **Docs:** [docs/testing-cicd.md](docs/testing-cicd.md)
- **Unit + coverage:** `pnpm test:coverage`
- **E2E:** `E2E_TEST_MODE=1 E2E_TEST_TOKEN=local pnpm test:e2e`

## Layout

| Path                    | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `apps/web`              | Customer-facing app (stub)                                   |
| `apps/admin`            | Operations / vendor admin app (stub)                         |
| `packages/db`           | Database schema and access (stub)                            |
| `packages/ui`           | Design tokens, primitives, Storybook                         |
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
