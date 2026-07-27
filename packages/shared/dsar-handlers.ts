import type { Client } from 'pg';

import {
  assertCan,
  buildAuthzUser,
  parseRole,
  type AuthzUser,
} from '@food-marketplace/shared/authz';
import {
  enqueueDsarRequest,
  type DsarRequestType,
} from '@food-marketplace/shared/governance-store';

export interface DsarHandlerDeps {
  db: Client;
  getDbRole: (userId: string) => Promise<ReturnType<typeof parseRole>>;
  sendConfirmationEmail: (params: {
    userId: string;
    requestId: string;
    requestType: DsarRequestType;
    confirmationToken: string;
  }) => Promise<void>;
}

export interface AuthenticatedRequestContext {
  userId: string;
  jwtRole: string;
  ipAddress?: string;
}

async function authorizedSelfUser(
  deps: DsarHandlerDeps,
  ctx: AuthenticatedRequestContext,
): Promise<AuthzUser> {
  const dbRole = await deps.getDbRole(ctx.userId);
  const user = buildAuthzUser({
    userId: ctx.userId,
    jwtRole: parseRole(ctx.jwtRole),
    dbRole,
  });
  assertCan(user, 'dsar:request', { type: 'dsar', ownerUserId: ctx.userId });
  return user;
}

/** POST export-my-data — async; email confirmation required before processing. */
export async function handleExportMyData(
  deps: DsarHandlerDeps,
  ctx: AuthenticatedRequestContext,
): Promise<{ requestId: string; status: string }> {
  await authorizedSelfUser(deps, ctx);
  const enqueued = await enqueueDsarRequest(deps.db, {
    userId: ctx.userId,
    requestType: 'export',
  });
  await deps.sendConfirmationEmail({
    userId: ctx.userId,
    requestId: enqueued.requestId,
    requestType: 'export',
    confirmationToken: enqueued.confirmationToken,
  });
  return { requestId: enqueued.requestId, status: enqueued.status };
}

/** POST delete-my-account — async; email confirmation required before erasure job runs. */
export async function handleDeleteMyAccount(
  deps: DsarHandlerDeps,
  ctx: AuthenticatedRequestContext,
): Promise<{ requestId: string; status: string }> {
  await authorizedSelfUser(deps, ctx);
  const enqueued = await enqueueDsarRequest(deps.db, {
    userId: ctx.userId,
    requestType: 'delete',
  });
  await deps.sendConfirmationEmail({
    userId: ctx.userId,
    requestId: enqueued.requestId,
    requestType: 'delete',
    confirmationToken: enqueued.confirmationToken,
  });
  return { requestId: enqueued.requestId, status: enqueued.status };
}
