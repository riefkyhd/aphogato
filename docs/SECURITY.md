# Security

## Implemented in app

- **Google refresh token** — stored in `settings` via service role only (`src/lib/calendar/googleSettings.ts`). RLS has no policies for `authenticated` on `settings`.
- **API auth** — protected routes use `requireAuth()` (`src/lib/api/requireAuth.ts`).
- **Login redirect** — `next` query param limited to `/dashboard/*` paths.
- **Rate limits** — gallery confirm (30/min/IP), project upload (40/min/IP) in middleware + confirm route.
- **Upload validation** — magic-byte check, 20MB cap, max 40 files per request.
- **Headers** — `X-Frame-Options`, `Referrer-Policy`, etc. in `next.config.mjs`.

## Configure in Supabase Dashboard

1. **Authentication → Providers → Email** — disable **Sign ups** (invite-only photographer account).
2. **Authentication → Providers → Email → Password** — **Leaked password protection** (Have I Been Pwned). Requires **Supabase Pro or above**; not available on the Free plan. On Free, use a strong unique password and MFA instead.
3. **Authentication → MFA** — enable TOTP for the photographer account (recommended).

## Operational

- Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY`.
- Rotate keys if leaked; restrict Vercel env to required environments.
- Gallery links are secret capability URLs — treat like passwords.

## Future (multi-user)

Add `owner_id` on `projects` / `events` and scope RLS to `auth.uid()`.
