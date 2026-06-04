"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [signingOut, setSigningOut] = useState(false);

  async function handle() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={signingOut}
      aria-busy={signingOut}
      className={cn(
        "inline-flex items-center gap-2 text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors disabled:opacity-60"
      )}
    >
      {signingOut && (
        <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden />
      )}
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );
}
