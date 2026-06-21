"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import type { CloudinaryAccountPublic } from "@/lib/cloudinary/types";

type CloudinarySettingsResponse = {
  accounts: CloudinaryAccountPublic[];
  defaultAccountId: string;
};

export function CloudinarySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<CloudinaryAccountPublic[]>([]);
  const [defaultAccountId, setDefaultAccountId] = useState("default");
  const [savedAccountId, setSavedAccountId] = useState("default");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings/cloudinary");
        const json = (await res.json()) as CloudinarySettingsResponse & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to load Cloudinary settings");
        }
        if (cancelled) return;
        setAccounts(json.accounts);
        setDefaultAccountId(json.defaultAccountId);
        setSavedAccountId(json.defaultAccountId);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to load Cloudinary settings"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <section className="border border-border bg-bg-secondary p-6 mt-6">
      <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
        Cloudinary
      </h2>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
        Choose which Cloudinary account new projects use. Existing projects keep
        the account they were created with.
      </p>

      {loading ? (
        <p className="text-[13px] text-text-secondary">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <p className="text-[13px] text-status-cancelled">
          No Cloudinary accounts are configured in the environment.
        </p>
      ) : (
        <div className="space-y-4">
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
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label} ({account.cloudName})
                </option>
              ))}
            </select>
          </div>

          {selectedAccount ? (
            <p className="text-[12px] text-text-secondary">
              New uploads will go to{" "}
              <code className="text-[11px]">{selectedAccount.cloudName}</code>.
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
