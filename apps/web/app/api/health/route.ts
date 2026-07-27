import { NextResponse } from 'next/server';

import { cacheControl } from '../../../src/server/http/cache-control';

/** Back-compat alias for perf harness — prefer `/health/live`. */
export async function GET() {
  return cacheControl(NextResponse.json({ ok: true, status: 'live' }, { status: 200 }), 'no-store');
}
