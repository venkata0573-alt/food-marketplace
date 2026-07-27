/** Access token lifetime — short-lived, refreshed via rotating refresh cookie. */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 60 minutes

/** Refresh token cookie lifetime (rotation still enforced server-side). */
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const COOKIE_NAMES = {
  access: '__Host-fm-access',
  refresh: '__Host-fm-refresh',
  csrf: '__Host-fm-csrf',
  consent: '__Host-fm-consent',
} as const;

export const CSRF_HEADER = 'x-csrf-token';

export const STEP_UP_ACTIONS = [
  'payout_bank_change',
  'email_change',
  'chef_verification_submit',
] as const;

export type StepUpAction = (typeof STEP_UP_ACTIONS)[number];

export const STEP_UP_TTL_SECONDS = 10 * 60;

export const OTP_RATE_LIMIT = {
  maxPerPhonePerHour: 5,
  windowSeconds: 60 * 60,
} as const;

export const VERIFICATION_FAILURE_CAPTCHA_THRESHOLD = 3;

export const CONSENT_CATEGORIES = ['necessary', 'analytics', 'marketing'] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];
