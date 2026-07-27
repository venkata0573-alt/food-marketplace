import { getDatabaseUrl } from '@food-marketplace/db';
import { Client } from 'pg';

import { ORDER_RETENTION_YEARS } from './constants.js';

async function main(): Promise<void> {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    const result = await client.query(
      `DELETE FROM orders
       WHERE created_at < NOW() - ($1::text || ' years')::INTERVAL
         AND deleted_at IS NOT NULL`,
      [ORDER_RETENTION_YEARS],
    );
    console.log(
      `Order retention: purged ${result.rowCount ?? 0} soft-deleted orders older than ${ORDER_RETENTION_YEARS} years.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
