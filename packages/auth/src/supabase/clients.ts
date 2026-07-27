import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseAuthEnv {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export function createSupabaseServerClient(env: SupabaseAuthEnv): SupabaseClient {
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseAnonClient(
  env: Pick<SupabaseAuthEnv, 'url' | 'anonKey'>,
): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Supabase Auth methods used in Layer 4 — email OTP, phone OTP, OAuth, TOTP factors. */
export const AUTH_PROVIDERS = {
  emailOtp: 'email',
  phoneOtp: 'phone',
  google: 'google',
  apple: 'apple',
} as const;
