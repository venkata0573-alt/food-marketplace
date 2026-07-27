import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Client } from 'pg';

export type AppRole = 'anon' | 'authenticated' | 'chef' | 'admin' | 'service_role';

const ROLE_MAP: Record<AppRole, string> = {
  anon: 'app_anon',
  authenticated: 'app_authenticated',
  chef: 'app_chef',
  admin: 'app_admin',
  service_role: 'app_service_role',
};

export async function withRlsContext<T>(
  client: Client,
  options: { role: AppRole; userId?: string; appRole?: AppRole },
  fn: () => Promise<T>,
): Promise<T> {
  await client.query('BEGIN');
  try {
    await client.query(`SET LOCAL ROLE ${ROLE_MAP[options.role]}`);
    if (options.userId) {
      await client.query(`SELECT set_config('app.user_id', $1, true)`, [options.userId]);
    } else {
      await client.query(`SELECT set_config('app.user_id', '', true)`);
    }
    const appRole = options.appRole ?? options.role;
    await client.query(`SELECT set_config('app.role', $1, true)`, [appRole]);
    const result = await fn();
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function countRows(client: Client, table: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${table}`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

export function verifyPairedDownMigrations(): void {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle/migrations');
  const ups = fs.readdirSync(dir).filter((f) => f.endsWith('.up.sql'));
  for (const up of ups) {
    const down = up.replace('.up.sql', '.down.sql');
    if (!fs.existsSync(path.join(dir, down))) {
      throw new Error(`Missing down migration for ${up}`);
    }
  }
}
