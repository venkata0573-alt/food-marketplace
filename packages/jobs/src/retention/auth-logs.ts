import { getDatabaseUrl } from '@food-marketplace/db';
import { Client } from 'pg';

import { AUTH_LOG_RETENTION_DAYS } from './constants.js';

async function main(): Promise<void> {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    const result = await client.query(
      `DELETE FROM audit_log
       WHERE created_at < NOW() - ($1::text || ' days')::INTERVAL
         AND action LIKE 'auth:%'`,
      [AUTH_LOG_RETENTION_DAYS],
    );
    console.log(
      `Auth log retention: removed ${result.rowCount ?? 0} auth audit rows older than ${AUTH_LOG_RETENTION_DAYS} days.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
