"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { cn } from "@/lib/utils";

function financeIsActive(pathname: string) {
  return pathname === "/dashboard/finance" || pathname.startsWith("/dashboard/finance/");
}

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
  const { pinEnabled, isLocked, settingsLoaded } = usePrivacyLockContext();

  return (
    <Link
      href="/dashboard/finance"
      className={cn("inline-flex items-center gap-1.5", className)}
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
