import { NextResponse } from 'next/server';

import { publicErrorBody } from '@food-marketplace/domain';

import { runWithServices } from '../../../../src/server/context';
import { constructStripeEvent } from '../../../../src/server/integrations/third-party.client';
import { cacheControl } from '../../../../src/server/http/cache-control';
import { applyRateLimitFromRequest } from '../../../../src/server/http/rate-limit-request';

export const runtime = 'nodejs';

/** Webhook edge: verify signature, idempotency, 200 fast — no inline business logic. */
export async function POST(request: Request): Promise<Response> {
  const limited = await applyRateLimitFromRequest(request, { endpointKey: 'endpointCheckout' });
  if (limited) {
    return limited;
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      publicErrorBody({
        code: 'VALIDATION',
        message: 'missing signature',
        publicMessage: 'Invalid webhook request',
      }),
      { status: 400 },
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      publicErrorBody({
        code: 'INTERNAL',
        message: 'missing STRIPE_WEBHOOK_SECRET',
        publicMessage: 'Service unavailable',
      }),
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  let event: Awaited<ReturnType<typeof constructStripeEvent>>;
  try {
    event = await constructStripeEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json(
      publicErrorBody({
        code: 'VALIDATION',
        message: 'invalid signature',
        publicMessage: 'Invalid webhook signature',
      }),
      { status: 400 },
    );
  }

  const result = await runWithServices((services) =>
    services.stripeWebhook.acceptEvent({ id: event.id, type: event.type, data: event.data.object }),
  );

  if (!result.ok) {
    return NextResponse.json(publicErrorBody(result.error), {
      status: 500,
    });
  }

  return cacheControl(
    NextResponse.json({ received: true, duplicate: !result.value.accepted }, { status: 200 }),
    'no-store',
  );
}
