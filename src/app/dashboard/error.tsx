"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashboardMain } from "@/components/layout/DashboardShell";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[dashboard/error]", error);
    }
  }, [error]);

  return (
    <DashboardMain>
      <div className="max-w-[420px] mx-auto text-center py-10">
        <AlertTriangle
          className="h-8 w-8 mx-auto text-status-editing mb-4"
          aria-hidden
        />
        <h1 className="text-lg font-light tracking-[0.05em] uppercase">
          Couldn&apos;t load this page
        </h1>
        <p className="mt-3 text-[13px] text-text-secondary leading-relaxed">
          Something went wrong while fetching data. Try again, or head back to
          Home.
        </p>
        {error.digest ? (
          <p className="mt-3 text-[11px] uppercase tracking-label text-text-muted">
            Ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full">
            Try again
          </Button>
          <Link
            href="/dashboard"
            className="text-[12px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </DashboardMain>
  );
}
