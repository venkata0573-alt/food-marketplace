'use client';

export function ClientOk(): string | undefined {
  return process.env.NEXT_PUBLIC_APP_ENV;
}
