# Layer 8 — Traffic, resilience & scale

## CDN & caching

- **Vercel Edge + Cloudflare** in front of origin (see [infra/cloudflare/README.md](../infra/cloudflare/README.md)).
- Explicit **`Cache-Control`**, **`CDN-Cache-Control`**, and **`Vercel-CDN-Cache-Control`** via middleware + `cacheControl()` helper.
- Static assets: `immutable` long cache; browse/chef/marketing: ISR-friendly shared CDN TTL.

## WAF / DDoS / bots

- Cloudflare WAF + DDoS at the edge.
- Bot management on signup, login, checkout (Turnstile + Cloudflare bot rules).

## Rate limiting (Redis sliding window)

Package **`@food-marketplace/rate-limit`** — three tiers:

| Tier         | Key                     | Default          |
| ------------ | ----------------------- | ---------------- |
| Per-IP       | `ratelimit:ip:*`        | 300 / 60s        |
| Per-user     | `ratelimit:user:*`      | 120 / 60s        |
| Per-endpoint | checkout, login, signup | stricter windows |

Returns **429** with **`Retry-After`**. Wired on checkout (Server Action) and Stripe webhook (IP + endpoint).

## Circuit breakers

Package **`@food-marketplace/resilience`** — Stripe, Twilio, Mapbox with timeouts, bounded retries + jitter.

| Dependency | Degraded behavior                                            |
| ---------- | ------------------------------------------------------------ |
| Mapbox     | App renders; map omitted (`geocodeCity` returns degraded)    |
| Twilio     | SMS skipped, flagged `degraded`                              |
| Stripe     | Webhook verification fails closed; API errors surface as 5xx |

## Graceful degradation

- **Redis down:** `@food-marketplace/cache` resilient wrapper → uncached responses (never 500).
- **Queue down:** `pending_queue_jobs` + `enqueueWithReconciliation()` — accept work, reconcile later.

## Health

| Route               | Purpose                         |
| ------------------- | ------------------------------- |
| `GET /health/live`  | Process up                      |
| `GET /health/ready` | Postgres + Redis (+ queue stub) |

Legacy: `GET /api/health` → live alias for perf harness.

## Load testing (k6)

```bash
# Install k6 locally, start app, then:
BASE_URL=http://127.0.0.1:3000 K6_BASE_RPS=50 k6 run load/k6/dinner-burst.js
```

Models a **20-minute dinner burst** at **10×** base RPS (tune via env).

## Migration

`0006_resilience_queue_reconcile` — `pending_queue_jobs` table.
