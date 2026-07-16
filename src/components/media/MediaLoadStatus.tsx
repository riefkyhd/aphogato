"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MediaLoadStatusContextValue = {
  reportFailure: () => void;
  failedCount: number;
};

const MediaLoadStatusContext =
  createContext<MediaLoadStatusContextValue | null>(null);

export function MediaLoadStatusProvider({ children }: { children: ReactNode }) {
  const [failedCount, setFailedCount] = useState(0);

  const reportFailure = useCallback(() => {
    setFailedCount((count) => count + 1);
  }, []);

  const value = useMemo(
    () => ({ reportFailure, failedCount }),
    [reportFailure, failedCount]
  );

  return (
    <MediaLoadStatusContext.Provider value={value}>
      {children}
    </MediaLoadStatusContext.Provider>
  );
}

export function useReportMediaLoadFailure(): (() => void) | undefined {
  return useContext(MediaLoadStatusContext)?.reportFailure;
}

export function useMediaLoadFailedCount(): number {
  return useContext(MediaLoadStatusContext)?.failedCount ?? 0;
}
