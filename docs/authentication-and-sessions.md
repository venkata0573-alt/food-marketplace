# Layer 4 — Authentication & sessions

## Provider

**Supabase Auth** with:

- Email OTP (passwordless)
- Phone OTP (passwordless — primary for non-technical cooks)
- Google + Apple OAuth
- TOTP MFA (mandatory for `admin`, optional for `chef`)

Configure providers in [`supabase/config.toml`](../../supabase/config.toml). **Never** apply database DDL in the Supabase dashboard — auth session tables are in Drizzle migration `0002_auth_sessions`.

## Session cookies (never localStorage)

| Cookie              | Flags                                   | Purpose                               |
| ------------------- | --------------------------------------- | ------------------------------------- |
| `__Host-fm-access`  | HttpOnly, Secure, SameSite=Lax, Path=/  | Short-lived access token (60 minutes) |
| `__Host-fm-refresh` | HttpOnly, Secure, SameSite=Lax, Path=/  | Rotating refresh token                |
| `__Host-fm-csrf`    | Secure, SameSite=Lax, Path=/ (readable) | CSRF double-submit token              |

Host-prefixed `__Host-` cookies require `Secure` and `Path=/` with no `Domain` attribute.

Access TTL: **60 minutes**. Refresh rotation with **reuse detection** — a replayed refresh token revokes the entire session family (`session_families` + `refresh_token_events` in Postgres, implemented in `@food-marketplace/auth`).

## CSRF

All state-changing HTTP methods require:

1. **Double-submit** — `x-csrf-token` header must match `__Host-fm-csrf` cookie
2. **Origin verification** — `Origin` must match an allowlist / host

Use `guardStateChangingRequest()` from `@food-marketplace/auth/server`.

## Cookie consent

`CookieConsentBanner` (`@food-marketplace/auth/react`) blocks non-essential categories until the user opts in. Consent is logged to `cookie_consent_log` with timestamp via `ConsentStore`.

Categories: **necessary** (always on), **analytics**, **marketing**.

## Session invalidation

`invalidateSessionsForSecurityEvent()` revokes all session families and calls Supabase global sign-out on:

- Password change
- Email change
- Role change

## Device list

`auth_devices` tracks active sessions/devices. Users can remotely revoke via `revokeRemoteDevice()`.

## Step-up authentication

Required before:

- Payout bank detail changes (`payout_bank_change`)
- Email change (`email_change`)
- Chef verification submission (`chef_verification_submit`)

Grants stored in `step_up_grants` (10-minute TTL).

## Rate limits & abuse controls

- **5 OTP sends per phone per hour** (`AuthRateLimiter` + Redis)
- **Exponential backoff** on failed verification attempts
- **Cloudflare Turnstile** required after **3** failures (`verifyTurnstileToken`)

## Admin 2FA

`assertAdminTotpEnrolled()` enforces TOTP for admin accounts before privileged routes.

## Package entrypoints

- `@food-marketplace/auth` — cookies, CSRF, rotation, rate limits, Supabase clients
- `@food-marketplace/auth/server` — mutation guard for route handlers
- `@food-marketplace/auth/react` — cookie consent UI
