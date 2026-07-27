# Layer 1 — Environments & secrets

## Four environments

| Environment    | Purpose                    | Database                                 | Stripe                                                          | Where secrets live                                      |
| -------------- | -------------------------- | ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **local**      | Developer laptop           | Local / dedicated dev Supabase project   | `sk_test_` / `pk_test_`                                         | `.env.local` only (never committed)                     |
| **preview**    | Ephemeral per-PR deploy    | Isolated preview DB (branch / PR scoped) | `sk_test_` / `pk_test_`                                         | Vercel **Preview** env vars                             |
| **staging**    | Pre-production integration | Staging Supabase project                 | `sk_test_` / `pk_test_` (separate Stripe test account optional) | Vercel **Production** on staging project, or custom env |
| **production** | Live marketplace           | Production Supabase project              | `sk_live_` / `pk_live_`                                         | Vercel **Production** + Supabase Vault for rotation     |

**Rule:** production credentials **never** exist on a developer machine. `loadServerEnv()` refuses `APP_ENV=production` unless `VERCEL=1` and `VERCEL_ENV=production`.

## Secret storage

- **Vercel environment variables** — application secrets (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.). Scoped per environment (Development / Preview / Production).
- **Supabase Vault** — database-side secrets and rotation (service credentials, webhooks). Apps receive values only through Vercel-injected env at runtime, not from client bundles or git.

Never commit secrets. Never embed secrets in source. Never reference non-`NEXT_PUBLIC_` env vars in client components (enforced by ESLint).

## Required variables

See root [`.env.example`](../.env.example) and per-app `.env.example` files. Boot-time validation: `@food-marketplace/config/env` (`validateEnvAtBoot`).

### Server-only

- `APP_ENV` — `local` \| `preview` \| `staging` \| `production`
- `DATABASE_URL` — PostgreSQL connection string (unique per environment)
- `STRIPE_SECRET_KEY` — test keys except in production
- `SUPABASE_SERVICE_ROLE_KEY` — optional until Supabase wiring lands

### Client-safe (`NEXT_PUBLIC_*`)

- `NEXT_PUBLIC_APP_ENV` — must match `APP_ENV`
- `NEXT_PUBLIC_APP_URL` — canonical URL for the deploy
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — publishable key only

## Vercel mapping

Set **`APP_ENV` explicitly** in the Vercel dashboard (do not rely on `NODE_ENV` alone):

| Vercel context           | Set `APP_ENV` | Notes                                                    |
| ------------------------ | ------------- | -------------------------------------------------------- |
| Local `vercel dev`       | `local`       | Uses Development env vars in Vercel CLI                  |
| Preview deployments      | `preview`     | One preview DB strategy per PR (document in infra layer) |
| Staging project / branch | `staging`     | Separate Vercel project recommended                      |
| Production               | `production`  | Live keys only here                                      |

Monorepo apps: `apps/web`, `apps/admin` — configure Root Directory in Vercel per app.

## Supabase Vault

Use Vault for secrets that should rotate without redeploying application code where possible. Application runtime still reads **`DATABASE_URL`** and service keys from **Vercel**, populated from your secret management runbook (manual or automated sync from Vault). Do not read Vault from browser code.

## Boot validation

Each app calls `validateEnvAtBoot()` from server entry / build (see `apps/web/scripts/validate-env.mjs`). The process exits non-zero on missing or malformed variables before serving traffic.
