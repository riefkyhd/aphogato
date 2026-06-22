"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import type {
  CloudinaryAccountPublic,
  CloudinaryAccountUsagePublic,
} from "@/lib/cloudinary/types";
import {
  formatMetricPercent,
  usageLevelBorderClass,
  usageLevelClass,
} from "@/lib/cloudinary/display";
import { cn } from "@/lib/utils";

function usageCalloutClass(level: CloudinaryAccountUsagePublic["level"]): string {
  if (level === "critical") {
    return "border-status-cancelled/40 bg-status-cancelled/10 text-text-primary";
  }
  if (level === "warning") {
    return "border-status-editing/30 bg-status-editing/10 text-text-primary";
  }
  return "border-border bg-bg-primary/40 text-text-secondary";
}

export function ShareGalleryLinkDialog({
  open,
  photoCount,
  account,
  usage,
  loading,
  onClose,
  onCopy,
}: {
  open: boolean;
  photoCount: number;
  account: CloudinaryAccountPublic | null;
  usage: CloudinaryAccountUsagePublic | null;
  loading?: boolean;
  onClose: () => void;
  onCopy: () => void;
}) {
  const copyRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    copyRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const bandwidth = usage
    ? formatMetricPercent("Bandwidth", usage.bandwidth)
    : null;
  const transforms = usage
    ? formatMetricPercent("Transforms", usage.transformations)
    : null;
  const storage = usage ? formatMetricPercent("Storage", usage.storage) : null;
  const metricParts = [bandwidth, transforms, storage].filter(
    (part): part is string => Boolean(part)
  );

  const showUsageWarning =
    usage?.level === "warning" || usage?.level === "critical";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId="share-gallery-link-title"
      maxWidthClassName="max-w-lg"
    >
      <h2
        id="share-gallery-link-title"
        className="text-lg font-light tracking-[0.05em] uppercase text-text-primary"
      >
        Share gallery link
      </h2>

      <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
        {photoCount.toLocaleString()} photo{photoCount === 1 ? "" : "s"} will
        be delivered from{" "}
        <span className="text-text-primary">
          {account?.label ?? "this project's Cloudinary account"}
        </span>
        {account ? (
          <>
            {" "}
            (<code className="text-[12px]">{account.cloudName}</code>)
          </>
        ) : null}
        . When your client opens the link, browsing uses bandwidth and
        transforms on that account.
      </p>

      {loading ? (
        <p className="mt-4 text-[13px] text-text-muted">Loading usage…</p>
      ) : usage?.error ? (
        <p className="mt-4 text-[13px] text-status-cancelled">{usage.error}</p>
      ) : usage && metricParts.length > 0 ? (
        <div
          className={cn(
            "mt-4 border px-4 py-3 text-[13px] leading-relaxed",
            usageLevelBorderClass(usage.level)
          )}
        >
          <p className={cn("font-normal", usageLevelClass(usage.level))}>
            {usage.headline}
          </p>
          <p className="mt-1.5 text-[12px] text-text-secondary">
            {metricParts.join(" · ")} · rolling 30-day window
          </p>
        </div>
      ) : null}

      {showUsageWarning ? (
        <p
          className={cn(
            "mt-4 border px-4 py-3 text-[13px] leading-relaxed",
            usageCalloutClass(usage?.level ?? "unknown")
          )}
        >
          {usage?.level === "critical"
            ? "This account is nearly full. Consider switching the default account in Settings or upgrading the plan before sharing a large gallery."
            : "This account is getting full. Client browsing will add more bandwidth and transform usage."}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Link
          href="/dashboard/settings"
          className="btn-secondary inline-flex items-center justify-center gap-2 w-full sm:w-auto !text-[11px] !min-h-9 !px-3 !py-2"
        >
          Open Settings
        </Link>
        <Button
          ref={copyRef}
          type="button"
          onClick={onCopy}
          className="w-full sm:w-auto"
        >
          Copy link
        </Button>
      </div>
    </ModalShell>
  );
}
