export type CacheControlPolicy =
  'static-immutable' | 'static-isr' | 'public-short' | 'private-no-store' | 'no-store';

const POLICY_HEADERS: Record<CacheControlPolicy, string> = {
  'static-immutable': 'public, max-age=31536000, immutable',
  'static-isr': 'public, s-maxage=60, stale-while-revalidate=300',
  'public-short': 'public, max-age=10, stale-while-revalidate=30',
  'private-no-store': 'private, no-store',
  'no-store': 'no-store',
};

export function cacheControl<T extends Response>(response: T, policy: CacheControlPolicy): T {
  response.headers.set('Cache-Control', POLICY_HEADERS[policy]);
  response.headers.set('CDN-Cache-Control', POLICY_HEADERS[policy]);
  response.headers.set('Vercel-CDN-Cache-Control', POLICY_HEADERS[policy]);
  return response;
}

export function cacheControlForPath(pathname: string): CacheControlPolicy {
  if (pathname.startsWith('/_next/static')) {
    return 'static-immutable';
  }
  if (pathname === '/' || pathname.startsWith('/chefs/')) {
    return 'static-isr';
  }
  if (pathname.startsWith('/browse')) {
    return 'static-isr';
  }
  if (pathname.startsWith('/health') || pathname.startsWith('/api')) {
    return 'no-store';
  }
  return 'public-short';
}
