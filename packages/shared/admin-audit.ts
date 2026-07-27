import type { AuthzAction, AuthzResource, AuthzUser } from './authz.js';
import {
  assertCan,
  AuthorizationError,
  isDestructiveAdminAction,
  rolesMatchForPrivilege,
} from './authz.js';

export interface AdminAuditRecord {
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  destructive: boolean;
  beforeState?: unknown;
  afterState?: unknown;
  ipAddress?: string;
}

export interface AdminAuditWriter {
  write(record: AdminAuditRecord): Promise<void>;
}

export interface AdminActionInput {
  actor: AuthzUser;
  action: AuthzAction;
  resource: AuthzResource;
  /** Required when `action` is destructive (chef suspension, refund, order cancellation). */
  reason?: string;
  beforeState?: unknown;
  afterState?: unknown;
  ipAddress?: string;
}

/**
 * Admin mutations must be audit-logged. Destructive operations require a non-empty reason.
 */
export async function performAdminAction(
  writer: AdminAuditWriter,
  input: AdminActionInput,
): Promise<void> {
  if (!rolesMatchForPrivilege(input.actor)) {
    throw new AuthorizationError('JWT role must match database role for admin actions');
  }

  assertCan(input.actor, input.action, input.resource);

  const destructive = isDestructiveAdminAction(input.action);
  if (destructive && !input.reason?.trim()) {
    throw new AuthorizationError(`Reason is required for destructive action ${input.action}`);
  }

  await writer.write({
    actorId: input.actor.userId,
    actorRole: input.actor.dbRole,
    action: input.action,
    entityType: input.resource.type,
    entityId: input.resource.id ?? 'n/a',
    reason: input.reason?.trim(),
    destructive,
    beforeState: input.beforeState,
    afterState: input.afterState,
    ipAddress: input.ipAddress,
  });
}
