import type { Client } from 'pg';

export interface FeatureFlagRecord {
  key: string;
  enabled: boolean;
  description: string;
}

export interface FeatureFlagStore {
  isEnabled(key: string): Promise<boolean>;
  list(): Promise<FeatureFlagRecord[]>;
}

export function createPgFeatureFlagStore(client: Client): FeatureFlagStore {
  return {
    async isEnabled(key) {
      const result = await client.query<{ enabled: boolean }>(
        `SELECT enabled FROM feature_flags WHERE key = $1`,
        [key],
      );
      return result.rows[0]?.enabled ?? false;
    },
    async list() {
      const result = await client.query<FeatureFlagRecord>(
        `SELECT key, enabled, description FROM feature_flags ORDER BY key`,
      );
      return result.rows;
    },
  };
}

export function createEnvFeatureFlagStore(env: NodeJS.ProcessEnv = process.env): FeatureFlagStore {
  const raw = env.FEATURE_FLAGS_JSON ?? '{}';
  let parsed: Record<string, boolean> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, boolean>;
  } catch {
    parsed = {};
  }
  return {
    async isEnabled(key) {
      return Boolean(parsed[key]);
    },
    async list() {
      return Object.entries(parsed).map(([key, enabled]) => ({
        key,
        enabled,
        description: 'env override',
      }));
    },
  };
}

/** Prefer database flags; fall back to env for local/dev. */
export function mergeFeatureFlagStores(
  primary: FeatureFlagStore,
  fallback: FeatureFlagStore,
): FeatureFlagStore {
  return {
    async isEnabled(key) {
      const flags = await primary.list();
      if (flags.some((f) => f.key === key)) {
        return primary.isEnabled(key);
      }
      return fallback.isEnabled(key);
    },
    async list() {
      const [a, b] = await Promise.all([primary.list(), fallback.list()]);
      const byKey = new Map<string, FeatureFlagRecord>();
      for (const f of b) {
        byKey.set(f.key, f);
      }
      for (const f of a) {
        byKey.set(f.key, f);
      }
      return Array.from(byKey.values()).sort((x, y) => x.key.localeCompare(y.key));
    },
  };
}
