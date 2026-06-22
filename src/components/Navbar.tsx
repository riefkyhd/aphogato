import { Bell, ExternalLink } from "lucide-react";
import Link from "next/link";
import { FEATURES } from "@/lib/features";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { NavbarLink } from "./NavbarLink";
import { PrivacyFinanceLink } from "./privacy/PrivacyFinanceLink";
import { Logo } from "./Logo";
import { NavbarMenu } from "./NavbarMenu";
import { SignOutButton } from "./SignOutButton";

const PORTFOLIO_URL = "https://muhammad-hadid.com";

export function Navbar({
  isAuthenticated,
  shootsToday = 0,
}: {
  isAuthenticated: boolean;
  shootsToday?: number;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-[60px] bg-bg-primary border-b border-border">
      <DashboardShell className="flex h-full items-center">
        <Logo href={isAuthenticated ? "/dashboard" : "/"} size="sm" />
        <nav className="ml-auto hidden md:flex items-center gap-6">
        {isAuthenticated ? (
          <>
            {FEATURES.projectsGrid ? (
              <NavbarLink href="/dashboard">Projects</NavbarLink>
            ) : null}
            {FEATURES.finance ? <PrivacyFinanceLink /> : null}
            {FEATURES.calendar ? (
            <NavbarLink
              href="/dashboard/calendar"
              className="relative inline-flex items-center gap-1.5"
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
            </NavbarLink>
            ) : null}
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
            {FEATURES.clients ? (
              <NavbarLink href="/dashboard/clients">Clients</NavbarLink>
            ) : null}
            {FEATURES.pricing ? (
              <NavbarLink href="/dashboard/pricing">Pricing</NavbarLink>
            ) : null}
            {FEATURES.settings ? (
              <NavbarLink href="/dashboard/settings">Settings</NavbarLink>
            ) : null}
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
        {isAuthenticated ? <NavbarMenu shootsToday={shootsToday} /> : null}
      </DashboardShell>
    </header>
  );
}
