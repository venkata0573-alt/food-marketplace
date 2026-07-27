import { err, ok, type Result } from '@food-marketplace/domain';

import type { CreateOrderInput } from '../validation/order.schemas';
import type { OrderRepository } from '../repositories/order.repository';

export interface CreateOrderContext {
  customerId: string;
  orderNumber: string;
}

export interface OrderService {
  createOrder(
    input: CreateOrderInput,
    ctx: CreateOrderContext,
  ): Promise<Result<{ orderId: string; subtotalCents: number }>>;
}

export function createOrderService(repo: OrderRepository): OrderService {
  return {
    async createOrder(input, ctx) {
      const dishIds = input.lines.map((line) => line.dishId);
      const dishes = await repo.findDishesForQuote(dishIds);

      if (dishes.length !== dishIds.length) {
        return err('NOT_FOUND', 'One or more menu items are unavailable.');
      }

      for (const dish of dishes) {
        if (dish.deletedAt) {
          return err('NOT_FOUND', 'One or more menu items are unavailable.');
        }
        if (dish.chefId !== input.chefId) {
          return err('VALIDATION', 'Items must belong to the selected chef.');
        }
      }

      const priceByDish = new Map(dishes.map((d) => [d.id, d.priceCents]));
      let subtotalCents = 0;
      const lines = input.lines.map((line) => {
        const unitPriceCents = priceByDish.get(line.dishId)!;
        subtotalCents += unitPriceCents * line.quantity;
        return {
          dishId: line.dishId,
          quantity: line.quantity,
          unitPriceCents,
        };
      });

      const created = await repo.createOrderDraft({
        orderNumber: ctx.orderNumber,
        customerId: ctx.customerId,
        chefId: input.chefId,
        subtotalCents,
        lines,
      });

      return ok({ orderId: created.orderId, subtotalCents });
    },
  };
}
