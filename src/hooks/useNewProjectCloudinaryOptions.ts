"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CloudinaryAccountPublic,
  CloudinaryAccountUsagePublic,
} from "@/lib/cloudinary/types";

type CloudinarySettingsResponse = {
  accounts: CloudinaryAccountPublic[];
  defaultAccountId: string;
  usage: CloudinaryAccountUsagePublic[];
  newProjectHint: {
    defaultUsage: CloudinaryAccountUsagePublic | null;
    suggestedAccountId: string | null;
    message: string | null;
  };
};

export function useNewProjectCloudinaryOptions() {
  const [accounts, setAccounts] = useState<CloudinaryAccountPublic[]>([]);
  const [usage, setUsage] = useState<CloudinaryAccountUsagePublic[]>([]);
  const [defaultAccountId, setDefaultAccountId] = useState("");
  const [hint, setHint] =
    useState<CloudinarySettingsResponse["newProjectHint"] | null>(null);
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
        setAccounts(json.accounts);
        setUsage(json.usage);
        setDefaultAccountId(json.defaultAccountId);
        setHint(json.newProjectHint);
      } catch {
        // Non-blocking: project creation still works without usage data.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestedAccountId = hint?.suggestedAccountId ?? null;

  const initialAccountId = useMemo(() => {
    if (suggestedAccountId) return suggestedAccountId;
    if (defaultAccountId) return defaultAccountId;
    return accounts[0]?.id ?? "";
  }, [suggestedAccountId, defaultAccountId, accounts]);

  return {
    accounts,
    usage,
    defaultAccountId,
    suggestedAccountId,
    initialAccountId,
    hint,
    loading,
  };
}
