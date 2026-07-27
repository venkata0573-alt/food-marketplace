import { z } from 'zod';

/** Deploy target — set explicitly per Vercel environment (never infer from NODE_ENV alone). */
export const appEnvironmentSchema = z.enum(['local', 'preview', 'staging', 'production']);

export type AppEnvironment = z.infer<typeof appEnvironmentSchema>;

const stripePublishableKeySchema = (appEnv: AppEnvironment) =>
  z
    .string()
    .min(1)
    .superRefine((value, ctx) => {
      if (appEnv === 'production') {
        if (!value.startsWith('pk_live_')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Production requires a pk_live_ Stripe publishable key',
          });
        }
        return;
      }
      if (!value.startsWith('pk_test_')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${appEnv} requires a pk_test_ Stripe publishable key`,
        });
      }
    });

const stripeSecretKeySchema = (appEnv: AppEnvironment) =>
  z
    .string()
    .min(1)
    .superRefine((value, ctx) => {
      if (appEnv === 'production') {
        if (!value.startsWith('sk_live_')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Production requires a sk_live_ Stripe secret key',
          });
        }
        return;
      }
      if (!value.startsWith('sk_test_')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${appEnv} requires a sk_test_ Stripe secret key`,
        });
      }
    });

export function createServerEnvSchema(appEnv: AppEnvironment) {
  return z.object({
    APP_ENV: appEnvironmentSchema,
    DATABASE_URL: z
      .string()
      .min(1)
      .refine(
        (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
        'DATABASE_URL must be a PostgreSQL connection string',
      ),
    STRIPE_SECRET_KEY: stripeSecretKeySchema(appEnv),
    /** Supabase service role — server only; sourced from Vercel + Vault rotation docs. */
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_ANON_KEY: z.string().min(1).optional(),
    AUTH_CSRF_SECRET: z.string().min(16).optional(),
    REDIS_URL: z.string().min(1).optional(),
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
    VERCEL: z.string().optional(),
    VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  });
}

export function createClientEnvSchema(appEnv: AppEnvironment) {
  return z.object({
    NEXT_PUBLIC_APP_ENV: appEnvironmentSchema,
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKeySchema(appEnv),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  });
}

export type ServerEnv = z.infer<ReturnType<typeof createServerEnvSchema>>;
export type ClientEnv = z.infer<ReturnType<typeof createClientEnvSchema>>;
