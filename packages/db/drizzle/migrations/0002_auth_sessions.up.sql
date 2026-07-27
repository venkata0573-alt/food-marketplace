-- 0002_auth_sessions.up.sql

CREATE TABLE session_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  current_refresh_hash TEXT NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX session_families_user_id_idx ON session_families (user_id);
CREATE INDEX session_families_revoked_at_idx ON session_families (revoked_at);

CREATE TABLE refresh_token_events (
  id BIGSERIAL PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES session_families (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reuse_detected BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX refresh_token_events_family_id_idx ON refresh_token_events (family_id);

CREATE TABLE auth_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  family_id UUID REFERENCES session_families (id) ON DELETE SET NULL,
  device_label TEXT NOT NULL DEFAULT 'Unknown device',
  user_agent TEXT,
  ip_address TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX auth_devices_user_id_idx ON auth_devices (user_id);

CREATE TABLE cookie_consent_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  anonymous_id TEXT,
  necessary BOOLEAN NOT NULL DEFAULT TRUE,
  analytics BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  policy_version TEXT NOT NULL DEFAULT '1'
);

CREATE INDEX cookie_consent_log_user_id_idx ON cookie_consent_log (user_id);
CREATE INDEX cookie_consent_log_anonymous_id_idx ON cookie_consent_log (anonymous_id);

CREATE TABLE step_up_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT step_up_grants_action_not_empty CHECK (length(trim(action)) > 0)
);

CREATE INDEX step_up_grants_user_action_idx ON step_up_grants (user_id, action, expires_at DESC);

COMMENT ON TABLE cookie_consent_log IS 'internal:cookie consent audit';
COMMENT ON COLUMN cookie_consent_log.anonymous_id IS 'pii:pseudonymous browser id before login';

ALTER TABLE session_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_families FORCE ROW LEVEL SECURITY;
ALTER TABLE refresh_token_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_token_events FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_devices FORCE ROW LEVEL SECURITY;
ALTER TABLE cookie_consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consent_log FORCE ROW LEVEL SECURITY;
ALTER TABLE step_up_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_up_grants FORCE ROW LEVEL SECURITY;

CREATE POLICY session_families_service ON session_families FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);
CREATE POLICY refresh_token_events_service ON refresh_token_events FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);
CREATE POLICY auth_devices_authenticated_select ON auth_devices FOR SELECT TO app_authenticated
  USING (user_id = app_current_user_id() AND revoked_at IS NULL);
CREATE POLICY auth_devices_authenticated_update ON auth_devices FOR UPDATE TO app_authenticated
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());
CREATE POLICY auth_devices_service ON auth_devices FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);
CREATE POLICY cookie_consent_anon_insert ON cookie_consent_log FOR INSERT TO app_anon WITH CHECK (true);
CREATE POLICY cookie_consent_authenticated_insert ON cookie_consent_log FOR INSERT TO app_authenticated
  WITH CHECK (user_id = app_current_user_id());
CREATE POLICY cookie_consent_service ON cookie_consent_log FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);
CREATE POLICY step_up_grants_service ON step_up_grants FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, UPDATE ON auth_devices TO app_authenticated;
GRANT INSERT ON cookie_consent_log TO app_anon, app_authenticated;
