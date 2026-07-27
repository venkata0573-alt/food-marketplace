import { createHash, randomBytes } from 'node:crypto';

import type { Client } from 'pg';

import { type Role, parseRole } from './authz.js';

export interface RoleStore {
  getRoleForUser(userId: string): Promise<Role>;
}

export function createPgRoleStore(client: Client): RoleStore {
  return {
    async getRoleForUser(userId) {
      const result = await client.query<{ role: Role }>(
        `SELECT role::text AS role FROM user_roles WHERE user_id = $1`,
        [userId],
      );
      return parseRole(result.rows[0]?.role ?? 'customer');
    },
  };
}

export type DsarRequestType = 'export' | 'delete';

export interface DsarEnqueueResult {
  requestId: string;
  status: 'pending_email_confirmation';
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateConfirmationToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function enqueueDsarRequest(
  client: Client,
  params: { userId: string; requestType: DsarRequestType },
): Promise<DsarEnqueueResult & { confirmationToken: string }> {
  const confirmationToken = generateConfirmationToken();
  const result = await client.query<{ id: string }>(
    `INSERT INTO dsar_requests (user_id, request_type, confirmation_token_hash)
     VALUES ($1, $2::dsar_request_type, $3)
     RETURNING id`,
    [params.userId, params.requestType, hashToken(confirmationToken)],
  );
  return {
    requestId: result.rows[0]!.id,
    status: 'pending_email_confirmation',
    confirmationToken,
  };
}

export async function confirmDsarRequest(
  client: Client,
  params: { requestId: string; token: string },
): Promise<boolean> {
  const result = await client.query(
    `UPDATE dsar_requests
     SET status = 'confirmed', confirmed_at = NOW()
     WHERE id = $1
       AND confirmation_token_hash = $2
       AND status = 'pending_email_confirmation'
     RETURNING id`,
    [params.requestId, hashToken(params.token)],
  );
  return (result.rowCount ?? 0) > 0;
}
