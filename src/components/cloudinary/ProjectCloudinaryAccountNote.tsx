"use client";

import Link from "next/link";
import type {
  CloudinaryAccountPublic,
  CloudinaryAccountUsagePublic,
} from "@/lib/cloudinary/types";
import {
  CLOUDINARY_DISABLED_MESSAGE,
  isCloudinaryAccountDisabled,
} from "@/lib/cloudinary/accountStatus";
import { FEATURES } from "@/lib/features";

export function ProjectCloudinaryAccountNote({
  account,
  usage,
  loading,
  photoCount,
}: {
  account: CloudinaryAccountPublic | null;
  usage: CloudinaryAccountUsagePublic | null;
  loading: boolean;
  photoCount: number;
}) {
  if (loading || !account) return null;

  if (isCloudinaryAccountDisabled(usage)) {
    return (
      <p className="mt-2 text-[12px] text-status-cancelled leading-relaxed max-w-2xl">
        {CLOUDINARY_DISABLED_MESSAGE}{" "}
        {FEATURES.cloudinarySettings && FEATURES.settings ? (
          <Link
            href="/dashboard/settings"
            className="underline underline-offset-2 text-text-secondary hover:text-text-primary"
          >
            Cloudinary settings
          </Link>
        ) : null}
      </p>
    );
  }

  return (
    <p className="mt-2 text-[12px] text-text-muted leading-relaxed max-w-2xl">
      Photos on this project use{" "}
      <span className="text-text-secondary">
        {account.label} ({account.cloudName})
      </span>
      {usage ? <> · {usage.headline}</> : null}.{" "}
      {photoCount > 0
        ? "This account is locked for this project once photos are uploaded."
        : "Pick the account before uploading — it cannot be changed later."}{" "}
      {FEATURES.cloudinarySettings && FEATURES.settings ? (
        <Link
          href="/dashboard/settings"
          className="underline underline-offset-2 text-text-secondary hover:text-text-primary"
        >
          Cloudinary settings
        </Link>
      ) : null}
    </p>
  );
}
