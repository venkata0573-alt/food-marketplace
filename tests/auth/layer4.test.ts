import {
  assertAdminTotpEnrolled,
  buildSessionSetCookies,
  hashRefreshToken,
  issueCsrfToken,
  rotateRefreshToken,
  verifyDoubleSubmitCsrf,
  type SessionFamilyStore,
} from '@food-marketplace/auth';
import { guardStateChangingRequest } from '@food-marketplace/auth/server';
import { describe, expect, it, vi } from 'vitest';

describe('session cookies', () => {
  it('sets __Host- prefixed HttpOnly session cookies', () => {
    const cookies = buildSessionSetCookies(
      { accessToken: 'access', refreshToken: 'refresh' },
      true,
    );
    expect(cookies[0]).toContain('__Host-fm-access=');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    expect(cookies[0]).toContain('Path=/');
    expect(cookies[1]).toContain('__Host-fm-refresh=');
  });
});

describe('CSRF double-submit', () => {
  it('accepts matching header and cookie', () => {
    const token = issueCsrfToken();
    const ok = verifyDoubleSubmitCsrf({
      headers: { get: (name) => (name === 'x-csrf-token' ? token : null) },
      cookies: { get: () => ({ value: token }) },
    });
    expect(ok).toBe(true);
  });

  it('rejects mismatched tokens', () => {
    const ok = verifyDoubleSubmitCsrf({
      headers: { get: () => 'a' },
      cookies: { get: () => ({ value: 'b' }) },
    });
    expect(ok).toBe(false);
  });
});

describe('mutation guard', () => {
  it('requires CSRF and Origin on POST', () => {
    const token = issueCsrfToken();
    expect(() =>
      guardStateChangingRequest(
        {
          method: 'POST',
          headers: {
            get: (name) => {
              if (name === 'origin') return 'http://localhost:3000';
              if (name === 'x-csrf-token') return token;
              return null;
            },
          },
          cookies: { get: () => ({ value: token }) },
        },
        { allowedOrigins: ['http://localhost:3000'], host: 'localhost:3000' },
      ),
    ).not.toThrow();
  });
});

describe('refresh rotation reuse detection', () => {
  it('revokes family when an old refresh token is replayed', async () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    let current = hashRefreshToken('refresh-v1');
    const used = new Set<string>();
    let revoked = false;

    const store: SessionFamilyStore = {
      findByRefreshHash: async (hash) => {
        if (used.has(hash) && hash !== current) {
          return {
            id: 'family-1',
            userId,
            currentRefreshHash: current,
            revokedAt: null,
            previouslyUsed: true,
          };
        }
        if (hash === current) {
          return {
            id: 'family-1',
            userId,
            currentRefreshHash: current,
            revokedAt: null,
            previouslyUsed: false,
          };
        }
        return null;
      },
      recordRotation: async (_familyId, previousHash, nextHash) => {
        used.add(previousHash);
        current = nextHash;
      },
      markReuseAndRevokeFamily: async () => {
        revoked = true;
      },
      createFamily: async () => 'family-1',
      revokeAllForUser: async () => {},
    };

    const first = await rotateRefreshToken(store, 'refresh-v1', async () => ({
      accessToken: 'a2',
      refreshToken: 'refresh-v2',
    }));
    expect(first.ok).toBe(true);

    const replay = await rotateRefreshToken(store, 'refresh-v1', async () => ({
      accessToken: 'a3',
      refreshToken: 'refresh-v3',
    }));
    expect(replay.ok).toBe(false);
    if (!replay.ok) {
      expect(replay.reason).toBe('reuse_detected');
    }
    expect(revoked).toBe(true);
  });
});

describe('admin TOTP policy', () => {
  it('blocks admin without TOTP', () => {
    expect(() => assertAdminTotpEnrolled({ id: '1', role: 'admin', totpEnrolled: false })).toThrow(
      /TOTP/,
    );
  });
});

describe('OTP rate limiter', () => {
  it('allows up to 5 OTP requests per hour', async () => {
    const { AuthRateLimiter } = await import('@food-marketplace/auth');
    const store = new Map<string, number>();
    const redis = {
      incr: vi.fn(async (key: string) => {
        store.set(key, (store.get(key) ?? 0) + 1);
        return store.get(key)!;
      }),
      expire: vi.fn(async () => 1),
      ttl: vi.fn(async () => 3600),
      del: vi.fn(async () => 1),
    };
    const limiter = new AuthRateLimiter(redis as never);
    for (let i = 0; i < 5; i += 1) {
      const result = await limiter.checkOtpSendAllowed('+15551234567');
      expect(result.allowed).toBe(true);
    }
    const blocked = await limiter.checkOtpSendAllowed('+15551234567');
    expect(blocked.allowed).toBe(false);
  });
});
