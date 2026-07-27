import type { Client } from '../db/with-client';

export interface DishQuoteRow {
  id: string;
  chefId: string;
  priceCents: number;
  deletedAt: string | null;
  allergenCodes: string[];
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
      const result = await client.query<DishQuoteRow & { allergenCodes: string[] | null }>(
        `SELECT d.id,
                d.chef_id AS "chefId",
                d.price_cents AS "priceCents",
                d.deleted_at AS "deletedAt",
                COALESCE(
                  array_agg(DISTINCT a.code) FILTER (WHERE a.code IS NOT NULL),
                  '{}'
                ) AS "allergenCodes"
         FROM dishes d
         LEFT JOIN dish_allergens da ON da.dish_id = d.id
         LEFT JOIN allergens a ON a.id = da.allergen_id
         WHERE d.id = ANY($1::uuid[])
         GROUP BY d.id`,
        [dishIds],
      );
      return result.rows.map((row) => ({
        ...row,
        allergenCodes: row.allergenCodes ?? [],
      }));
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
