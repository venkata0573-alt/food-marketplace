# Cloudflare (Layer 8)

Production traffic path: **Cloudflare WAF/DDoS → Vercel Edge (CDN) → origin**.

## Recommended controls

| Control                         | Scope                                                |
| ------------------------------- | ---------------------------------------------------- |
| WAF managed rules               | OWASP, SQLi, XSS                                     |
| DDoS protection                 | L3/L7 automatic                                      |
| Bot Fight Mode / Bot Management | `/signup`, `/login`, checkout Server Actions         |
| Rate limiting rules             | Complement app Redis limits at edge (per-IP)         |
| Cache rules                     | Respect origin `Cache-Control` / `CDN-Cache-Control` |

## Bot management (signup / login / checkout)

- Enable Cloudflare **Super Bot Fight Mode** (or Bot Management on Enterprise) on routes matching:
  - `*/login*`, `*/signup*`, checkout paths
- Require **Turnstile** (already integrated in `@food-marketplace/auth`) on auth mutations.

## Example rate limit (edge)

Create a rate limiting rule: **300 requests / minute / IP** for `/*`, with stricter limits on `/api/*`.

Document-only in-repo — configure in Cloudflare dashboard or Terraform outside this monorepo.
