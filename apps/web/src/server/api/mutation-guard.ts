import { guardStateChangingRequest } from '@food-marketplace/auth/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Node route handlers — CSRF/origin checks (not Edge middleware). */
export function guardApiMutation(request: NextRequest): NextResponse | null {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return null;
  }
  try {
    guardStateChangingRequest(
      {
        method: request.method,
        headers: request.headers,
        cookies: request.cookies,
      },
      {
        allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
        host: request.headers.get('host'),
      },
    );
    return null;
  } catch {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Forbidden' } },
      { status: 403 },
    );
  }
}
