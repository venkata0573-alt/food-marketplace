import { NextResponse } from 'next/server';

/** Lightweight health probe for API latency budget harness (no database). */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
