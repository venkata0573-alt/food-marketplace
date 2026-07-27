import type { Client } from '../db/with-client';

export interface DishQuoteRow {
  id: string;
  chefId: string;
  priceCents: number;
  deletedAt: string | null;
}

export interface OrderRepository {
  findDishesForQuote(dishIds: string[]): Promise<DishQuoteRow[]>;
  createOrderDraft(params: {
    orderNumber: string;
    customerId: string;
    chefId: string;
    subtotalCents: number;
    lines: Array<{ dishId: string; quantity: number; unitPriceCents: number }>;
  }): Promise<{ orderId: string }>;
}

export function createOrderRepository(client: Client): OrderRepository {
  return {
    async findDishesForQuote(dishIds) {
      if (dishIds.length === 0) {
        return [];
      }
      const result = await client.query<DishQuoteRow>(
        `SELECT id, chef_id AS "chefId", price_cents AS "priceCents", deleted_at AS "deletedAt"
         FROM dishes
         WHERE id = ANY($1::uuid[])`,
        [dishIds],
      );
      return result.rows;
    },
    async createOrderDraft(params) {
      const order = await client.query<{ id: string }>(
        `INSERT INTO orders (order_number, customer_id, chef_id, status, subtotal_cents)
         VALUES ($1, $2, $3, 'draft', $4)
         RETURNING id`,
        [params.orderNumber, params.customerId, params.chefId, params.subtotalCents],
      );
      const orderId = order.rows[0]!.id;
      for (const line of params.lines) {
        await client.query(
          `INSERT INTO order_items (order_id, dish_id, quantity, unit_price_cents)
           VALUES ($1, $2, $3, $4)`,
          [orderId, line.dishId, line.quantity, line.unitPriceCents],
        );
      }
      return { orderId };
    },
  };
}
