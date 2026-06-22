"use client";

import Link from "next/link";
import type {
  CloudinaryAccountPublic,
  CloudinaryAccountUsagePublic,
} from "@/lib/cloudinary/types";
import {
  usageLevelBorderClass,
  usageLevelClass,
  usagePeakMetricShort,
} from "@/lib/cloudinary/display";
import { cn } from "@/lib/utils";

export function ProjectCloudinaryUsageBadge({
  account,
  usage,
  loading,
}: {
  account: CloudinaryAccountPublic | null;
  usage: CloudinaryAccountUsagePublic | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center border border-border bg-bg-secondary/40 px-2 py-0.5 text-[10px] uppercase tracking-label text-text-muted">
        Cloudinary…
      </span>
    );
  }

  if (!account) return null;

  const peakMetric = usage ? usagePeakMetricShort(usage) : null;
  const level = usage?.level ?? "unknown";

  return (
    <Link
      href="/dashboard/settings"
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] uppercase tracking-label transition-opacity hover:opacity-80",
        usageLevelBorderClass(level)
      )}
      title={
        usage?.headline
          ? `Cloudinary ${account.cloudName} · ${usage.headline}`
          : `Cloudinary ${account.cloudName}`
      }
    >
      <span className="text-text-muted">Cloudinary</span>
      <span className="text-text-secondary">·</span>
      <span className="text-text-primary truncate max-w-[8rem]">
        {account.label}
      </span>
      {peakMetric ? (
        <>
          <span className="text-text-secondary">·</span>
          <span className={cn("tabular-nums", usageLevelClass(level))}>
            {peakMetric}
          </span>
        </>
      ) : null}
    </Link>
  );
}
