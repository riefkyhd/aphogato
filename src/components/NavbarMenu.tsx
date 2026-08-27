"use client";

import { Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { PrivacyFinanceLink } from "@/components/privacy/PrivacyFinanceLink";
import { SignOutButton } from "@/components/SignOutButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { FEATURES } from "@/lib/features";
import { navIsActive } from "@/lib/nav";
import { getDashboardNavItems } from "@/lib/navConfig";
import { cn } from "@/lib/utils";

const linkClass =
  "block py-3 text-[13px] uppercase tracking-label border-b border-border last:border-0 transition-colors";

function NavLink({
  href,
  className,
  children,
  onActiveTap,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onActiveTap: () => void;
}) {
  const pathname = usePathname();
  const active = navIsActive(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        className,
        active
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary"
      )}
      onClick={() => {
        if (navIsActive(pathname, href)) {
          onActiveTap();
        }
      }}
    >
      {children}
    </Link>
  );
}

export function NavbarMenu({ shootsToday }: { shootsToday: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navItems = getDashboardNavItems();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useBodyScrollLock(open);

  return (
    <div className="ml-auto lg:hidden">
      <Tooltip label={open ? "Close menu" : "Open menu"}>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-text-primary"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </Tooltip>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 md:top-[60px] z-40 bg-black/70"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="fixed left-0 right-0 top-14 md:top-[60px] z-50 max-h-[calc(100dvh-3.5rem)] md:max-h-[calc(100dvh-60px)] overflow-y-auto border-b border-border bg-bg-primary px-4 py-2 shadow-lg"
          >
            {navItems.map((item) => {
              if (item.id === "finance") {
                return FEATURES.finance ? (
                  <PrivacyFinanceLink
                    key={item.id}
                    className={cn(linkClass, "flex items-center gap-2")}
                    onActiveTap={() => setOpen(false)}
                  />
                ) : null;
              }

              const showBell =
                item.showCalendarBell &&
                FEATURES.todayShootsReminder &&
                shootsToday > 0;

              return (
                <NavLink
                  key={item.id}
                  href={item.href}
                  className={cn(
                    linkClass,
                    showBell && "flex items-center gap-2"
                  )}
                  onActiveTap={() => setOpen(false)}
                >
                  {item.label}
                  {showBell ? (
                    <span className="inline-flex items-center text-status-editing">
                      <Bell className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">
                        {shootsToday} shoot{shootsToday === 1 ? "" : "s"} today
                      </span>
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
            <div className="py-4">
              <SignOutButton />
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
