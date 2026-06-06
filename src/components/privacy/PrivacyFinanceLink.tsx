"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePendingNav } from "@/components/navigation/PendingNavProvider";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
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
  const { startNavigation, isPending } = usePendingNav();
  const { pinEnabled, isLocked, settingsLoaded } = usePrivacyLockContext();
  const active = financeIsActive(pathname);
  const pending = isPending(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] uppercase tracking-label transition-colors",
        active
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary",
        pending && "text-text-primary opacity-70",
        className
      )}
      onClick={() => {
        startNavigation(href);
        onClick?.();
        if (financeIsActive(pathname)) onActiveTap?.();
      }}
    >
      {pending ? (
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-text-primary animate-pulse"
          aria-hidden
        />
      ) : null}
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
