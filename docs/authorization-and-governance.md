# Layer 5 — Authorization & governance

## RBAC

Roles (authoritative in Postgres `user_roles.role`):

`customer`, `chef`, `chef_pending`, `support`, `admin`, `superadmin`

JWT carries custom claim **`app_role`**. On **every privileged operation**, the server reloads the role from the database and requires **`jwtRole === dbRole`**. Never trust the JWT claim alone.

## Single authorization module

All server actions and route handlers call:

```typescript
import { assertCan, can } from '@food-marketplace/shared/authz';

assertCan(user, 'order:cancel', { type: 'order', id: orderId, ownerUserId });
```

**No inline permission checks** in handlers — policy lives only in [`packages/shared/authz.ts`](../packages/shared/authz.ts) (CODEOWNERS-protected).

## Admin audit & destructive reasons

Use `performAdminAction()` from `@food-marketplace/shared/admin-audit` for admin mutations. All admin actions are written to `audit_log`.

Destructive operations **require a stated reason**:

- `chef:suspend`
- `order:cancel` (admin/support path)
- `order:refund`

## Data retention (scheduled jobs)

Package `@food-marketplace/jobs`:

| Job                       | Retention rule                                           |
| ------------------------- | -------------------------------------------------------- |
| `retention:orders`        | Soft-deleted orders purged after **7 years** (tax)       |
| `retention:auth-logs`     | `auth:*` audit rows removed after **1 year**             |
| `retention:identity-docs` | ID uploads marked deleted **30 days** after verification |

Run via cron / GitHub scheduled workflow (`.github/workflows/data-retention.yml`).

## DSAR

Async endpoints (email confirmation before processing):

- **POST** `/api/dsar/export-my-data`
- **POST** `/api/dsar/delete-my-account`

Handlers: `@food-marketplace/shared/dsar-handlers` — enqueue `dsar_requests`, send confirmation email, process after token confirm.

Hard delete of user-facing data only through the GDPR/CCPA erasure job after confirmed delete request.
