import { NextResponse } from "next/server";
import {
  exchangeCodeForRefreshToken,
  storeRefreshToken,
} from "@/lib/calendar/googleCalendar";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STATE_COOKIE = "google_oauth_state";

function siteOrigin(request: Request): string {
  const url = new URL(request.url);
  return process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
}

export async function GET(request: Request) {
  const origin = siteOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(oauthError)}`
    );
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateMatch = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`));
  const savedState = stateMatch?.split("=")[1];

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent("Invalid OAuth state")}`
    );
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const refreshToken = await exchangeCodeForRefreshToken(code, redirectUri);
    await storeRefreshToken(refreshToken);
    const response = NextResponse.redirect(
      `${origin}/dashboard/settings?connected=true`
    );
    response.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect Google Calendar";
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(message)}`
    );
  }
}
