"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavigatingLink({
  href,
  className,
  children,
  loadingLabel = "Loading…",
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  loadingLabel?: string;
}) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <Link
      href={href}
      onClick={() => setIsNavigating(true)}
      aria-busy={isNavigating}
      className={cn(
        className,
        "inline-flex items-center justify-center gap-2 transition-opacity duration-150",
        isNavigating && "pointer-events-none opacity-70"
      )}
    >
      {isNavigating && (
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
      )}
      {isNavigating ? loadingLabel : children}
    </Link>
  );
}
