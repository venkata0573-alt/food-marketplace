# Layer 2 — Sandbox & local isolation

## Principle

**No developer ever touches production data.** Local and preview environments use Docker Compose plus deterministic seeds. Staging is refreshed only from **anonymized** production dumps (PII scrubbed, emails rewritten, payment tokens removed).

## Local stack (Docker Compose)

From the repo root:

```bash
pnpm dev:up      # Postgres, Redis, MinIO, Mailpit, Stripe CLI webhook forward
pnpm dev:seed    # migrate + deterministic seed
pnpm dev:down    # stop containers
```

| Service        | Host ports                     | Purpose                                                                     |
| -------------- | ------------------------------ | --------------------------------------------------------------------------- |
| **Postgres**   | `54322`                        | App database (`food_marketplace`)                                           |
| **Redis**      | `6379`                         | Cache / queues (later layers)                                               |
| **MinIO**      | `9000` (API), `9001` (console) | S3-compatible photo storage (`food-photos` bucket)                          |
| **Mailpit**    | `8025` (UI), `1025` (SMTP)     | Captures outbound email locally                                             |
| **Stripe CLI** | —                              | Forwards webhooks to `http://host.docker.internal:3000/api/webhooks/stripe` |

Set `STRIPE_SECRET_KEY` in `.env.local` (test key) before `pnpm dev:up` so Stripe CLI can authenticate.

## Deterministic seed (`pnpm dev:seed`)

Implemented in `@food-marketplace/db`:

| Entity    | Count | Notes                                |
| --------- | ----: | ------------------------------------ |
| Chefs     |    20 | Stable UUIDs from fixed PRNG seed    |
| Dishes    |    60 | Linked to chefs, allergen links      |
| Allergens |    14 | EU-style taxonomy                    |
| Orders    |   100 | **10 per** `order_status` enum value |

Seed integer: `DETERMINISTIC_SEED` in `packages/db/src/seed/plan.ts`. Same seed → same data → reproducible tests.

## Dev Container

Open the repo in a Dev Container (`.devcontainer/`). You get Node 20, pnpm 9, and the same Compose services. Inside the container, use service hostnames (`postgres`, `redis`, `minio`, `mailpit`) — see `remoteEnv` in `devcontainer.json`.

## Staging from production

1. **Export** (CI only, read-only prod creds): `scripts/anonymize-production-dump.sh`
2. **Scrub** PII, rewrite emails to `@staging.invalid`, null Stripe/payment tokens
3. **Restore** to staging DB: `scripts/staging-restore-anonymized-dump.sh`

Never copy production connection strings to `.env.local`. Production remains Vercel-only (Layer 1).

## Environment variables (local)

See root `.env.example` for `DATABASE_URL`, Redis, MinIO, and Mailpit settings aligned with Compose ports.
