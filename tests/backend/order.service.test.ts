import { describe, expect, it, vi } from 'vitest';

import { createOrderService } from '../../apps/web/src/server/services/order.service.js';
import type { OrderRepository } from '../../apps/web/src/server/repositories/order.repository.js';

describe('createOrderService', () => {
  it('recomputes subtotal from database prices, ignoring client totals', async () => {
    const repo: OrderRepository = {
      findDishesForQuote: vi.fn(async () => [
        {
          id: 'd1',
          chefId: 'c1',
          priceCents: 1200,
          deletedAt: null,
          allergenCodes: [],
        },
      ]),
      createOrderDraft: vi.fn(async (params) => {
        expect(params.subtotalCents).toBe(2400);
        expect(params.lines[0]?.unitPriceCents).toBe(1200);
        return { orderId: 'o1' };
      }),
    };

    const service = createOrderService(repo);
    const result = await service.createOrder(
      {
        chefId: 'c1',
        lines: [{ dishId: 'd1', quantity: 2 }],
      },
      { customerId: 'u1', orderNumber: 'ORD-1' },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.subtotalCents).toBe(2400);
    }
  });

  it('rejects dishes from a different chef', async () => {
    const repo: OrderRepository = {
      findDishesForQuote: vi.fn(async () => [
        { id: 'd1', chefId: 'other-chef', priceCents: 900, deletedAt: null, allergenCodes: [] },
      ]),
      createOrderDraft: vi.fn(),
    };
    const service = createOrderService(repo);
    const result = await service.createOrder(
      { chefId: 'c1', lines: [{ dishId: 'd1', quantity: 1 }] },
      { customerId: 'u1', orderNumber: 'ORD-2' },
    );
    expect(result.ok).toBe(false);
  });

  it('blocks orders when dish allergens conflict with customer profile', async () => {
    const repo: OrderRepository = {
      findDishesForQuote: vi.fn(async () => [
        {
          id: 'd1',
          chefId: 'c1',
          priceCents: 900,
          deletedAt: null,
          allergenCodes: ['peanuts'],
        },
      ]),
      createOrderDraft: vi.fn(),
    };
    const service = createOrderService(repo);
    const result = await service.createOrder(
      { chefId: 'c1', lines: [{ dishId: 'd1', quantity: 1 }] },
      { customerId: 'u1', orderNumber: 'ORD-3', customerAllergenCodes: ['peanuts'] },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
  });
});
