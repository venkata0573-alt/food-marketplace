import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Client } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIGRATIONS_DIR = path.join(__dirname, '../../drizzle/migrations');

export interface MigrationPair {
  tag: string;
  upPath: string;
  downPath: string;
}

export function listMigrationPairs(): MigrationPair[] {
  const upFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.up.sql'))
    .sort();

  return upFiles.map((upFile) => {
    const tag = upFile.replace(/\.up\.sql$/, '');
    const downFile = `${tag}.down.sql`;
    const downPath = path.join(MIGRATIONS_DIR, downFile);
    if (!fs.existsSync(downPath)) {
      throw new Error(`Missing paired down migration for ${upFile}`);
    }
    return {
      tag,
      upPath: path.join(MIGRATIONS_DIR, upFile),
      downPath,
    };
  });
}

export async function ensureMigrationTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS drizzle_migrations (
      id SERIAL PRIMARY KEY,
      tag TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function runMigrationsUp(client: Client): Promise<void> {
  await ensureMigrationTable(client);
  const pairs = listMigrationPairs();

  for (const pair of pairs) {
    const applied = await client.query('SELECT 1 FROM drizzle_migrations WHERE tag = $1', [
      pair.tag,
    ]);
    if (applied.rowCount && applied.rowCount > 0) {
      continue;
    }
    const sql = fs.readFileSync(pair.upPath, 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO drizzle_migrations (tag) VALUES ($1)', [pair.tag]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
}

export async function runLastMigrationDown(client: Client): Promise<string | null> {
  await ensureMigrationTable(client);
  const last = await client.query<{ tag: string }>(
    'SELECT tag FROM drizzle_migrations ORDER BY id DESC LIMIT 1',
  );
  const tag = last.rows[0]?.tag;
  if (!tag) {
    return null;
  }
  const downPath = path.join(MIGRATIONS_DIR, `${tag}.down.sql`);
  const sql = fs.readFileSync(downPath, 'utf8');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('DELETE FROM drizzle_migrations WHERE tag = $1', [tag]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
  return tag;
}
