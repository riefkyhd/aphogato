-- Privacy PIN is stored in public.settings with key 'privacy_pin_hash' (bcrypt hash).
-- Access is service-role only; see 0005_settings_rls_lockdown.sql.
-- No schema change required; this migration documents the convention.

comment on table public.settings is
  'Key-value app settings. Secrets (google_refresh_token, privacy_pin_hash) are service-role only.';
