import type { Client } from 'pg';

export interface InventoryBatchRow {
  id: string;
  dish_id: string;
  remaining_quantity: number;
  version: number;
}

/**
 * Optimistic inventory decrement — never oversell a batch.
 * Must run inside a transaction when combined with order creation.
 */
export async function decrementBatchQuantity(
  client: Client,
  batchId: string,
  quantity: number,
): Promise<{ ok: true; batch: InventoryBatchRow } | { ok: false }> {
  if (quantity <= 0) {
    throw new Error('quantity must be positive');
  }

  const result = await client.query<InventoryBatchRow>(
    `
      UPDATE inventory_batches
      SET
        remaining_quantity = remaining_quantity - $2,
        version = version + 1,
        updated_at = NOW()
      WHERE id = $1
        AND remaining_quantity >= $2
      RETURNING id, dish_id, remaining_quantity, version
    `,
    [batchId, quantity],
  );

  if (result.rowCount !== 1) {
    return { ok: false };
  }

  return { ok: true, batch: result.rows[0]! };
}
