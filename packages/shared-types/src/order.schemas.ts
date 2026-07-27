import { z } from 'zod';

export const createOrderLineSchema = z.object({
  dishId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
});

/** Shared client + server — single source of truth for order validation. */
export const createOrderInputSchema = z.object({
  chefId: z.string().uuid(),
  lines: z.array(createOrderLineSchema).min(1).max(50),
});

export type CreateOrderLineInput = z.infer<typeof createOrderLineSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
