import { enforceRateLimits, rateLimit429Body } from '@food-marketplace/rate-limit';
import { NextResponse } from 'next/server';

export async function applyRateLimitFromRequest(
  request: Request,
  options: {
    userId?: string;
    endpointKey?: 'endpointCheckout' | 'endpointSignup' | 'endpointLogin';
  } = {},
): Promise<Response | null> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const result = await enforceRateLimits({
    ip,
    ...(options.userId ? { userId: options.userId } : {}),
    ...(options.endpointKey ? { endpointKey: options.endpointKey } : {}),
  });

  if (result && !result.allowed) {
    const payload = rateLimit429Body(result.retryAfterSeconds);
    return NextResponse.json(payload.body, {
      status: payload.status,
      headers: payload.headers,
    });
  }

  return null;
}
