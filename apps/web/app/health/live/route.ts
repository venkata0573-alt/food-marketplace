import { NextResponse } from 'next/server';

import { cacheControl } from '../../../src/server/http/cache-control';

export async function GET() {
  return cacheControl(NextResponse.json({ status: 'live' }, { status: 200 }), 'no-store');
}
