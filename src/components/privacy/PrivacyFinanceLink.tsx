"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { FEATURES } from "@/lib/features";
import { financeIsActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function PrivacyFinanceLink({
  className,
  onClick,
  onActiveTap,
}: {
  className?: string;
  onClick?: () => void;
  onActiveTap?: () => void;
}) {
  const pathname = usePathname();
  const href = "/dashboard/finance";
  const { pinEnabled, isLocked, settingsLoaded } = usePrivacyLockContext();

  if (!FEATURES.finance) return null;

  const active = financeIsActive(pathname);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] uppercase tracking-label transition-colors",
        active
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary",
        className
      )}
      onClick={() => {
        onClick?.();
        if (financeIsActive(pathname)) onActiveTap?.();
      }}
    >
      Finance
      {settingsLoaded && pinEnabled && isLocked ? (
        <Lock className="h-3 w-3 opacity-70" aria-hidden />
      ) : null}
      {settingsLoaded && pinEnabled && isLocked ? (
        <span className="sr-only">(locked)</span>
      ) : null}
    </Link>
  );
}
