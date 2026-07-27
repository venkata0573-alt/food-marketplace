'use client';
// client-justification: fixture for ESLint client env rule tests.

export function ClientBad(): string {
  return process.env.STRIPE_SECRET_KEY ?? '';
}
