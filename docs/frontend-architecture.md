# Layer 9 — Frontend architecture

## TypeScript

Apps use **`strict-react`** (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).  
**`@typescript-eslint/no-explicit-any`** is an **error** in `apps/web` and `packages/shared-types`.

## Server Components first

- Default to RSC; **`"use client"`** requires a **`client-justification:`** comment (ESLint `food-marketplace/require-use-client-justification`).

## State

| Concern                      | Tool                                             |
| ---------------------------- | ------------------------------------------------ |
| Shareable filters/pagination | **URL search params** (`/browse?cursor=`)        |
| Server-backed data           | **TanStack Query** (`QueryProvider`)             |
| Cross-tree UI (cart)         | **Zustand** (`useCartStore`) — not a global dump |

## Async UI (four states)

Every surface implements **loading (skeleton)**, **empty**, **error (retry)**, **success**.

- Browse: `loading.tsx`, `error.tsx`, empty list in `BrowseFeedSuccess`
- Shared primitives: `src/client/components/async-ui.tsx`

## Error boundaries

- `app/error.tsx` — segment fallback
- `app/global-error.tsx` — reports to **Sentry** (`NEXT_PUBLIC_SENTRY_DSN`), no white screen
- Route segments: `browse/error.tsx`, `chefs/[slug]/error.tsx`

## Optimistic UI

- **Cart:** Zustand + rollback via `persistCartOptimistic`
- **Favorites:** optimistic toggle + `/api/favorites` with rollback

## Offline / PWA

- `public/manifest.webmanifest` + `public/sw.js` (cached shell)
- `ServiceWorkerRegister` + `OfflineMutationDrain` (localStorage queue)

## Forms

**React Hook Form** + **`createOrderInputSchema`** from `@food-marketplace/shared-types/order` (same Zod as server).

## Validation source of truth

`packages/shared-types/src/order.schemas.ts` — imported by server (`order.schemas.ts` re-export) and client forms.
