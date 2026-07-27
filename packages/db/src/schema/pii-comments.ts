/**
 * PII / data classification comments applied in SQL migrations (Layer 3).
 * Supabase dashboard schema edits are forbidden — Drizzle migrations only.
 */
export const PII_COLUMN_COMMENTS = {
  'customers.email_encrypted': 'sensitive:encrypted customer email (pgcrypto)',
  'customers.display_name': 'pii:customer display name',
  'customers.auth_user_id': 'internal:auth subject reference',
  'chefs.owner_user_id': 'internal:chef owner auth subject',
  'audit_log.ip_address': 'pii:request source IP',
  'audit_log.before_state': 'internal:entity snapshot before change',
  'audit_log.after_state': 'internal:entity snapshot after change',
  'dishes.name': 'public:menu item title',
  'dishes.description': 'public:menu item description',
  'chefs.display_name': 'public:chef display name',
} as const;
