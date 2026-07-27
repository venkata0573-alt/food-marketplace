import { runMigrations, withClient } from '../src/client.js';

async function main(): Promise<void> {
  await withClient(async (client) => {
    await runMigrations(client);
  });
  console.log('Migrations applied.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
