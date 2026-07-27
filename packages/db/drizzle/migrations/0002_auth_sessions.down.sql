-- 0002_auth_sessions.down.sql

DROP POLICY IF EXISTS step_up_grants_service ON step_up_grants;
DROP POLICY IF EXISTS cookie_consent_service ON cookie_consent_log;
DROP POLICY IF EXISTS cookie_consent_authenticated_insert ON cookie_consent_log;
DROP POLICY IF EXISTS cookie_consent_anon_insert ON cookie_consent_log;
DROP POLICY IF EXISTS auth_devices_service ON auth_devices;
DROP POLICY IF EXISTS auth_devices_authenticated_update ON auth_devices;
DROP POLICY IF EXISTS auth_devices_authenticated_select ON auth_devices;
DROP POLICY IF EXISTS refresh_token_events_service ON refresh_token_events;
DROP POLICY IF EXISTS session_families_service ON session_families;

DROP TABLE IF EXISTS step_up_grants CASCADE;
DROP TABLE IF EXISTS cookie_consent_log CASCADE;
DROP TABLE IF EXISTS auth_devices CASCADE;
DROP TABLE IF EXISTS refresh_token_events CASCADE;
DROP TABLE IF EXISTS session_families CASCADE;
