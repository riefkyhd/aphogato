import { Bell } from "lucide-react";
import Link from "next/link";
import { FEATURES } from "@/lib/features";
import { getDashboardNavItems } from "@/lib/navConfig";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { NavbarLink } from "./NavbarLink";
import { PrivacyFinanceLink } from "./privacy/PrivacyFinanceLink";
import { Logo } from "./Logo";
import { NavbarMenu } from "./NavbarMenu";
import { SignOutButton } from "./SignOutButton";

export function Navbar({
  isAuthenticated,
  shootsToday = 0,
}: {
  isAuthenticated: boolean;
  shootsToday?: number;
}) {
  const navItems = getDashboardNavItems();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-[60px] bg-bg-primary border-b border-border">
      <DashboardShell className="flex h-full items-center">
        <Logo href={isAuthenticated ? "/dashboard" : "/"} size="sm" />
        <nav className="ml-auto hidden lg:flex items-center gap-4 xl:gap-6">
          {isAuthenticated ? (
            <>
              {navItems.map((item) => {
                if (item.id === "finance") {
                  return FEATURES.finance ? (
                    <PrivacyFinanceLink key={item.id} />
                  ) : null;
                }

                const showBell =
                  item.showCalendarBell &&
                  FEATURES.todayShootsReminder &&
                  shootsToday > 0;

                return (
                  <NavbarLink
                    key={item.id}
                    href={item.href}
                    className={
                      showBell
                        ? "relative inline-flex items-center gap-1.5"
                        : undefined
                    }
                    aria-label={
                      showBell
                        ? `Calendar, ${shootsToday} shoot${shootsToday === 1 ? "" : "s"} today`
                        : item.label
                    }
                  >
                    {item.label}
                    {showBell ? (
                      <span className="inline-flex items-center text-status-editing">
                        <Bell className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">
                          {shootsToday} photoshoot
                          {shootsToday === 1 ? "" : "s"} today
                        </span>
                      </span>
                    ) : null}
                  </NavbarLink>
                );
              })}
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
