'use server';

import { mapServiceErrorToStatus, publicErrorBody } from '@food-marketplace/domain';
import { guardStateChangingRequest } from '@food-marketplace/auth/server';
import { revalidateTag } from 'next/cache';
import { headers, cookies } from 'next/headers';

import { runWithServices } from '../../src/server/context';
import { createOrderInputSchema } from '../../src/server/validation/order.schemas';

export async function createOrderAction(
  raw: unknown,
): Promise<
  | { ok: true; orderId: string }
  | { ok: false; status: number; body: ReturnType<typeof publicErrorBody> }
> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  guardStateChangingRequest(
    {
      method: 'POST',
      headers: headerStore,
      cookies: cookieStore,
    },
    {
      allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
      host: headerStore.get('host'),
    },
  );

  const parsed = createOrderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      body: publicErrorBody({
        code: 'VALIDATION',
        message: parsed.error.message,
        publicMessage: 'Invalid order request',
      }),
    };
  }

  const result = await runWithServices((services) =>
    services.orders.createOrder(parsed.data, {
      customerId: '22222222-2222-4222-8222-222222222222',
      orderNumber: `ORD-${Date.now()}`,
    }),
  );

  if (!result.ok) {
    return {
      ok: false,
      status: mapServiceErrorToStatus(result.error.code),
      body: publicErrorBody(result.error),
    };
  }

  revalidateTag('browse-feed');
  revalidateTag('dish-listings');

  return { ok: true, orderId: result.value.orderId };
}
