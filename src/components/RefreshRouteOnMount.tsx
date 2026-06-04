"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refetch the current route's server data (bypasses stale client router cache). */
export function RefreshRouteOnMount() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [router]);

  return null;
}
