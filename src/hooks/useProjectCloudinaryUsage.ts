"use client";

import { useEffect, useState } from "react";
import type { CloudinaryAccountPublic } from "@/lib/cloudinary/types";
import type { CloudinaryAccountUsagePublic } from "@/lib/cloudinary/types";

type CloudinarySettingsResponse = {
  accounts: CloudinaryAccountPublic[];
  usage: CloudinaryAccountUsagePublic[];
};

export function useProjectCloudinaryUsage(cloudinaryAccountId: string) {
  const [account, setAccount] = useState<CloudinaryAccountPublic | null>(null);
  const [usage, setUsage] = useState<CloudinaryAccountUsagePublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings/cloudinary");
        if (!res.ok) return;
        const json = (await res.json()) as CloudinarySettingsResponse;
        if (cancelled) return;

        const matchedAccount =
          json.accounts.find((entry) => entry.id === cloudinaryAccountId) ??
          null;
        const matchedUsage =
          json.usage.find((entry) => entry.accountId === cloudinaryAccountId) ??
          null;

        setAccount(matchedAccount);
        setUsage(matchedUsage);
      } catch {
        // Non-blocking: project page works without usage data.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [cloudinaryAccountId]);

  return { account, usage, loading };
}
