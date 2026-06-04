import { getTodayDateString } from "@/lib/calendar/todayEvents";
import { Bell, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";

const PORTFOLIO_URL = "https://muhammad-hadid.com";

export async function Navbar() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let shootsToday = 0;
  if (user) {
    const today = getTodayDateString();
    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("shoot_date", today);
    shootsToday = count ?? 0;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-bg-primary border-b border-border flex items-center px-6">
      <Logo href={user ? "/dashboard" : "/"} size="sm" />
      <nav className="ml-auto flex items-center gap-4 sm:gap-6">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/dashboard/calendar"
              className="relative inline-flex items-center gap-1.5 text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
              aria-label={
                shootsToday > 0
                  ? `Calendar, ${shootsToday} shoot${shootsToday === 1 ? "" : "s"} today`
                  : "Calendar"
              }
            >
              Calendar
              {shootsToday > 0 && (
                <span className="inline-flex items-center text-status-editing">
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">
                    {shootsToday} photoshoot{shootsToday === 1 ? "" : "s"} today
                  </span>
                </span>
              )}
            </Link>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
            >
              Portfolio
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="sr-only">(opens in new tab)</span>
            </a>
            <Link
              href="/dashboard/settings"
              className="text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
            >
              Settings
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
