import { getDatabaseUrl, withClient } from '../src/client.js';
import { runMigrationsUp } from '../src/migrate/runner.js';

async function main(): Promise<void> {
  await withClient(async (client) => {
    await runMigrationsUp(client);
  });
  console.log('Drizzle paired migrations applied.');
  console.log(`Database: ${getDatabaseUrl().replace(/:[^:@/]+@/, ':***@')}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
