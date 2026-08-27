import type { NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** True when Supabase session cookies are present (no network validation). */
export function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => name.includes("-auth-token"));
}

export function isAuthGuardRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/dashboard")
  );
}

/** Cookie-local session read — no Auth server round trip (use for redirects only). */
export async function readMiddlewareSessionUser(
  supabase: SupabaseClient
): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}
