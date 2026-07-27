import { collectSeqScansOnLargeTables, withClient } from '@food-marketplace/db';
import { describe, expect, it } from 'vitest';

const runIntegration = process.env.RUN_DB_INTEGRATION === '1';

describe.runIf(runIntegration)('list query plans (EXPLAIN ANALYZE)', () => {
  it('avoid sequential scans on dishes when listing browse feed', async () => {
    await withClient(async (client) => {
      const explain = await client.query<{ 'QUERY PLAN': unknown[] }>(
        `EXPLAIN (ANALYZE, FORMAT JSON)
         SELECT id, chef_id, name, price_cents, created_at
         FROM dishes
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC, id DESC
         LIMIT 24`,
      );

      const planRoot = explain.rows[0]?.['QUERY PLAN']?.[0] as { Plan?: Record<string, unknown> };
      const seqHits = collectSeqScansOnLargeTables(planRoot?.Plan as never, new Set(['dishes']));
      expect(seqHits).toEqual([]);
    });
  });
});
