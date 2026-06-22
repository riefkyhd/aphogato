"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/Label";
import type { CloudinaryUsageLevel } from "@/lib/cloudinary/types";
import { usageLevelClass } from "@/lib/cloudinary/display";
import { useNewProjectCloudinaryOptions } from "@/hooks/useNewProjectCloudinaryOptions";
import { cn } from "@/lib/utils";

function bannerClass(level: CloudinaryUsageLevel | undefined): string {
  if (level === "critical") {
    return "border-status-cancelled/40 bg-status-cancelled/10 text-text-primary";
  }
  if (level === "warning") {
    return "border-status-editing/30 bg-status-editing/10 text-text-primary";
  }
  return "border-border bg-bg-secondary/40 text-text-secondary";
}

const selectClass =
  "mt-2 w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-[13px] text-text-primary";

export function NewProjectCloudinaryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (accountId: string) => void;
}) {
  const {
    accounts,
    usage,
    defaultAccountId,
    suggestedAccountId,
    initialAccountId,
    hint,
    loading,
  } = useNewProjectCloudinaryOptions();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loading || initialized || !initialAccountId) return;
    onChange(initialAccountId);
    setInitialized(true);
  }, [loading, initialized, initialAccountId, onChange]);

  const selectedUsage = usage.find((entry) => entry.accountId === value);
  const selectedAccount = accounts.find((account) => account.id === value);
  const showSuggestionNote =
    suggestedAccountId &&
    value === suggestedAccountId &&
    suggestedAccountId !== defaultAccountId;

  if (loading) {
    return (
      <div>
        <Label>Cloudinary account</Label>
        <p className="mt-2 text-[12px] text-text-muted">Loading accounts…</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div>
        <Label>Cloudinary account</Label>
        <p className="mt-2 text-[12px] text-status-cancelled">
          No Cloudinary accounts are configured.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cloudinary-account">Cloudinary account</Label>
        {accounts.length > 1 ? (
          <select
            id="cloudinary-account"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={selectClass}
          >
            {accounts.map((account) => {
              const accountUsage = usage.find(
                (entry) => entry.accountId === account.id
              );
              const suffix = accountUsage ? ` — ${accountUsage.headline}` : "";
              const suggested =
                account.id === suggestedAccountId ? " · suggested" : "";
              return (
                <option key={account.id} value={account.id}>
                  {account.label} ({account.cloudName}){suffix}
                  {suggested}
                </option>
              );
            })}
          </select>
        ) : selectedAccount ? (
          <p className="mt-2 text-[13px] text-text-secondary">
            {selectedAccount.label}{" "}
            <code className="text-[11px]">{selectedAccount.cloudName}</code>
            {selectedUsage ? (
              <>
                {" "}
                ·{" "}
                <span className={usageLevelClass(selectedUsage.level)}>
                  {selectedUsage.headline}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
        <p className="mt-2 text-[12px] text-text-muted leading-relaxed">
          Uploads and client gallery delivery use this account. Choose before
          adding photos — it cannot be changed later without manual migration.
        </p>
        {showSuggestionNote ? (
          <p className="mt-2 text-[12px] text-status-delivered leading-relaxed">
            Suggested account with the most headroom based on current usage.
          </p>
        ) : null}
      </div>

      {hint?.message ? (
        <div
          className={cn(
            "border px-4 py-3 text-[13px] leading-relaxed",
            bannerClass(hint.defaultUsage?.level)
          )}
        >
          <p>{hint.message}</p>
          <p className="mt-2 text-[12px] text-text-secondary">
            <Link
              href="/dashboard/settings"
              className="underline underline-offset-2"
            >
              Open Settings
            </Link>{" "}
            to change the default Cloudinary account for future projects.
          </p>
        </div>
      ) : null}
    </div>
  );
}
