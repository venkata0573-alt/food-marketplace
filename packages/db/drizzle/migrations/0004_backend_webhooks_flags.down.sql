-- 0004_backend_webhooks_flags.down.sql

DROP POLICY IF EXISTS feature_flags_admin_read ON feature_flags;
DROP POLICY IF EXISTS feature_flags_service ON feature_flags;
DROP POLICY IF EXISTS stripe_webhook_events_service ON stripe_webhook_events;

DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS stripe_webhook_events CASCADE;
