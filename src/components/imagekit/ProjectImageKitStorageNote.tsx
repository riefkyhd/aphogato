"use client";

import Link from "next/link";
import { FEATURES } from "@/lib/features";

export function ProjectImageKitStorageNote({
  photoCount,
}: {
  photoCount: number;
}) {
  return (
    <p className="mt-2 text-[12px] text-text-muted leading-relaxed max-w-2xl">
      Photos on this project use{" "}
      <span className="text-text-secondary">ImageKit</span>.{" "}
      {photoCount > 0
        ? "This storage provider is locked for this project once photos are uploaded."
        : "Upload photos to lock this provider for the project."}{" "}
      {FEATURES.imagekitStorage && FEATURES.settings ? (
        <Link
          href="/dashboard/settings"
          className="underline underline-offset-2 text-text-secondary hover:text-text-primary"
        >
          Storage settings
        </Link>
      ) : null}
    </p>
  );
}
