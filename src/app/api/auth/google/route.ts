import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/calendar/googleCalendar";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const state = randomBytes(16).toString("hex");
    const redirectUri = `${origin}/api/auth/google/callback`;
    const url = getGoogleAuthUrl(state, redirectUri);
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth not configured";
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(message)}`
    );
  }
}
