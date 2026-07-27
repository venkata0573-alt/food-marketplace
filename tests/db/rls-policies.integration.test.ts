import {
  decrementBatchQuantity,
  verifyPairedDownMigrations,
  withClient,
  withRlsContext,
} from '@food-marketplace/db';
import { describe, expect, it } from 'vitest';

const runDb = process.env.RUN_DB_INTEGRATION === '1';

describe('migration pairs', () => {
  it('requires an explicit down.sql for every up.sql', () => {
    expect(() => verifyPairedDownMigrations()).not.toThrow();
  });
});

describe.runIf(runDb)('row level security policies', () => {
  const chefUserId = '11111111-1111-4111-8111-111111111111';
  const customerUserId = '22222222-2222-4222-8222-222222222222';
  const otherUserId = '33333333-3333-4333-8333-333333333333';

  async function expectZeroRows(
    role: 'anon' | 'authenticated' | 'chef' | 'admin',
    table: string,
    userId?: string,
  ): Promise<void> {
    await withClient(async (client) => {
      const count = await withRlsContext(client, { role, userId }, async () => {
        const result = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM ${table}`,
        );
        return Number(result.rows[0]?.count ?? 0);
      });
      expect(count).toBe(0);
    });
  }

  const unauthorizedReadCases: Array<{
    name: string;
    role: 'anon' | 'authenticated' | 'chef' | 'admin';
    table: string;
    userId?: string;
  }> = [
    { name: 'anon cannot read customers', role: 'anon', table: 'customers' },
    { name: 'anon cannot read orders', role: 'anon', table: 'orders' },
    { name: 'anon cannot read order_items', role: 'anon', table: 'order_items' },
    { name: 'anon cannot read inventory_batches', role: 'anon', table: 'inventory_batches' },
    { name: 'anon cannot read idempotency_keys', role: 'anon', table: 'idempotency_keys' },
    { name: 'anon cannot read audit_log', role: 'anon', table: 'audit_log' },
    {
      name: 'authenticated cannot read other customers',
      role: 'authenticated',
      table: 'customers',
      userId: otherUserId,
    },
    {
      name: 'authenticated cannot read orders for other customers',
      role: 'authenticated',
      table: 'orders',
      userId: otherUserId,
    },
    {
      name: 'chef cannot read orders for other chefs',
      role: 'chef',
      table: 'orders',
      userId: otherUserId,
    },
    {
      name: 'chef cannot read inventory for other chefs',
      role: 'chef',
      table: 'inventory_batches',
      userId: otherUserId,
    },
    { name: 'admin cannot read idempotency_keys', role: 'admin', table: 'idempotency_keys' },
    { name: 'authenticated cannot read audit_log', role: 'authenticated', table: 'audit_log' },
    { name: 'chef cannot read audit_log', role: 'chef', table: 'audit_log', userId: chefUserId },
    {
      name: 'authenticated cannot read idempotency_keys',
      role: 'authenticated',
      table: 'idempotency_keys',
      userId: customerUserId,
    },
    {
      name: 'chef cannot read idempotency_keys',
      role: 'chef',
      table: 'idempotency_keys',
      userId: chefUserId,
    },
    { name: 'chef cannot read customers', role: 'chef', table: 'customers', userId: chefUserId },
  ];

  it.each(unauthorizedReadCases)('$name', async ({ role, table, userId }) => {
    await expectZeroRows(role, table, userId);
  });

  it('allows anon to read public allergen taxonomy', async () => {
    await withClient(async (client) => {
      const count = await withRlsContext(client, { role: 'anon' }, async () => {
        const result = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM allergens`,
        );
        return Number(result.rows[0]?.count ?? 0);
      });
      expect(count).toBeGreaterThan(0);
    });
  });

  it('allows customer to read own orders', async () => {
    await withClient(async (client) => {
      const count = await withRlsContext(
        client,
        { role: 'authenticated', userId: customerUserId },
        async () => {
          const result = await client.query<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM orders`,
          );
          return Number(result.rows[0]?.count ?? 0);
        },
      );
      expect(count).toBeGreaterThan(0);
    });
  });

  it('prevents inventory oversell inside a transaction', async () => {
    await withClient(async (client) => {
      const batch = await client.query<{ id: string }>(
        `SELECT id FROM inventory_batches ORDER BY created_at LIMIT 1`,
      );
      const batchId = batch.rows[0]?.id;
      expect(batchId).toBeTruthy();

      await client.query('BEGIN');
      try {
        const first = await decrementBatchQuantity(client, batchId!, 25);
        expect(first.ok).toBe(true);
        const second = await decrementBatchQuantity(client, batchId!, 1);
        expect(second.ok).toBe(false);
        await client.query('ROLLBACK');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  });
});
