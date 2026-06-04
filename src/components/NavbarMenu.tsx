"use client";

import { Bell, ExternalLink, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";
import { cn } from "@/lib/utils";

const PORTFOLIO_URL = "https://muhammad-hadid.com";

const linkClass =
  "block py-3 text-[13px] uppercase tracking-label text-text-secondary hover:text-text-primary border-b border-border last:border-0";

export function NavbarMenu({ shootsToday }: { shootsToday: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="ml-auto md:hidden">
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

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/70"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="fixed left-0 right-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-bg-primary px-4 py-2 shadow-lg"
          >
            <Link href="/dashboard" className={linkClass}>
              Projects
            </Link>
            <Link href="/dashboard/finance" className={linkClass}>
              Finance
            </Link>
            <Link
              href="/dashboard/calendar"
              className={cn(linkClass, "flex items-center gap-2")}
            >
              Calendar
              {shootsToday > 0 && (
                <span className="inline-flex items-center text-status-editing">
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">
                    {shootsToday} shoot{shootsToday === 1 ? "" : "s"} today
                  </span>
                </span>
              )}
            </Link>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(linkClass, "flex items-center gap-2")}
            >
              Portfolio
              <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </a>
            <Link href="/dashboard/settings" className={linkClass}>
              Settings
            </Link>
            <div className="py-4">
              <SignOutButton />
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
