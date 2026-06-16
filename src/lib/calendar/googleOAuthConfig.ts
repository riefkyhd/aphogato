import "server-only";

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

/** Canonical site origin for OAuth redirect URIs (must match Google Cloud console). */
export function getGoogleOAuthOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export function getGoogleOAuthRedirectUri(request: Request): string {
  return `${getGoogleOAuthOrigin(request)}/api/auth/google/callback`;
}
