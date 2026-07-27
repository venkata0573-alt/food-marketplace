import { performAdminAction, type AdminAuditWriter } from '@food-marketplace/shared/admin-audit';
import {
  assertCan,
  buildAuthzUser,
  can,
  type AuthzUser,
  type Role,
} from '@food-marketplace/shared/authz';
import { describe, expect, it, vi } from 'vitest';

function user(role: Role, jwtRole: Role = role): AuthzUser {
  return buildAuthzUser({ userId: 'user-1', jwtRole, dbRole: role });
}

describe('can()', () => {
  it('denies privileged action when JWT role differs from database role', () => {
    const mismatched = user('admin', 'customer');
    expect(can(mismatched, 'order:refund', { type: 'order', id: 'o1' })).toBe(false);
  });

  it('allows customer to read own order', () => {
    expect(
      can(user('customer'), 'order:read', {
        type: 'order',
        id: 'o1',
        ownerUserId: 'user-1',
      }),
    ).toBe(true);
  });

  it('allows admin to suspend chef', () => {
    expect(can(user('admin'), 'chef:suspend', { type: 'chef', id: 'c1' })).toBe(true);
  });

  it('denies chef_pending from refunding orders', () => {
    expect(can(user('chef_pending'), 'order:refund', { type: 'order', id: 'o1' })).toBe(false);
  });
});

describe('performAdminAction()', () => {
  it('requires reason for destructive chef suspension', async () => {
    const writer: AdminAuditWriter = { write: vi.fn(async () => {}) };
    await expect(
      performAdminAction(writer, {
        actor: user('admin'),
        action: 'chef:suspend',
        resource: { type: 'chef', id: 'chef-1' },
      }),
    ).rejects.toThrow(/Reason is required/);
  });

  it('writes audit log when reason is provided', async () => {
    const write = vi.fn(async () => {});
    await performAdminAction(
      { write },
      {
        actor: user('admin'),
        action: 'chef:suspend',
        resource: { type: 'chef', id: 'chef-1' },
        reason: 'Repeated health code violations',
      },
    );
    expect(write).toHaveBeenCalledOnce();
  });
});

describe('assertCan()', () => {
  it('throws AuthorizationError when denied', () => {
    expect(() => assertCan(user('customer'), 'admin:audit:read', { type: 'audit' })).toThrow(
      /Forbidden/,
    );
  });
});
