import type { SupabaseClient } from '@supabase/supabase-js';

import { hashRefreshToken } from '../cookies/session-cookies.js';

export type RefreshRotationResult =
  | {
      ok: true;
      familyId: string;
      accessToken: string;
      refreshToken: string;
    }
  | {
      ok: false;
      reason: 'reuse_detected' | 'revoked' | 'invalid';
    };

export interface SessionFamilyStore {
  findByRefreshHash(refreshHash: string): Promise<{
    id: string;
    userId: string;
    currentRefreshHash: string;
    revokedAt: string | null;
    previouslyUsed: boolean;
  } | null>;
  recordRotation(familyId: string, previousHash: string, nextHash: string): Promise<void>;
  markReuseAndRevokeFamily(familyId: string): Promise<void>;
  createFamily(userId: string, refreshHash: string): Promise<string>;
  revokeAllForUser(userId: string): Promise<void>;
}

/**
 * Rotating refresh tokens with reuse detection — replay revokes the entire session family.
 */
export async function rotateRefreshToken(
  store: SessionFamilyStore,
  presentedRefreshToken: string,
  issueTokens: (userId: string) => Promise<{ accessToken: string; refreshToken: string }>,
): Promise<RefreshRotationResult> {
  const presentedHash = hashRefreshToken(presentedRefreshToken);
  const family = await store.findByRefreshHash(presentedHash);
  if (!family) {
    return { ok: false, reason: 'invalid' };
  }
  if (family.revokedAt) {
    return { ok: false, reason: 'revoked' };
  }
  if (family.previouslyUsed && family.currentRefreshHash !== presentedHash) {
    await store.markReuseAndRevokeFamily(family.id);
    return { ok: false, reason: 'reuse_detected' };
  }
  if (family.currentRefreshHash !== presentedHash) {
    return { ok: false, reason: 'invalid' };
  }

  const next = await issueTokens(family.userId);
  const nextHash = hashRefreshToken(next.refreshToken);
  await store.recordRotation(family.id, presentedHash, nextHash);

  return {
    ok: true,
    familyId: family.id,
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
  };
}

export async function invalidateUserSessions(
  admin: SupabaseClient,
  store: SessionFamilyStore,
  userId: string,
): Promise<void> {
  await store.revokeAllForUser(userId);
  await admin.auth.admin.signOut(userId, 'global');
}

export type SessionInvalidationReason = 'password_change' | 'email_change' | 'role_change';

export async function invalidateSessionsForSecurityEvent(
  admin: SupabaseClient,
  store: SessionFamilyStore,
  userId: string,
  _reason: SessionInvalidationReason,
): Promise<void> {
  await invalidateUserSessions(admin, store, userId);
}
