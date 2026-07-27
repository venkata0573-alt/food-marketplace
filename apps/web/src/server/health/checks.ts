import { withClient } from '../db/with-client';

export interface DependencyStatus {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export async function checkPostgres(): Promise<DependencyStatus> {
  const start = performance.now();
  try {
    await withClient(async (client) => {
      await client.query('SELECT 1');
    });
    return { ok: true, latencyMs: performance.now() - start };
  } catch (error) {
    return {
      ok: false,
      latencyMs: performance.now() - start,
      error: error instanceof Error ? error.message : 'postgres unavailable',
    };
  }
}

export async function checkRedis(): Promise<DependencyStatus> {
  const url = process.env.REDIS_URL;
  if (!url) {
    return { ok: true, latencyMs: 0 };
  }
  const start = performance.now();
  try {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      lazyConnect: true,
    });
    await redis.connect();
    await redis.ping();
    await redis.quit();
    return { ok: true, latencyMs: performance.now() - start };
  } catch (error) {
    return {
      ok: false,
      latencyMs: performance.now() - start,
      error: error instanceof Error ? error.message : 'redis unavailable',
    };
  }
}

export async function checkQueue(): Promise<DependencyStatus> {
  // Inngest is HTTP-ingest; readiness assumes platform reachability is external.
  return { ok: true, latencyMs: 0 };
}
