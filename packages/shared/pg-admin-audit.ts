import type { Client } from 'pg';

import type { AdminAuditRecord, AdminAuditWriter } from './admin-audit.js';

export function createPgAdminAuditWriter(client: Client): AdminAuditWriter {
  return {
    async write(record: AdminAuditRecord) {
      await client.query(
        `INSERT INTO audit_log
          (actor_id, actor_role, action, entity_type, entity_id, before_state, after_state, ip_address, reason, destructive)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)`,
        [
          record.actorId,
          record.actorRole,
          record.action,
          record.entityType,
          record.entityId,
          record.beforeState ? JSON.stringify(record.beforeState) : null,
          record.afterState ? JSON.stringify(record.afterState) : null,
          record.ipAddress ?? null,
          record.reason ?? null,
          record.destructive,
        ],
      );
    },
  };
}
