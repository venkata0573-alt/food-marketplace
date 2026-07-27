# Layer 11 — Testing & CI/CD

Test pyramid, merge gates, preview deploys, and production canary/rollback.

## Test pyramid

| Layer          | Command                                      | Scope                                                                                                                                                         |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit + service | `pnpm test:unit`                             | Vitest; mocked repos; **80% coverage** on scoped `packages/` libs (domain, shared, rate-limit, resilience, cache keys, db seed plan — see `vitest.config.ts`) |
| Contract       | `pnpm test:contracts`                        | Stripe webhook JSON fixtures + Zod schemas                                                                                                                    |
| Integration    | `RUN_DB_INTEGRATION=1 pnpm test:integration` | Real Postgres (Docker); query plans                                                                                                                           |
| RLS            | `RUN_DB_INTEGRATION=1 pnpm test:rls`         | Dedicated row-level security suite                                                                                                                            |
| A11y           | `pnpm test:a11y`                             | axe on UI + checkout                                                                                                                                          |
| E2E            | `pnpm test:e2e`                              | Playwright — five critical paths + browse/cart UI                                                                                                             |

Local integration (Docker):

```bash
pnpm test:db:ci
```

## Critical E2E paths (Playwright)

1. **Chef signup** — creates chef row via `/api/e2e/flows` (`chef-signup`)
2. **Dish publish** — inserts dish + allergen link (`dish-publish`)
3. **Customer order** — order service draft on seeded data (`customer-order`)
4. **Allergen block** — order rejected when profile conflicts (`allergen-block`)
5. **Payout** — Stripe `payout.paid` idempotency (`payout`)

The E2E HTTP runner is **disabled** unless `E2E_TEST_MODE=1` and `x-e2e-token` matches `E2E_TEST_TOKEN` (CI only).

UI smoke: `/en/browse` and `/en/cart` at **375px** viewport.

## Stripe contract tests

Fixtures live in `tests/contracts/stripe/fixtures/*.json`. Each file must parse with its Zod schema in `tests/contracts/stripe/schemas.ts` and succeed through `createStripeWebhookService.acceptEvent`.

## CI pipeline (every PR)

Order enforced in `.github/workflows/ci.yml`:

1. **typecheck** (parallel with lint/audit/gitleaks)
2. **lint** + Prettier
3. **unit** — contracts, **coverage 80%**, a11y
4. **integration** + **RLS** (Postgres service)
5. **build** — Storybook, Next.js, perf + bundle budgets
6. **E2E** — seeded DB + Playwright
7. **Lighthouse CI**
8. **gitleaks** + **pnpm audit** (high)

All jobs must pass via the `ci-gate` aggregator before merge.

## Preview deploy

`.github/workflows/preview-deploy.yml` runs on pull requests:

- Creates an isolated **database branch** (`pr-<number>`) — wire Neon/Supabase API secrets.
- Migrates + **seeds** that branch.
- Deploys preview web with `APP_ENV=preview`.
- Comments PR with preview URL.

## Production deploy

`.github/workflows/deploy-production.yml`:

- **Canary** default **10%** traffic on `main` push (or manual dispatch).
- Monitors **error rate** and **p95 latency**; auto-**rollback** job on failure.
- Target: **reversible deploy in under 60 seconds** (platform rollback to previous revision).

Configure `production` GitHub Environment with secrets: `PRODUCTION_DATABASE_URL`, Stripe keys, `PRODUCTION_APP_URL`, Vercel/Fly tokens.

## Related

- [UI system (Layer 10)](./ui-system.md)
- [Frontend architecture (Layer 9)](./frontend-architecture.md)
