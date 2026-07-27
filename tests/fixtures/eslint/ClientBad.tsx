'use client';

export function ClientBad(): string {
  return process.env.STRIPE_SECRET_KEY ?? '';
}
