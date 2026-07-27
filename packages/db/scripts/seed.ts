import { ALLERGEN_TAXONOMY, buildSeedPlan, DETERMINISTIC_SEED } from '../src/seed/plan.js';
import { runMigrations, withClient } from '../src/client.js';
import type { Client } from 'pg';

async function truncateSandbox(client: Client): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      order_items,
      orders,
      dish_allergens,
      dishes,
      customers,
      chefs,
      allergens
    RESTART IDENTITY CASCADE;
  `);
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

    for (const chef of plan.chefs) {
      await client.query(
        `INSERT INTO chefs (id, slug, display_name, bio, city) VALUES ($1, $2, $3, $4, $5)`,
        [chef.id, chef.slug, chef.displayName, chef.bio, chef.city],
      );
    }

    for (const dish of plan.dishes) {
      await client.query(
        `INSERT INTO dishes (id, chef_id, slug, name, description, price_cents)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [dish.id, dish.chefId, dish.slug, dish.name, dish.description, dish.priceCents],
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

    const customerIds = new Set<string>();
    for (const order of plan.orders) {
      customerIds.add(order.customerId);
    }
    let customerIndex = 0;
    for (const customerId of Array.from(customerIds)) {
      customerIndex += 1;
      await client.query(`INSERT INTO customers (id, email, display_name) VALUES ($1, $2, $3)`, [
        customerId,
        `customer-${String(customerIndex).padStart(3, '0')}@sandbox.local`,
        `Sandbox Customer ${customerIndex}`,
      ]);
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
