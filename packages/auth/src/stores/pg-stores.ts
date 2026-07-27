import type { Client } from 'pg';

import type { ConsentLogInput, ConsentStore } from '../consent/state.js';
import type { AuthDevice, DeviceStore } from '../devices/revoke.js';
import { hashRefreshToken } from '../cookies/session-cookies.js';
import type { SessionFamilyStore } from '../session/refresh-rotation.js';
import type { StepUpAction } from '../constants.js';
import type { StepUpGrant, StepUpStore } from '../step-up/require.js';

export function createPgSessionFamilyStore(client: Client): SessionFamilyStore {
  return {
    async findByRefreshHash(refreshHash) {
      const current = await client.query<{
        id: string;
        user_id: string;
        current_refresh_hash: string;
        revoked_at: string | null;
      }>(
        `SELECT id, user_id, current_refresh_hash, revoked_at
         FROM session_families
         WHERE current_refresh_hash = $1
         LIMIT 1`,
        [refreshHash],
      );
      if (current.rows[0]) {
        const row = current.rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          currentRefreshHash: row.current_refresh_hash,
          revokedAt: row.revoked_at,
          previouslyUsed: false,
        };
      }
      const used = await client.query<{ family_id: string }>(
        `SELECT family_id FROM refresh_token_events WHERE token_hash = $1 LIMIT 1`,
        [refreshHash],
      );
      if (!used.rows[0]) {
        return null;
      }
      const family = await client.query<{
        id: string;
        user_id: string;
        current_refresh_hash: string;
        revoked_at: string | null;
      }>(
        `SELECT id, user_id, current_refresh_hash, revoked_at FROM session_families WHERE id = $1`,
        [used.rows[0].family_id],
      );
      const row = family.rows[0];
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        userId: row.user_id,
        currentRefreshHash: row.current_refresh_hash,
        revokedAt: row.revoked_at,
        previouslyUsed: true,
      };
    },
    async recordRotation(familyId, previousHash, nextHash) {
      await client.query('BEGIN');
      try {
        await client.query(
          `INSERT INTO refresh_token_events (family_id, token_hash) VALUES ($1, $2)`,
          [familyId, previousHash],
        );
        await client.query(
          `UPDATE session_families
           SET current_refresh_hash = $2, updated_at = NOW()
           WHERE id = $1`,
          [familyId, nextHash],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    },
    async markReuseAndRevokeFamily(familyId) {
      await client.query(
        `UPDATE session_families SET revoked_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [familyId],
      );
      await client.query(
        `INSERT INTO refresh_token_events (family_id, token_hash, reuse_detected)
         VALUES ($1, 'reuse', TRUE)`,
        [familyId],
      );
    },
    async createFamily(userId, refreshHash) {
      const result = await client.query<{ id: string }>(
        `INSERT INTO session_families (user_id, current_refresh_hash)
         VALUES ($1, $2)
         RETURNING id`,
        [userId, refreshHash],
      );
      return result.rows[0]!.id;
    },
    async revokeAllForUser(userId) {
      await client.query(
        `UPDATE session_families SET revoked_at = NOW(), updated_at = NOW()
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );
    },
  };
}

export function createPgDeviceStore(client: Client): DeviceStore {
  return {
    async listActiveDevices(userId) {
      const result = await client.query<AuthDevice>(
        `SELECT id, device_label AS "deviceLabel", user_agent AS "userAgent",
                ip_address AS "ipAddress", last_seen_at AS "lastSeenAt", revoked_at AS "revokedAt"
         FROM auth_devices
         WHERE user_id = $1 AND revoked_at IS NULL
         ORDER BY last_seen_at DESC`,
        [userId],
      );
      return result.rows;
    },
    async revokeDevice(userId, deviceId) {
      const result = await client.query(
        `UPDATE auth_devices SET revoked_at = NOW()
         WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
        [deviceId, userId],
      );
      return (result.rowCount ?? 0) > 0;
    },
  };
}

export function createPgConsentStore(client: Client): ConsentStore {
  return {
    async appendConsent(input: ConsentLogInput) {
      await client.query(
        `INSERT INTO cookie_consent_log
          (user_id, anonymous_id, necessary, analytics, marketing, policy_version)
         VALUES ($1, $2, TRUE, $3, $4, $5)`,
        [
          input.userId ?? null,
          input.anonymousId ?? null,
          input.analytics,
          input.marketing,
          input.policyVersion ?? '1',
        ],
      );
    },
  };
}

export function createPgStepUpStore(client: Client): StepUpStore {
  return {
    async saveGrant(grant: StepUpGrant) {
      await client.query(
        `INSERT INTO step_up_grants (user_id, action, verified_at, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [grant.userId, grant.action, grant.verifiedAt.toISOString(), grant.expiresAt.toISOString()],
      );
    },
    async getValidGrant(userId, action, now = new Date()) {
      const result = await client.query<{
        user_id: string;
        action: StepUpAction;
        verified_at: string;
        expires_at: string;
      }>(
        `SELECT user_id, action, verified_at, expires_at
         FROM step_up_grants
         WHERE user_id = $1 AND action = $2 AND expires_at > $3
         ORDER BY verified_at DESC
         LIMIT 1`,
        [userId, action, now.toISOString()],
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return {
        userId: row.user_id,
        action: row.action,
        verifiedAt: new Date(row.verified_at),
        expiresAt: new Date(row.expires_at),
      };
    },
  };
}

export { hashRefreshToken };
