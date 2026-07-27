import { z } from 'zod';

import {
  type AppEnvironment,
  type ClientEnv,
  appEnvironmentSchema,
  createClientEnvSchema,
  createServerEnvSchema,
  type ServerEnv,
} from './env-schema.js';

export type { AppEnvironment, ClientEnv, ServerEnv };
export { appEnvironmentSchema, createClientEnvSchema, createServerEnvSchema };

export class EnvValidationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(message: string, issues: z.ZodIssue[]) {
    super(message);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

function formatZodError(prefix: string, error: z.ZodError): EnvValidationError {
  const details = error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  return new EnvValidationError(`${prefix}\n${details}`, error.issues);
}

/**
 * Production credentials must only load on Vercel Production deployments.
 * They must never exist on developer laptops (local `.env.local`).
 */
export function assertProductionIsolation(raw: NodeJS.ProcessEnv): void {
  const appEnv = raw.APP_ENV;
  if (appEnv !== 'production') {
    return;
  }

  const onVercelProduction = raw.VERCEL === '1' && raw.VERCEL_ENV === 'production';
  if (!onVercelProduction) {
    throw new EnvValidationError(
      'Refusing to start: APP_ENV=production is not allowed outside Vercel Production.\n' +
        '  Production database and Stripe keys must not exist on developer machines.',
      [],
    );
  }
}

function pickDefined(raw: NodeJS.ProcessEnv, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== '') {
      out[key] = value;
    }
  }
  return out;
}

const SERVER_KEYS = [
  'APP_ENV',
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NODE_ENV',
  'VERCEL',
  'VERCEL_ENV',
] as const;

const CLIENT_KEYS = [
  'NEXT_PUBLIC_APP_ENV',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
] as const;

/**
 * Validates server-side environment at process boot. Throws {@link EnvValidationError} on failure.
 */
export function loadServerEnv(raw: NodeJS.ProcessEnv = process.env): ServerEnv {
  assertProductionIsolation(raw);

  const appEnvResult = appEnvironmentSchema.safeParse(raw.APP_ENV);
  if (!appEnvResult.success) {
    throw formatZodError('Invalid or missing APP_ENV', appEnvResult.error);
  }

  const appEnv: AppEnvironment = appEnvResult.data;
  const schema = createServerEnvSchema(appEnv);
  const parsed = schema.safeParse(pickDefined(raw, SERVER_KEYS));

  if (!parsed.success) {
    throw formatZodError('Server environment validation failed', parsed.error);
  }

  if (parsed.data.APP_ENV !== appEnv) {
    throw new EnvValidationError('APP_ENV mismatch after validation', []);
  }

  return parsed.data;
}

/**
 * Validates client-safe `NEXT_PUBLIC_*` variables at boot (server-side build/start).
 * Only these values may be referenced from client components.
 */
export function loadClientEnv(raw: NodeJS.ProcessEnv = process.env): ClientEnv {
  const appEnvResult = appEnvironmentSchema.safeParse(raw.NEXT_PUBLIC_APP_ENV);
  if (!appEnvResult.success) {
    throw formatZodError('Invalid or missing NEXT_PUBLIC_APP_ENV', appEnvResult.error);
  }

  const appEnv: AppEnvironment = appEnvResult.data;

  if (raw.APP_ENV && raw.APP_ENV !== appEnv) {
    throw new EnvValidationError('NEXT_PUBLIC_APP_ENV must match APP_ENV when both are set', []);
  }

  const schema = createClientEnvSchema(appEnv);
  const parsed = schema.safeParse(pickDefined(raw, CLIENT_KEYS));

  if (!parsed.success) {
    throw formatZodError('Client environment validation failed', parsed.error);
  }

  return parsed.data;
}

/**
 * Call once at application boot (Next.js instrumentation, server entry, or build script).
 */
export function validateEnvAtBoot(raw: NodeJS.ProcessEnv = process.env): {
  server: ServerEnv;
  client: ClientEnv;
} {
  const server = loadServerEnv(raw);
  const client = loadClientEnv(raw);
  return { server, client };
}
