'use client';
// client-justification: fixture for ESLint client env rule tests.

export function ClientOk(): string | undefined {
  return process.env.NEXT_PUBLIC_APP_ENV;
}
