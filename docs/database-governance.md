# Layer 3 — Database & data governance

## Source of truth

- **Postgres** schema is defined in `packages/db/src/schema/` (Drizzle ORM).
- **Migrations** live in `packages/db/drizzle/migrations/` as paired `*.up.sql` / `*.down.sql` files.
- **Forward-only** in production; rollbacks use explicit down scripts in non-production environments.
- **Never** edit schema in the Supabase dashboard — CI verifies migration pairs via `pnpm --filter @food-marketplace/db verify:migrations`.

## Row Level Security

RLS is **enabled and forced** on every application table with **default deny**. Policies are defined per role:

| Postgres role       | Application role         |
| ------------------- | ------------------------ |
| `app_anon`          | anon                     |
| `app_authenticated` | authenticated            |
| `app_chef`          | chef                     |
| `app_admin`         | admin                    |
| `app_service_role`  | service_role (BYPASSRLS) |

Session context via `set_config('app.user_id', ...)` and `set_config('app.role', ...)`.

Integration tests (`RUN_DB_INTEGRATION=1`) assert **unauthorized reads return zero rows** for each restrictive policy.

## Constraints & types

- **Money:** integer `*_cents` columns only — never floats.
- **Timestamps:** `TIMESTAMPTZ`, UTC in the database; convert at render time only.
- **Integrity:** foreign keys, `CHECK` constraints, justified `NOT NULL`, unique indexes on natural keys (slug, order_number, etc.).

## Inventory concurrency

Batch decrements use:

```sql
UPDATE inventory_batches
SET remaining_quantity = remaining_quantity - $qty, version = version + 1
WHERE id = $batch AND remaining_quantity >= $qty
RETURNING *;
```

Overselling a batch returns no row — callers must fail the transaction.

## Idempotency

`idempotency_keys` stores client `Idempotency-Key` values (scoped to `order` | `payment`). Only `service_role` may read/write.

## Soft delete & erasure

User-facing entities include `deleted_at`. Hard delete is reserved for GDPR/CCPA erasure jobs executed with `service_role`.

## PII & audit

- Column **classification** is documented with `COMMENT ON COLUMN` (`public`, `internal`, `pii`, `sensitive`).
- Sensitive values (e.g. customer email) stored encrypted via `pgcrypto` helpers `encrypt_sensitive` / `decrypt_sensitive`.
- **`audit_log`** is append-only (`REVOKE UPDATE, DELETE`); captures actor, action, entity, before/after JSON, IP, timestamp.

## Commands

```bash
pnpm --filter @food-marketplace/db migrate        # apply up migrations
pnpm --filter @food-marketplace/db migrate:down   # roll back last migration (non-prod)
pnpm --filter @food-marketplace/db db:generate    # Drizzle Kit diff → SQL (commit results)
pnpm dev:seed                                     # migrate + deterministic seed
RUN_DB_INTEGRATION=1 pnpm test                      # RLS + inventory integration tests (requires Postgres)
```
