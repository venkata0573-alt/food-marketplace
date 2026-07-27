import {
  assertProductionIsolation,
  EnvValidationError,
  loadClientEnv,
  loadServerEnv,
  validateEnvAtBoot,
} from '@food-marketplace/config/env';
import { describe, expect, it } from 'vitest';

const localServerBase = {
  APP_ENV: 'local',
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  STRIPE_SECRET_KEY: 'sk_test_local_secret',
  NODE_ENV: 'development',
};

const localClientBase = {
  NEXT_PUBLIC_APP_ENV: 'local',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_local_publishable',
};

describe('loadServerEnv', () => {
  it('accepts valid local server env', () => {
    const env = loadServerEnv({ ...localServerBase });
    expect(env.APP_ENV).toBe('local');
    expect(env.STRIPE_SECRET_KEY).toMatch(/^sk_test_/);
  });

  it('rejects missing DATABASE_URL', () => {
    expect(() =>
      loadServerEnv({
        APP_ENV: 'local',
        STRIPE_SECRET_KEY: 'sk_test_x',
      }),
    ).toThrow(EnvValidationError);
  });

  it('rejects live Stripe keys outside production', () => {
    expect(() =>
      loadServerEnv({
        ...localServerBase,
        STRIPE_SECRET_KEY: 'sk_live_not_allowed_locally',
      }),
    ).toThrow(EnvValidationError);
  });

  it('rejects production APP_ENV on a developer machine', () => {
    expect(() =>
      loadServerEnv({
        ...localServerBase,
        APP_ENV: 'production',
        STRIPE_SECRET_KEY: 'sk_live_production',
        DATABASE_URL: 'postgresql://prod.example.com:5432/postgres',
      }),
    ).toThrow(/Refusing to start/);
  });

  it('allows production only on Vercel production', () => {
    const env = loadServerEnv({
      APP_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'production',
      DATABASE_URL: 'postgresql://prod.example.com:5432/postgres',
      STRIPE_SECRET_KEY: 'sk_live_production',
    });
    expect(env.APP_ENV).toBe('production');
  });
});

describe('loadClientEnv', () => {
  it('accepts valid NEXT_PUBLIC variables', () => {
    const env = loadClientEnv({ ...localClientBase });
    expect(env.NEXT_PUBLIC_APP_ENV).toBe('local');
  });

  it('rejects APP_ENV mismatch', () => {
    expect(() =>
      loadClientEnv({
        ...localClientBase,
        APP_ENV: 'staging',
      }),
    ).toThrow(/must match APP_ENV/);
  });
});

describe('validateEnvAtBoot', () => {
  it('validates server and client together', () => {
    const result = validateEnvAtBoot({
      ...localServerBase,
      ...localClientBase,
    });
    expect(result.server.APP_ENV).toBe('local');
    expect(result.client.NEXT_PUBLIC_APP_ENV).toBe('local');
  });
});

describe('assertProductionIsolation', () => {
  it('does not throw for non-production env', () => {
    expect(() => assertProductionIsolation({ APP_ENV: 'preview' })).not.toThrow();
  });
});
