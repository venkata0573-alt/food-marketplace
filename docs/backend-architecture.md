# Layer 6 — Backend architecture

## Next.js App Router (server-first)

| Surface               | Use for                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| **Server Components** | Reads (`app/page.tsx`)                                                          |
| **Server Actions**    | Mutations (`app/actions/*`)                                                     |
| **Route handlers**    | Webhooks + third-party callbacks only (`app/api/webhooks/*`, `app/api/inngest`) |

Business logic never lives in route files — they delegate to **services** via `runWithServices()`.

**Edge middleware (Layer 7):** locale + session cookie presence only — no database or CSRF in Edge (CSRF on Server Actions / Node API helpers).

## Layering (ESLint enforced)

```
routes (app/) → services → repositories → pg (via composition root)
```

- **Routes/actions** cannot import repositories or `@food-marketplace/db`.
- **Services** cannot import `app/` or `@food-marketplace/db` directly.
- **Repositories** are the only layer that runs SQL (via `pg` `Client`).
- **`runWithServices()`** (`src/server/context.ts`) is the composition root — it opens connections through `src/server/db/with-client.ts` (mirrors `@food-marketplace/db` for Next bundling).

See root `eslint.config.mjs` rules for `apps/web`.

## Validation

- **Zod** at boundaries (`src/server/validation/*`) — `safeParse` / `parse`, inferred types flow inward.
- Never trust client **price**, **chef ID**, or **order total** — recompute in services from repository data.

## Results & errors

- Services return **`Result<T>`** from `@food-marketplace/domain` (no thrown exceptions for expected failures).
- HTTP/actions map `ServiceError.code` → status via `mapServiceErrorToStatus`.
- Clients receive **`publicMessage` only** — no stack traces.

## Stripe webhooks

`POST /api/webhooks/stripe`:

1. Verify Stripe signature
2. Insert `event_id` into `stripe_webhook_events` (idempotent)
3. Respond **200 immediately**
4. Enqueue Inngest job `stripe/webhook.received` for async processing

## Background jobs (Inngest)

- Client: `src/server/jobs/inngest/functions.ts`
- Serve endpoint: `/api/inngest`
- Retries with exponential backoff (Inngest defaults + DLQ via Inngest dashboard/alerts)

Job types to extend: payouts, email, SMS, image processing, batch delivery grouping.

## Feature flags

Package `@food-marketplace/feature-flags` — database `feature_flags` table + `FEATURE_FLAGS_JSON` env override for ship-dark toggles.

## Migration

`0004_backend_webhooks_flags` — `stripe_webhook_events`, `feature_flags`.
