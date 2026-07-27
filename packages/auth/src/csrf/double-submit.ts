import { CSRF_HEADER, COOKIE_NAMES } from '../constants.js';

export interface CsrfRequestLike {
  headers: {
    get(name: string): string | null;
  };
  cookies?: {
    get(name: string): { value: string } | undefined;
  };
}

export function verifyDoubleSubmitCsrf(request: CsrfRequestLike): boolean {
  const headerToken = request.headers.get(CSRF_HEADER);
  const cookieToken = request.cookies?.get(COOKIE_NAMES.csrf)?.value;
  if (!headerToken || !cookieToken) {
    return false;
  }
  return timingSafeEqual(headerToken, cookieToken);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function assertCsrfForMutation(request: CsrfRequestLike, method: string): void {
  const normalized = method.toUpperCase();
  if (normalized === 'GET' || normalized === 'HEAD' || normalized === 'OPTIONS') {
    return;
  }
  if (!verifyDoubleSubmitCsrf(request)) {
    throw new Error('CSRF validation failed');
  }
}
