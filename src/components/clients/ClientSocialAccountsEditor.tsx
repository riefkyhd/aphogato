"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  CLIENT_SOCIAL_LABELS,
  CLIENT_SOCIAL_PLATFORMS,
} from "@/lib/clients/socialAccounts";
import type { ClientSocialAccount, ClientSocialPlatform } from "@/lib/types";

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
    <SegmentedControl
      value={value}
      aria-label="Social platform"
      className="w-full sm:w-auto shrink-0 [&_button]:flex-1 [&_button]:sm:flex-none [&_button]:whitespace-nowrap [&_button]:normal-case [&_button]:text-[12px] [&_button]:tracking-normal"
      options={CLIENT_SOCIAL_PLATFORMS.map((platform) => ({
        value: platform,
        label: CLIENT_SOCIAL_LABELS[platform],
        disabled: usedPlatforms.has(platform) && value !== platform,
      }))}
      onChange={onChange}
    />
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
        size="sm"
        disabled={!availablePlatform}
        onClick={addAccount}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Add social
      </Button>
    </div>
  );
}
