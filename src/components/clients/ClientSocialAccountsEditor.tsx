"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  CLIENT_SOCIAL_LABELS,
  CLIENT_SOCIAL_PLATFORMS,
} from "@/lib/clients/socialAccounts";
import type { ClientSocialAccount, ClientSocialPlatform } from "@/lib/types";
import { cn } from "@/lib/utils";

function PlatformPicker({
  value,
  usedPlatforms,
  onChange,
}: {
  value: ClientSocialPlatform;
  usedPlatforms: Set<ClientSocialPlatform>;
  onChange: (platform: ClientSocialPlatform) => void;
}) {
  return (
    <div
      className="inline-flex w-full sm:w-auto shrink-0 rounded-sm border border-border overflow-hidden"
      role="group"
      aria-label="Social platform"
    >
      {CLIENT_SOCIAL_PLATFORMS.map((platform) => {
        const active = value === platform;
        const disabled = usedPlatforms.has(platform) && !active;
        return (
          <button
            key={platform}
            type="button"
            disabled={disabled}
            onClick={() => onChange(platform)}
            className={cn(
              "flex-1 sm:flex-none px-3 py-2 text-[12px] whitespace-nowrap transition-colors",
              active
                ? "bg-bg-elevated text-text-primary"
                : "bg-bg-secondary text-text-muted hover:text-text-secondary",
              disabled && "opacity-40 cursor-not-allowed hover:text-text-muted"
            )}
          >
            {CLIENT_SOCIAL_LABELS[platform]}
          </button>
        );
      })}
    </div>
  );
}

export function ClientSocialAccountsEditor({
  accounts,
  onChange,
}: {
  accounts: ClientSocialAccount[];
  onChange: (accounts: ClientSocialAccount[]) => void;
}) {
  const usedPlatforms = new Set(accounts.map((a) => a.platform));
  const availablePlatform = CLIENT_SOCIAL_PLATFORMS.find(
    (p) => !usedPlatforms.has(p)
  );

  function updateAt(index: number, patch: Partial<ClientSocialAccount>) {
    onChange(
      accounts.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function removeAt(index: number) {
    onChange(accounts.filter((_, i) => i !== index));
  }

  function addAccount() {
    if (!availablePlatform) return;
    onChange([...accounts, { platform: availablePlatform, username: "" }]);
  }

  return (
    <div className="space-y-2">
      <Label>Social accounts</Label>
      {accounts.length === 0 ? (
        <p className="text-[12px] text-text-muted">
          Add Instagram or Threads usernames — links open their profile.
        </p>
      ) : (
        <ul className="space-y-3">
          {accounts.map((account, index) => (
            <li
              key={`${account.platform}-${index}`}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <PlatformPicker
                value={account.platform}
                usedPlatforms={usedPlatforms}
                onChange={(platform) => updateAt(index, { platform })}
              />
              <Input
                value={account.username}
                onChange={(e) => updateAt(index, { username: e.target.value })}
                placeholder="@username"
                className="min-w-0 flex-1"
                aria-label={`${CLIENT_SOCIAL_LABELS[account.platform]} username`}
              />
              <Tooltip label="Remove social account">
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="self-end sm:self-auto p-2 text-text-muted hover:text-text-primary"
                  aria-label="Remove social account"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="secondary"
        className="!text-[11px] !px-3 !py-2"
        disabled={!availablePlatform}
        onClick={addAccount}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Add social
      </Button>
    </div>
  );
}
