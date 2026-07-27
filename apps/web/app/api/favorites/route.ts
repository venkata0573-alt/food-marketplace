import { NextResponse } from 'next/server';

/** Stub favorites sync — optimistic client with rollback on non-2xx. */
export async function POST(request: Request) {
  const body = (await request.json()) as { dishId?: string };
  if (!body.dishId) {
    return NextResponse.json({ error: { code: 'VALIDATION' } }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { dishId?: string };
  if (!body.dishId) {
    return NextResponse.json({ error: { code: 'VALIDATION' } }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
