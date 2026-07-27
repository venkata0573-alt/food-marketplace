import { createHash, randomBytes } from 'node:crypto';

import { ACCESS_TOKEN_TTL_SECONDS, COOKIE_NAMES, REFRESH_TOKEN_TTL_SECONDS } from '../constants.js';

export interface CookieSerializeOptions {
  secure: boolean;
  maxAgeSeconds: number;
}

export interface SessionCookiePayload {
  accessToken: string;
  refreshToken: string;
}

function hostCookie(name: string, value: string, options: CookieSerializeOptions): string {
  const segments = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${options.maxAgeSeconds}`,
    'SameSite=Lax',
  ];
  if (options.secure) {
    segments.push('Secure');
  }
  return segments.join('; ');
}

/** CSRF double-submit cookie is intentionally readable by same-origin JS (not HttpOnly). */
export function csrfCookie(name: string, value: string, options: CookieSerializeOptions): string {
  const segments = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${options.maxAgeSeconds}`,
    'SameSite=Lax',
  ];
  if (options.secure) {
    segments.push('Secure');
  }
  return segments.join('; ');
}

export function buildSessionSetCookies(payload: SessionCookiePayload, secure: boolean): string[] {
  return [
    hostCookie(COOKIE_NAMES.access, payload.accessToken, {
      secure,
      maxAgeSeconds: ACCESS_TOKEN_TTL_SECONDS,
    }),
    hostCookie(COOKIE_NAMES.refresh, payload.refreshToken, {
      secure,
      maxAgeSeconds: REFRESH_TOKEN_TTL_SECONDS,
    }),
  ];
}

export function buildSessionClearCookies(secure: boolean): string[] {
  return [
    hostCookie(COOKIE_NAMES.access, '', { secure, maxAgeSeconds: 0 }),
    hostCookie(COOKIE_NAMES.refresh, '', { secure, maxAgeSeconds: 0 }),
  ];
}

export function issueCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}

export function buildCsrfSetCookie(token: string, secure: boolean): string {
  return csrfCookie(COOKIE_NAMES.csrf, token, {
    secure,
    maxAgeSeconds: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
