-- Secrets in settings (e.g. google_refresh_token) must only be accessed via service role.
drop policy if exists "settings: authenticated full access" on public.settings;
