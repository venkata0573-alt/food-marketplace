import { ALLERGEN_TAXONOMY, buildSeedPlan, DETERMINISTIC_SEED } from '../src/seed/plan.js';
import { runMigrations, withClient } from '../src/client.js';
import type { Client } from 'pg';

const PII_KEY = process.env.LOCAL_PII_ENCRYPTION_KEY ?? 'local-dev-only-pii-key';

async function truncateSandbox(client: Client): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      order_items,
      orders,
      inventory_batches,
      idempotency_keys,
      audit_log,
      dish_allergens,
      dishes,
      customers,
      chefs,
      allergens
    RESTART IDENTITY CASCADE;
  `);
}

async function encryptEmail(client: Client, email: string): Promise<string> {
  const result = await client.query<{ encrypted: string }>(
    `SELECT encrypt_sensitive($1, $2) AS encrypted`,
    [email, PII_KEY],
  );
  return result.rows[0]!.encrypted;
}

async function main(): Promise<void> {
  const plan = buildSeedPlan(DETERMINISTIC_SEED);

  await withClient(async (client) => {
    await runMigrations(client);
    await truncateSandbox(client);

    for (const allergen of ALLERGEN_TAXONOMY) {
      await client.query(`INSERT INTO allergens (code, name, description) VALUES ($1, $2, $3)`, [
        allergen.code,
        allergen.name,
        allergen.description,
      ]);
    }

    const allergenRows = await client.query<{ id: number; code: string }>(
      'SELECT id, code FROM allergens',
    );
    const allergenIdByCode = new Map(allergenRows.rows.map((row) => [row.code, row.id]));

    let chefIndex = 0;
    for (const chef of plan.chefs) {
      chefIndex += 1;
      const ownerUserId = chefIndex === 1 ? '11111111-1111-4111-8111-111111111111' : null;
      await client.query(
        `INSERT INTO chefs (id, owner_user_id, slug, display_name, bio, city)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [chef.id, ownerUserId, chef.slug, chef.displayName, chef.bio, chef.city],
      );
    }

    for (const dish of plan.dishes) {
      await client.query(
        `INSERT INTO dishes (id, chef_id, slug, name, description, price_cents)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [dish.id, dish.chefId, dish.slug, dish.name, dish.description, dish.priceCents],
      );
      await client.query(
        `INSERT INTO inventory_batches (dish_id, remaining_quantity, version)
         VALUES ($1, 25, 1)`,
        [dish.id],
      );
      for (const code of dish.allergenCodes) {
        const allergenId = allergenIdByCode.get(code);
        if (allergenId) {
          await client.query(
            `INSERT INTO dish_allergens (dish_id, allergen_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [dish.id, allergenId],
          );
        }
      }
    }

    const customerAuthById = new Map<string, string>();
    let customerIndex = 0;
    for (const order of plan.orders) {
      if (!customerAuthById.has(order.customerId)) {
        customerIndex += 1;
        customerAuthById.set(
          order.customerId,
          customerIndex === 1 ? '22222222-2222-4222-8222-222222222222' : order.customerId,
        );
      }
    }

    customerIndex = 0;
    for (const [customerId, authUserId] of customerAuthById.entries()) {
      customerIndex += 1;
      const email = `customer-${String(customerIndex).padStart(3, '0')}@sandbox.local`;
      const encrypted = await encryptEmail(client, email);
      await client.query(
        `INSERT INTO customers (id, auth_user_id, email_encrypted, display_name) VALUES ($1, $2, $3, $4)`,
        [customerId, authUserId, encrypted, `Sandbox Customer ${customerIndex}`],
      );
    }

    for (const order of plan.orders) {
      await client.query(
        `INSERT INTO orders (id, order_number, customer_id, chef_id, status, subtotal_cents)
         VALUES ($1, $2, $3, $4, $5::order_status, $6)`,
        [
          order.id,
          order.orderNumber,
          order.customerId,
          order.chefId,
          order.status,
          order.subtotalCents,
        ],
      );
      await client.query(
        `INSERT INTO order_items (order_id, dish_id, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4)`,
        [order.id, order.dishId, order.quantity, order.unitPriceCents],
      );
    }

    const counts = await client.query<{ label: string; count: string }>(`
      SELECT 'chefs' AS label, COUNT(*)::text AS count FROM chefs
      UNION ALL SELECT 'dishes', COUNT(*)::text FROM dishes
      UNION ALL SELECT 'allergens', COUNT(*)::text FROM allergens
      UNION ALL SELECT 'orders', COUNT(*)::text FROM orders
      UNION ALL SELECT 'inventory_batches', COUNT(*)::text FROM inventory_batches
    `);

    console.log(`Seed complete (deterministic seed=${DETERMINISTIC_SEED}):`);
    for (const row of counts.rows) {
      console.log(`  ${row.label}: ${row.count}`);
    }
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
