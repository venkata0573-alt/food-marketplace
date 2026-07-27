import { NextResponse, type NextRequest } from 'next/server';

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
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
};
