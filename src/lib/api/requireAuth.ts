import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type AuthResult =
  | { ok: true; user: User; supabase: ReturnType<typeof createServerSupabase> }
  | { ok: false; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, user, supabase };
}
