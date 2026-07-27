import { randomUUID } from 'node:crypto';

import type { Client } from '../db/with-client';

import { createOrderService } from '../services/order.service';
import { createOrderRepository } from '../repositories/order.repository';
import { createStripeWebhookEventRepository } from '../repositories/stripe-webhook.repository';
import { createStripeWebhookService } from '../services/stripe-webhook.service';

export type E2EFlowName =
  'chef-signup' | 'dish-publish' | 'customer-order' | 'allergen-block' | 'payout';

export interface E2EFlowResult {
  flow: E2EFlowName;
  ok: boolean;
  detail?: Record<string, unknown>;
}

export async function runE2EFlow(client: Client, flow: E2EFlowName): Promise<E2EFlowResult> {
  switch (flow) {
    case 'chef-signup':
      return chefSignup(client);
    case 'dish-publish':
      return dishPublish(client);
    case 'customer-order':
      return customerOrder(client);
    case 'allergen-block':
      return allergenBlock(client);
    case 'payout':
      return payoutFlow(client);
    default: {
      const _exhaustive: never = flow;
      return { flow: _exhaustive, ok: false };
    }
  }
}

async function chefSignup(client: Client): Promise<E2EFlowResult> {
  const chefId = randomUUID();
  const slug = `e2e-chef-${chefId.slice(0, 8)}`;
  await client.query(
    `INSERT INTO chefs (id, slug, display_name, bio, city, owner_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [chefId, slug, 'E2E Chef', 'Signup flow', 'Austin', randomUUID()],
  );
  const row = await client.query(`SELECT id FROM chefs WHERE slug = $1`, [slug]);
  return { flow: 'chef-signup', ok: row.rowCount === 1, detail: { chefId, slug } };
}

async function dishPublish(client: Client): Promise<E2EFlowResult> {
  const chef = await client.query<{ id: string }>(
    `SELECT id FROM chefs ORDER BY created_at LIMIT 1`,
  );
  const chefId = chef.rows[0]?.id;
  if (!chefId) {
    return { flow: 'dish-publish', ok: false, detail: { reason: 'no chef' } };
  }
  const dishId = randomUUID();
  const slug = `e2e-dish-${dishId.slice(0, 8)}`;
  await client.query(
    `INSERT INTO dishes (id, chef_id, slug, name, description, price_cents)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [dishId, chefId, slug, 'E2E Published Dish', 'Test publish', 1500],
  );
  const peanut = await client.query<{ id: number }>(
    `SELECT id FROM allergens WHERE code = 'peanuts' LIMIT 1`,
  );
  if (peanut.rows[0]) {
    await client.query(
      `INSERT INTO dish_allergens (dish_id, allergen_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [dishId, peanut.rows[0].id],
    );
  }
  return { flow: 'dish-publish', ok: true, detail: { dishId, slug } };
}

async function customerOrder(client: Client): Promise<E2EFlowResult> {
  const dish = await client.query<{ id: string; chef_id: string }>(
    `SELECT id, chef_id FROM dishes WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1`,
  );
  const row = dish.rows[0];
  if (!row) {
    return { flow: 'customer-order', ok: false, detail: { reason: 'no dish' } };
  }
  const customer = await client.query<{ id: string }>(
    `SELECT id FROM customers ORDER BY created_at LIMIT 1`,
  );
  const customerId = customer.rows[0]?.id;
  if (!customerId) {
    return { flow: 'customer-order', ok: false, detail: { reason: 'no customer' } };
  }
  const orders = createOrderService(createOrderRepository(client));
  const result = await orders.createOrder(
    { chefId: row.chef_id, lines: [{ dishId: row.id, quantity: 1 }] },
    { customerId, orderNumber: `E2E-${randomUUID().slice(0, 8)}` },
  );
  return {
    flow: 'customer-order',
    ok: result.ok,
    detail: result.ok ? { orderId: result.value.orderId } : { error: result.error.code },
  };
}

async function allergenBlock(client: Client): Promise<E2EFlowResult> {
  const dish = await client.query<{ id: string; chef_id: string }>(
    `SELECT d.id, d.chef_id
     FROM dishes d
     JOIN dish_allergens da ON da.dish_id = d.id
     JOIN allergens a ON a.id = da.allergen_id
     WHERE a.code = 'peanuts'
     LIMIT 1`,
  );
  const row = dish.rows[0];
  if (!row) {
    return { flow: 'allergen-block', ok: false, detail: { reason: 'no peanut dish' } };
  }
  const customer = await client.query<{ id: string }>(
    `SELECT id FROM customers ORDER BY created_at LIMIT 1`,
  );
  const customerId = customer.rows[0]?.id;
  if (!customerId) {
    return { flow: 'allergen-block', ok: false, detail: { reason: 'no customer' } };
  }
  const orders = createOrderService(createOrderRepository(client));
  const result = await orders.createOrder(
    { chefId: row.chef_id, lines: [{ dishId: row.id, quantity: 1 }] },
    {
      customerId,
      orderNumber: `E2E-ALLERGEN-${randomUUID().slice(0, 8)}`,
      customerAllergenCodes: ['peanuts'],
    },
  );
  if (result.ok) {
    return { flow: 'allergen-block', ok: false, detail: { blocked: false } };
  }
  return {
    flow: 'allergen-block',
    ok: result.error.code === 'FORBIDDEN',
    detail: { blocked: true, code: result.error.code },
  };
}

async function payoutFlow(client: Client): Promise<E2EFlowResult> {
  const repo = createStripeWebhookEventRepository(client);
  const service = createStripeWebhookService(repo, {
    enqueueStripeEvent: async () => undefined,
  });
  const eventId = `evt_e2e_payout_${randomUUID().slice(0, 8)}`;
  const first = await service.acceptEvent({
    id: eventId,
    type: 'payout.paid',
    data: { object: { id: 'po_e2e', status: 'paid' } },
  });
  const second = await service.acceptEvent({
    id: eventId,
    type: 'payout.paid',
    data: { object: { id: 'po_e2e', status: 'paid' } },
  });
  const ok = first.ok && first.value.accepted && second.ok && !second.value.accepted;
  return { flow: 'payout', ok, detail: { eventId } };
}
