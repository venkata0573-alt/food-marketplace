/**
 * Single authorization module — every server action / route handler calls `can(user, action, resource)`.
 * Do not scatter inline permission checks in handlers.
 */

export const ROLES = [
  'customer',
  'chef',
  'chef_pending',
  'support',
  'admin',
  'superadmin',
] as const;

export type Role = (typeof ROLES)[number];

export const AUTHZ_ACTIONS = [
  'order:read',
  'order:cancel',
  'order:refund',
  'chef:read',
  'chef:update:own',
  'chef:suspend',
  'chef:verify:submit',
  'payout:bank:update',
  'user:read:own',
  'user:export',
  'user:delete',
  'admin:audit:read',
  'dsar:request',
] as const;

export type AuthzAction = (typeof AUTHZ_ACTIONS)[number];

export const DESTRUCTIVE_ADMIN_ACTIONS = ['chef:suspend', 'order:cancel', 'order:refund'] as const;

export type DestructiveAdminAction = (typeof DESTRUCTIVE_ADMIN_ACTIONS)[number];

export interface AuthzResource {
  type: 'order' | 'chef' | 'customer' | 'user' | 'payout' | 'dsar' | 'audit' | 'system';
  id?: string;
  /** Subject that owns the resource (matches auth user id). */
  ownerUserId?: string;
  chefId?: string;
  customerUserId?: string;
}

/** JWT custom claim role — never sufficient alone for privileged operations. */
export interface AuthzUser {
  userId: string;
  jwtRole: Role;
  /** Authoritative role from `user_roles` (database). */
  dbRole: Role;
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export function isDestructiveAdminAction(action: AuthzAction): action is DestructiveAdminAction {
  return (DESTRUCTIVE_ADMIN_ACTIONS as readonly string[]).includes(action);
}

export function rolesMatchForPrivilege(user: AuthzUser): boolean {
  return user.jwtRole === user.dbRole;
}

function roleRank(role: Role): number {
  const order: Role[] = ['customer', 'chef_pending', 'chef', 'support', 'admin', 'superadmin'];
  return order.indexOf(role);
}

function hasMinRole(user: AuthzUser, minimum: Role): boolean {
  return roleRank(user.dbRole) >= roleRank(minimum);
}

function isSelf(user: AuthzUser, resource: AuthzResource): boolean {
  return resource.ownerUserId === user.userId || resource.customerUserId === user.userId;
}

/**
 * Central policy decision. Privileged actions require JWT role to match DB role.
 */
export function can(user: AuthzUser, action: AuthzAction, resource: AuthzResource): boolean {
  const privilegedActions: AuthzAction[] = [
    'order:cancel',
    'order:refund',
    'chef:suspend',
    'admin:audit:read',
    'user:export',
    'user:delete',
  ];

  if (privilegedActions.includes(action) && !rolesMatchForPrivilege(user)) {
    return false;
  }

  switch (action) {
    case 'order:read':
      if (user.dbRole === 'customer') {
        return isSelf(user, resource);
      }
      if (user.dbRole === 'chef') {
        return Boolean(resource.chefId);
      }
      return hasMinRole(user, 'support');

    case 'order:cancel':
      if (user.dbRole === 'customer') {
        return isSelf(user, resource);
      }
      return hasMinRole(user, 'support');

    case 'order:refund':
      return hasMinRole(user, 'support');

    case 'chef:read':
      return true;

    case 'chef:update:own':
      return user.dbRole === 'chef' && isSelf(user, resource);

    case 'chef:suspend':
      return hasMinRole(user, 'admin');

    case 'chef:verify:submit':
      return user.dbRole === 'chef' || user.dbRole === 'chef_pending';

    case 'payout:bank:update':
      return user.dbRole === 'chef';

    case 'user:read:own':
      return isSelf(user, resource);

    case 'user:export':
    case 'user:delete':
    case 'dsar:request':
      return isSelf(user, resource);

    case 'admin:audit:read':
      return hasMinRole(user, 'admin');

    default:
      return false;
  }
}

export function assertCan(user: AuthzUser, action: AuthzAction, resource: AuthzResource): void {
  if (!can(user, action, resource)) {
    throw new AuthorizationError(`Forbidden: ${action} on ${resource.type}`);
  }
}

export function parseRole(value: unknown): Role {
  if (typeof value === 'string' && (ROLES as readonly string[]).includes(value)) {
    return value as Role;
  }
  return 'customer';
}

/** Build user context after loading DB role — compare with JWT `app_role` claim. */
export function buildAuthzUser(params: { userId: string; jwtRole: Role; dbRole: Role }): AuthzUser {
  return {
    userId: params.userId,
    jwtRole: params.jwtRole,
    dbRole: params.dbRole,
  };
}
