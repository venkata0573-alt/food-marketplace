import { NextResponse } from 'next/server';

import { publicErrorBody } from '@food-marketplace/domain';

import { withClient } from '../../../../src/server/db/with-client';
import { runE2EFlow, type E2EFlowName } from '../../../../src/server/e2e/flows';

export const runtime = 'nodejs';

const FLOWS: E2EFlowName[] = [
  'chef-signup',
  'dish-publish',
  'customer-order',
  'allergen-block',
  'payout',
];

function e2eEnabled(): boolean {
  return process.env.E2E_TEST_MODE === '1';
}

/** CI-only flow runner — disabled unless E2E_TEST_MODE=1 (never in production). */
export async function POST(request: Request): Promise<Response> {
  if (!e2eEnabled()) {
    return NextResponse.json(
      publicErrorBody({ code: 'NOT_FOUND', message: 'not found', publicMessage: 'Not found' }),
      {
        status: 404,
      },
    );
  }

  const token = request.headers.get('x-e2e-token');
  if (!token || token !== process.env.E2E_TEST_TOKEN) {
    return NextResponse.json(
      publicErrorBody({ code: 'FORBIDDEN', message: 'forbidden', publicMessage: 'Forbidden' }),
      { status: 403 },
    );
  }

  let body: { flow?: string };
  try {
    body = (await request.json()) as { flow?: string };
  } catch {
    return NextResponse.json(
      publicErrorBody({
        code: 'VALIDATION',
        message: 'invalid json',
        publicMessage: 'Invalid request',
      }),
      { status: 400 },
    );
  }

  const flow = body.flow as E2EFlowName | undefined;
  if (!flow || !FLOWS.includes(flow)) {
    return NextResponse.json(
      publicErrorBody({
        code: 'VALIDATION',
        message: 'unknown flow',
        publicMessage: 'Unknown flow',
      }),
      { status: 400 },
    );
  }

  const result = await withClient((client) => runE2EFlow(client, flow));
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}

export async function GET(): Promise<Response> {
  if (!e2eEnabled()) {
    return NextResponse.json({ enabled: false }, { status: 404 });
  }
  return NextResponse.json({ enabled: true, flows: FLOWS });
}
