"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { cn } from "@/lib/utils";

const TABS = [
  {
    label: "Overview & Ledger",
    href: "/dashboard/finance",
    enabled: () => FEATURES.finance,
    exact: true,
  },
  {
    label: "Quotations",
    href: "/dashboard/quotations",
    enabled: () => FEATURES.quotations,
    exact: false,
  },
  {
    label: "Invoices",
    href: "/dashboard/invoices",
    enabled: () => FEATURES.invoices,
    exact: false,
  },
  {
    label: "Price List",
    href: "/dashboard/pricing",
    enabled: () => FEATURES.pricing,
    exact: false,
  },
] as const;

export function SalesSectionNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const visible = TABS.filter((tab) => tab.enabled());

  if (visible.length <= 1) return null;

  return (
    <nav
      className={cn("flex flex-wrap gap-2", className)}
      aria-label="Finance and sales section"
    >
      {visible.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "px-3 py-2 sm:py-1.5 text-[11px] uppercase tracking-label border transition-colors",
              active
                ? "border-text-primary text-text-primary bg-bg-secondary"
                : "border-border text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
