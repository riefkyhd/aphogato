"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  CloudinaryAccountUsagePublic,
  CloudinaryUsageLevel,
} from "@/lib/cloudinary/types";
import { cn } from "@/lib/utils";

type CloudinarySettingsResponse = {
  defaultAccountId: string;
  usage: CloudinaryAccountUsagePublic[];
  newProjectHint: {
    defaultUsage: CloudinaryAccountUsagePublic | null;
    suggestedAccountId: string | null;
    message: string | null;
  };
};

function bannerClass(level: CloudinaryUsageLevel | undefined): string {
  if (level === "critical") {
    return "border-status-cancelled/40 bg-status-cancelled/10 text-text-primary";
  }
  return "border-status-editing/30 bg-status-editing/10 text-text-primary";
}

export function NewProjectCloudinaryNotice() {
  const [hint, setHint] = useState<CloudinarySettingsResponse["newProjectHint"] | null>(
    null
  );
  const [defaultUsage, setDefaultUsage] =
    useState<CloudinaryAccountUsagePublic | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/settings/cloudinary");
        if (!res.ok) return;
        const json = (await res.json()) as CloudinarySettingsResponse;
        if (cancelled) return;
        setHint(json.newProjectHint);
        setDefaultUsage(json.newProjectHint.defaultUsage);
      } catch {
        // Non-blocking: project creation still works without usage data.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hint?.message) return null;

  return (
    <div
      className={cn(
        "mb-6 border px-4 py-3 text-[13px] leading-relaxed",
        bannerClass(defaultUsage?.level)
      )}
    >
      <p>{hint.message}</p>
      <p className="mt-2 text-[12px] text-text-secondary">
        <Link href="/dashboard/settings" className="underline underline-offset-2">
          Open Settings
        </Link>{" "}
        to change the default Cloudinary account.
      </p>
    </div>
  );
}
