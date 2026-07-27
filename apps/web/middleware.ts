import { guardStateChangingRequest } from '@food-marketplace/auth/server';
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/webhooks/') || path.startsWith('/api/inngest')) {
    return NextResponse.next();
  }
  if (path.startsWith('/api/') && request.method !== 'GET') {
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
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Forbidden' } },
        { status: 403 },
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
