"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Refetch server data when entering a route (bypasses stale client router cache). */
export function RefreshRouteOnMount() {
  const router = useRouter();
  const pathname = usePathname();
  const lastRefreshedPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastRefreshedPath.current === pathname) return;
    lastRefreshedPath.current = pathname;
    router.refresh();
  }, [pathname, router]);

  return null;
}
