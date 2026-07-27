import { NextResponse, type NextRequest } from 'next/server';

import { cacheControlForPath } from './src/server/http/cache-control';

const LOCALE_COOKIE = 'fm-locale';
/** Session presence only — no validation or database I/O in Edge. */
const ACCESS_COOKIE = '__Host-fm-access';

export function middleware(request: NextRequest) {
  const locale =
    request.cookies.get(LOCALE_COOKIE)?.value ??
    request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] ??
    'en';

  const response = NextResponse.next();
  response.headers.set('x-fm-locale', locale);
  response.headers.set(
    'x-fm-session',
    request.cookies.get(ACCESS_COOKIE) ? 'present' : 'anonymous',
  );

  const policy = cacheControlForPath(request.nextUrl.pathname);
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
