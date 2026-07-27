/**
 * Next.js middleware example — wire CSRF/Origin guard for mutations.
 * Copy into apps/web or apps/admin when Next.js middleware is enabled.
 */
import { guardStateChangingRequest } from '@food-marketplace/auth/server';
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
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
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
