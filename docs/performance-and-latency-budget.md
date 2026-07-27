# Layer 7 — Performance & latency budget

Hard gates enforced in CI (`pnpm perf:check`, bundle script, optional Lighthouse job).

## Budgets (source of truth)

| Metric                | Gate         | File                         |
| --------------------- | ------------ | ---------------------------- |
| TTFB p75              | < 200ms      | `budgets/web-vitals.json`    |
| LCP p75               | < 2.0s       | `budgets/web-vitals.json`    |
| INP p75               | < 200ms      | `budgets/web-vitals.json`    |
| CLS                   | < 0.1        | `budgets/web-vitals.json`    |
| API p95               | < 300ms      | `budgets/api-latency.json`   |
| API p99               | < 800ms      | `budgets/api-latency.json`   |
| First-load JS         | < 180KB gzip | `budgets/first-load-js.json` |
| Single SQL round-trip | < 100ms      | `budgets/query-latency.json` |

Committed lab baseline: `baseline/lighthouse-home.json` (must stay under gates).

## Database

- **PgBouncer** (transaction mode) in Docker — app `DATABASE_URL` → `:6432`; migrations use `DATABASE_DIRECT_URL` → Postgres `:54322`.
- **Indexes:** migration `0005_performance_indexes_media` (FK/WHERE/ORDER BY paths, browse cursor index).
- **No OFFSET** — cursor/keyset pagination only (`@food-marketplace/shared/cursor-pagination`); CI script `scripts/perf/check-no-offset.mjs`.
- **N+1:** repositories expose `batchGetChefsByIds`; services use `DataLoader` only when nesting is unavoidable.
- **Slow queries:** `timedQuery()` in app repos; >100ms throws when `ENFORCE_QUERY_BUDGET=1` or `CI=true`.
- **EXPLAIN ANALYZE:** `RUN_DB_INTEGRATION=1` → `tests/db/list-queries-explain.integration.test.ts`.

## Caching

- **Redis** (`@food-marketplace/cache`): TTLs — chef profiles 5m, dish listings 60s, availability 10s; tag invalidation; user-scoped keys require user id.
- **Next.js:** marketing `/` static; `/browse` ISR (`revalidate = 60`); chef profiles ISR 300s; `revalidateTag` on writes (orders action).

## Images

Upload → Inngest `image/process` → responsive WebP/AVIF variants in `dish_media` (never serve raw upload); blurhash placeholder column.

## Bundle & Edge

- `@next/bundle-analyzer` — `pnpm --filter @food-marketplace/web analyze`
- CI: `node scripts/perf/check-bundle-budget.mjs` after production build
- **Middleware:** locale + session cookie presence only (no DB, no CSRF) — CSRF on Server Actions / Node API helpers

## Commands

```bash
pnpm perf:check
node scripts/perf/check-bundle-budget.mjs   # requires env + build
RUN_DB_INTEGRATION=1 pnpm test tests/db/list-queries-explain.integration.test.ts
```

Optional Lighthouse CI (with server env): `npx @lhci/cli autorun --config=lighthouserc.cjs`
