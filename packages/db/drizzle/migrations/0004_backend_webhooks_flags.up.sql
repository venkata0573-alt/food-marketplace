-- 0004_backend_webhooks_flags.up.sql

CREATE TABLE stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_error TEXT
);

CREATE INDEX stripe_webhook_events_unprocessed_idx
  ON stripe_webhook_events (received_at)
  WHERE processed_at IS NULL;

COMMENT ON TABLE stripe_webhook_events IS 'internal:Stripe webhook idempotency and async processing ledger';

CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE feature_flags IS 'internal:ship-dark feature toggles';

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events FORCE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags FORCE ROW LEVEL SECURITY;

CREATE POLICY stripe_webhook_events_service ON stripe_webhook_events FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);
CREATE POLICY feature_flags_service ON feature_flags FOR ALL TO app_service_role
  USING (true) WITH CHECK (true);
CREATE POLICY feature_flags_admin_read ON feature_flags FOR SELECT TO app_admin USING (true);

GRANT SELECT ON feature_flags TO app_admin;
