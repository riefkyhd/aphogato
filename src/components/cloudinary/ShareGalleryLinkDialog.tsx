"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import {
  CLOUDINARY_DISABLED_MESSAGE,
  isCloudinaryAccountDisabled,
  MEDIA_UNAVAILABLE_CELL_LABEL,
} from "@/lib/cloudinary/accountStatus";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";
import { masonryImageUrl } from "@/lib/mediaUrls";
import type { StorageProvider } from "@/lib/storage/provider";
import type { FaceSearchStatus } from "@/lib/faces/types";

function ShareCoverPreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="mt-4 overflow-hidden border border-border bg-bg-primary/40">
      {failed ? (
        <div className="flex h-40 items-center justify-center bg-bg-elevated px-4">
          <p className="text-center text-[11px] uppercase tracking-label text-text-muted">
            {MEDIA_UNAVAILABLE_CELL_LABEL}
          </p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={masonryImageUrl(src, 640, 75)}
          alt=""
          className="block w-full max-h-40 object-cover"
          onError={() => setFailed(true)}
        />
      )}
      <p className="px-4 py-2 text-[11px] text-text-muted leading-relaxed border-t border-border">
        This cover appears in link previews when you share the gallery with your
        client.
      </p>
    </div>
  );
}

function faceSearchShareLine(faceSearch: FaceSearchStatus): string | null {
  if (!faceSearch.enabled) return null;
  if (faceSearch.status === "ready") {
    return "Face search: on — clients can filter photos by tapping their face.";
  }
  if (faceSearch.status === "partial") {
    return "Face search: indexing incomplete — clients may see limited results.";
  }
  return "Face search: on — not indexed yet; upload photos to enable client filtering.";
}

function usageCalloutClass(level: CloudinaryAccountUsagePublic["level"]): string {
  if (level === "critical" || level === "disabled") {
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
  coverImageUrl,
  account,
  usage,
  loading,
  faceSearch,
  faceSearchLoading,
  storageProvider = "cloudinary",
  onClose,
  onCopy,
}: {
  open: boolean;
  photoCount: number;
  coverImageUrl?: string | null;
  account: CloudinaryAccountPublic | null;
  usage: CloudinaryAccountUsagePublic | null;
  loading?: boolean;
  faceSearch?: FaceSearchStatus | null;
  faceSearchLoading?: boolean;
  storageProvider?: StorageProvider;
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

  const isImageKit = storageProvider === "imagekit";
  const isGDrive = storageProvider === "gdrive";
  const showUsageWarning =
    !isImageKit &&
    !isGDrive &&
    !isCloudinaryAccountDisabled(usage) &&
    (usage?.level === "warning" || usage?.level === "critical");

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

      {coverImageUrl ? (
        <ShareCoverPreview src={coverImageUrl} />
      ) : null}

      <p className="mt-3 text-[14px] text-text-secondary leading-relaxed">
        {photoCount.toLocaleString()} photo{photoCount === 1 ? "" : "s"} will
        be delivered from{" "}
        <span className="text-text-primary">
          {isGDrive
            ? "Google Drive"
            : isImageKit
              ? "ImageKit"
              : (account?.label ?? "this project's Cloudinary account")}
        </span>
        {!isImageKit && !isGDrive && account ? (
          <>
            {" "}
            (<code className="text-[12px]">{account.cloudName}</code>)
          </>
        ) : null}
        . When your client opens the link, browsing uses{" "}
        {isGDrive
          ? "your Edge CDN cache and Google Drive storage"
          : isImageKit
            ? "bandwidth on your ImageKit account"
            : "bandwidth and transforms on that account"}.
      </p>

      {faceSearchLoading ? (
        <p className="mt-4 text-[13px] text-text-muted">Loading face search…</p>
      ) : faceSearch ? (
        (() => {
          const line = faceSearchShareLine(faceSearch);
          return line ? (
            <p className="mt-4 text-[13px] text-text-secondary leading-relaxed border border-border bg-bg-primary/40 px-4 py-3">
              {line}
            </p>
          ) : null;
        })()
      ) : null}

      {!isImageKit && !isGDrive && loading ? (
        <p className="mt-4 text-[13px] text-text-muted">Loading usage…</p>
      ) : !isImageKit && !isGDrive && (usage?.error || isCloudinaryAccountDisabled(usage)) ? (
        <div
          className={cn(
            "mt-4 border px-4 py-3 text-[13px] leading-relaxed",
            usageLevelBorderClass("disabled")
          )}
        >
          <p className={usageLevelClass("disabled")}>
            {isCloudinaryAccountDisabled(usage)
              ? "Account disabled"
              : "Cloudinary unavailable"}
          </p>
          <p className="mt-1.5 text-[12px] text-text-secondary">
            {typeof usage?.error === "string" &&
            usage.error.trim().length > 0 &&
            usage.error !== "[object Object]"
              ? usage.error
              : typeof usage?.error === "object" && usage?.error !== null
                ? JSON.stringify(usage.error)
                : CLOUDINARY_DISABLED_MESSAGE}
          </p>
          <p className="mt-2 text-[12px] text-text-secondary">
            Client galleries will show broken photos until this account is
            re-enabled in Cloudinary.
          </p>
        </div>
      ) : !isImageKit && !isGDrive && usage && metricParts.length > 0 ? (
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
        {FEATURES.settings ? (
        <Link
          href="/dashboard/settings"
          className="btn-secondary inline-flex items-center justify-center gap-2 w-full sm:w-auto !text-[11px] !min-h-9 !px-3 !py-2"
        >
          Open Settings
        </Link>
        ) : null}
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
