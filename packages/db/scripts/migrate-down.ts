import { withClient } from '../src/client.js';
import { runLastMigrationDown } from '../src/migrate/runner.js';

async function main(): Promise<void> {
  await withClient(async (client) => {
    const tag = await runLastMigrationDown(client);
    if (!tag) {
      console.log('No migrations to roll back.');
      return;
    }
    console.log(`Rolled back migration: ${tag}`);
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
