-- 0003_authorization_governance.down.sql

DROP POLICY IF EXISTS identity_documents_service ON identity_documents;
DROP POLICY IF EXISTS dsar_requests_service ON dsar_requests;
DROP POLICY IF EXISTS dsar_requests_self_insert ON dsar_requests;
DROP POLICY IF EXISTS dsar_requests_self ON dsar_requests;
DROP POLICY IF EXISTS user_roles_self_select ON user_roles;
DROP POLICY IF EXISTS user_roles_service ON user_roles;

DROP TABLE IF EXISTS identity_documents CASCADE;
DROP TABLE IF EXISTS dsar_requests CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

ALTER TABLE audit_log DROP COLUMN IF EXISTS destructive;
ALTER TABLE audit_log DROP COLUMN IF EXISTS reason;

DROP TYPE IF EXISTS dsar_request_status CASCADE;
DROP TYPE IF EXISTS dsar_request_type CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;
