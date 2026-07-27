import { describe, expect, it } from 'vitest';

import {
  err,
  mapServiceErrorToStatus,
  ok,
  publicErrorBody,
} from '../../packages/domain/src/result';

describe('@food-marketplace/domain result', () => {
  it('maps error codes to HTTP status', () => {
    expect(mapServiceErrorToStatus('NOT_FOUND')).toBe(404);
    expect(mapServiceErrorToStatus('FORBIDDEN')).toBe(403);
    expect(mapServiceErrorToStatus('VALIDATION')).toBe(400);
    expect(mapServiceErrorToStatus('CONFLICT')).toBe(409);
    expect(mapServiceErrorToStatus('RATE_LIMITED')).toBe(429);
    expect(mapServiceErrorToStatus('INTERNAL')).toBe(500);
  });

  it('builds public error bodies without internal message leakage', () => {
    const failure = err('VALIDATION', 'Bad input', 'internal detail');
    expect(failure.ok).toBe(false);
    if (!failure.ok) {
      const body = publicErrorBody(failure.error);
      expect(body.error.message).toBe('Bad input');
      expect(JSON.stringify(body)).not.toContain('internal detail');
    }
  });

  it('wraps success values', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
  });
});
