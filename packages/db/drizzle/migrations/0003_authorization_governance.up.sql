-- 0003_authorization_governance.up.sql

CREATE TYPE app_role AS ENUM (
  'customer',
  'chef',
  'chef_pending',
  'support',
  'admin',
  'superadmin'
);

CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY,
  role app_role NOT NULL DEFAULT 'customer',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_updated_by_check CHECK (updated_at IS NOT NULL)
);

COMMENT ON TABLE user_roles IS 'internal:authoritative RBAC roles (JWT claims are re-verified against this table)';
COMMENT ON COLUMN user_roles.role IS 'internal:current role for server-side authorization';

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS destructive BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN audit_log.reason IS 'internal:required justification for destructive admin actions';

CREATE TYPE dsar_request_type AS ENUM ('export', 'delete');
CREATE TYPE dsar_request_status AS ENUM (
  'pending_email_confirmation',
  'confirmed',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

CREATE TABLE dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type dsar_request_type NOT NULL,
  status dsar_request_status NOT NULL DEFAULT 'pending_email_confirmation',
  confirmation_token_hash TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT
);

CREATE INDEX dsar_requests_user_id_idx ON dsar_requests (user_id);
CREATE INDEX dsar_requests_status_idx ON dsar_requests (status);

COMMENT ON TABLE dsar_requests IS 'pii:data subject access and erasure requests';

CREATE TABLE identity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  storage_key TEXT NOT NULL,
  verification_completed_at TIMESTAMPTZ,
  delete_after TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX identity_documents_delete_after_idx ON identity_documents (delete_after)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN identity_documents.storage_key IS 'sensitive:document object key in private storage';

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE dsar_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsar_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_documents FORCE ROW LEVEL SECURITY;

CREATE POLICY user_roles_service ON user_roles FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);
CREATE POLICY user_roles_self_select ON user_roles FOR SELECT TO app_authenticated
  USING (user_id = app_current_user_id());

CREATE POLICY dsar_requests_self ON dsar_requests FOR SELECT TO app_authenticated
  USING (user_id = app_current_user_id());
CREATE POLICY dsar_requests_self_insert ON dsar_requests FOR INSERT TO app_authenticated
  WITH CHECK (user_id = app_current_user_id());
CREATE POLICY dsar_requests_service ON dsar_requests FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);

CREATE POLICY identity_documents_service ON identity_documents FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);

GRANT SELECT ON user_roles TO app_authenticated;
GRANT SELECT, INSERT ON dsar_requests TO app_authenticated;
