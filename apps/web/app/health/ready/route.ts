import { NextResponse } from 'next/server';

import { cacheControl } from '../../../src/server/http/cache-control';
import { checkPostgres, checkQueue, checkRedis } from '../../../src/server/health/checks';

export async function GET() {
  const [postgres, redis, queue] = await Promise.all([checkPostgres(), checkRedis(), checkQueue()]);
  const ready = postgres.ok && redis.ok && queue.ok;

  return cacheControl(
    NextResponse.json(
      {
        status: ready ? 'ready' : 'degraded',
        checks: { postgres, redis, queue },
      },
      { status: ready ? 200 : 503 },
    ),
    'no-store',
  );
}
