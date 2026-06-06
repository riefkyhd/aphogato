"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { navIsActive } from "@/lib/nav";

type PendingNavContextValue = {
  pendingHref: string | null;
  startNavigation: (href: string) => void;
  isPending: (href: string) => boolean;
};

const PendingNavContext = createContext<PendingNavContextValue | null>(null);

export function PendingNavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const startNavigation = useCallback(
    (href: string) => {
      if (navIsActive(pathname, href)) return;
      setPendingHref(href);
    },
    [pathname]
  );

  const isPending = useCallback(
    (href: string) => pendingHref === href,
    [pendingHref]
  );

  return (
    <PendingNavContext.Provider
      value={{ pendingHref, startNavigation, isPending }}
    >
      {children}
    </PendingNavContext.Provider>
  );
}

export function usePendingNav(): PendingNavContextValue {
  const ctx = useContext(PendingNavContext);
  if (!ctx) {
    return {
      pendingHref: null,
      startNavigation: () => {},
      isPending: () => false,
    };
  }
  return ctx;
}
