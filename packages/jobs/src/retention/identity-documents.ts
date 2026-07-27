import { getDatabaseUrl } from '@food-marketplace/db';
import { Client } from 'pg';

import { IDENTITY_DOCUMENT_GRACE_DAYS } from './constants.js';

async function main(): Promise<void> {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    const result = await client.query(
      `UPDATE identity_documents
       SET deleted_at = NOW()
       WHERE deleted_at IS NULL
         AND verification_completed_at IS NOT NULL
         AND (
           delete_after <= NOW()
           OR verification_completed_at < NOW() - ($1::text || ' days')::INTERVAL
         )`,
      [IDENTITY_DOCUMENT_GRACE_DAYS],
    );
    console.log(
      `Identity document retention: marked ${result.rowCount ?? 0} documents deleted (${IDENTITY_DOCUMENT_GRACE_DAYS}-day rule).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
