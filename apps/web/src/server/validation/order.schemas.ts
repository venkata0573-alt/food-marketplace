import { z } from 'zod';

export const createOrderLineSchema = z.object({
  dishId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
});

/** Parse at the HTTP/action boundary — never trust client totals or chef IDs alone. */
export const createOrderInputSchema = z.object({
  chefId: z.string().uuid(),
  lines: z.array(createOrderLineSchema).min(1).max(50),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const stripeWebhookHeadersSchema = z.object({
  signature: z.string().min(1),
});
