import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";

export async function Navbar() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-bg-primary border-b border-border flex items-center px-6">
      <Logo href={user ? "/dashboard" : "/"} size="sm" />
      <nav className="ml-auto flex items-center gap-6">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
            >
              Projects
            </Link>
            <SignOutButton />
          </>
        ) : (
          <Link
            href="/login"
            className="text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
