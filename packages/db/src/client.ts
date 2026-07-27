import { Client } from 'pg';

import { runMigrationsUp } from './migrate/runner.js';

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  return url;
}

export async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Apply forward-only paired SQL migrations (Drizzle-managed, checked into git). */
export async function runMigrations(client: Client): Promise<void> {
  await runMigrationsUp(client);
}
