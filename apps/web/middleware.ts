import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { routing } from './i18n/routing';
import { cacheControlForPath } from './src/server/http/cache-control';

const ACCESS_COOKIE = '__Host-fm-access';
const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api') || pathname.startsWith('/health')) {
    return NextResponse.next();
  }

  const response = intlMiddleware(request);

  response.headers.set(
    'x-fm-session',
    request.cookies.get(ACCESS_COOKIE) ? 'present' : 'anonymous',
  );

  const policy = cacheControlForPath(pathname);
  const value =
    policy === 'static-immutable'
      ? 'public, max-age=31536000, immutable'
      : policy === 'static-isr'
        ? 'public, s-maxage=60, stale-while-revalidate=300'
        : policy === 'no-store'
          ? 'no-store'
          : 'public, max-age=10, stale-while-revalidate=30';

  response.headers.set('Cache-Control', value);
  response.headers.set('CDN-Cache-Control', value);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
};
