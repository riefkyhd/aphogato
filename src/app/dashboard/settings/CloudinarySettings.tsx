"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import type {
  CloudinaryAccountPublic,
  CloudinaryAccountUsagePublic,
  CloudinaryUsageLevel,
} from "@/lib/cloudinary/types";
import { cn } from "@/lib/utils";

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

function usageLevelClass(level: CloudinaryUsageLevel): string {
  switch (level) {
    case "critical":
      return "text-status-cancelled";
    case "warning":
      return "text-status-editing";
    case "ok":
      return "text-status-delivered";
    default:
      return "text-text-muted";
  }
}

function usageBarClass(level: CloudinaryUsageLevel): string {
  switch (level) {
    case "critical":
      return "bg-status-cancelled";
    case "warning":
      return "bg-status-editing";
    case "ok":
      return "bg-status-delivered";
    default:
      return "bg-border";
  }
}

function usagePercent(entry: CloudinaryAccountUsagePublic): number | null {
  const values = [
    entry.storage.usedPercent,
    entry.bandwidth.usedPercent,
    entry.transformations.usedPercent,
  ].filter((value): value is number => value !== null);

  return values.length > 0 ? Math.max(...values) : null;
}

function AccountUsageCard({
  account,
  usage,
  isDefault,
}: {
  account: CloudinaryAccountPublic;
  usage: CloudinaryAccountUsagePublic | undefined;
  isDefault: boolean;
}) {
  const percent = usage ? usagePercent(usage) : null;

  return (
    <div className="border border-border bg-bg-primary/40 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-text-primary truncate">
            {account.label}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5 truncate">
            {account.cloudName}
            {usage?.plan ? ` · ${usage.plan}` : ""}
          </p>
        </div>
        {isDefault ? (
          <span className="shrink-0 text-[10px] uppercase tracking-label text-text-muted">
            Default
          </span>
        ) : null}
      </div>

      {usage?.error ? (
        <p className="text-[12px] text-status-cancelled mt-3">{usage.error}</p>
      ) : usage ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className={cn(usageLevelClass(usage.level))}>
              {usage.headline}
            </span>
            {percent !== null ? (
              <span className="text-text-muted tabular-nums">{percent}%</span>
            ) : null}
          </div>
          {percent !== null ? (
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className={cn("h-full rounded-full", usageBarClass(usage.level))}
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
          ) : null}
          {usage.storageLabel ? (
            <p className="text-[11px] text-text-muted">
              Storage used: {usage.storageLabel}
              {usage.resources !== null
                ? ` · ${usage.resources.toLocaleString()} assets`
                : ""}
            </p>
          ) : null}
          {usage.lastUpdated ? (
            <p className="text-[11px] text-text-muted">
              Updated {usage.lastUpdated}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-[12px] text-text-muted mt-3">Usage unavailable</p>
      )}
    </div>
  );
}

export function CloudinarySettings() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<CloudinaryAccountPublic[]>([]);
  const [usage, setUsage] = useState<CloudinaryAccountUsagePublic[]>([]);
  const [defaultAccountId, setDefaultAccountId] = useState("default");
  const [savedAccountId, setSavedAccountId] = useState("default");

  const loadSettings = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = refresh
        ? "/api/settings/cloudinary?refresh=1"
        : "/api/settings/cloudinary";
      const res = await fetch(url);
      const json = (await res.json()) as CloudinarySettingsResponse & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load Cloudinary settings");
      }
      setAccounts(json.accounts);
      setUsage(json.usage);
      setDefaultAccountId(json.defaultAccountId);
      setSavedAccountId(json.defaultAccountId);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load Cloudinary settings"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleSave() {
    if (defaultAccountId === savedAccountId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/cloudinary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultAccountId }),
      });
      const json = (await res.json()) as CloudinarySettingsResponse & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save Cloudinary settings");
      }
      setAccounts(json.accounts);
      setUsage(json.usage);
      setDefaultAccountId(json.defaultAccountId);
      setSavedAccountId(json.defaultAccountId);
      toast.success("Default Cloudinary account updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save Cloudinary settings"
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedAccount = accounts.find((account) => account.id === defaultAccountId);
  const selectedUsage = usage.find((entry) => entry.accountId === defaultAccountId);

  return (
    <section className="border border-border bg-bg-secondary p-6 mt-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted">
            Cloudinary
          </h2>
          <p className="text-[13px] text-text-secondary leading-relaxed mt-2">
            Choose which Cloudinary account new projects use. Usage is cached for
            30 minutes to stay within Admin API limits.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={refreshing}
          disabled={loading || refreshing}
          onClick={() => void loadSettings(true)}
          aria-label="Refresh Cloudinary usage"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-[13px] text-text-secondary">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <p className="text-[13px] text-status-cancelled">
          No Cloudinary accounts are configured in the environment.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountUsageCard
                key={account.id}
                account={account}
                usage={usage.find((entry) => entry.accountId === account.id)}
                isDefault={account.id === savedAccountId}
              />
            ))}
          </div>

          <div>
            <Label htmlFor="cloudinary-default-account">
              Default account for new projects
            </Label>
            <select
              id="cloudinary-default-account"
              value={defaultAccountId}
              onChange={(event) => setDefaultAccountId(event.target.value)}
              className="mt-2 w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-[13px] text-text-primary"
            >
              {accounts.map((account) => {
                const accountUsage = usage.find(
                  (entry) => entry.accountId === account.id
                );
                const suffix = accountUsage ? ` — ${accountUsage.headline}` : "";
                return (
                  <option key={account.id} value={account.id}>
                    {account.label} ({account.cloudName}){suffix}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedAccount ? (
            <p className="text-[12px] text-text-secondary">
              New uploads will go to{" "}
              <code className="text-[11px]">{selectedAccount.cloudName}</code>
              {selectedUsage ? ` · ${selectedUsage.headline}` : ""}.
            </p>
          ) : null}

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={saving || defaultAccountId === savedAccountId}
          >
            Save Cloudinary default
          </Button>
        </div>
      )}
    </section>
  );
}
