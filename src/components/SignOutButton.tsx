"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  async function handle() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handle}
      className="text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
    >
      Sign out
    </button>
  );
}
