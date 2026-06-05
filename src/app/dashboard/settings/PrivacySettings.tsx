"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { PIN_MAX_LEN, PIN_MIN_LEN } from "@/lib/privacy/constants";

export function PrivacySettings() {
  const { pinEnabled, refreshSettings, lockSession } = usePrivacyLockContext();
  const [loading, setLoading] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    setNewPin("");
    setCurrentPin("");
    setConfirmPin("");
  }, [pinEnabled]);

  async function patchPrivacy(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string; pinEnabled?: boolean };
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update privacy settings");
        return false;
      }
      await refreshSettings();
      lockSession();
      return true;
    } catch {
      toast.error("Failed to update privacy settings");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSetOrChange() {
    if (newPin !== confirmPin) {
      toast.error("New PIN and confirmation do not match");
      return;
    }
    const body: Record<string, unknown> = { pin: newPin };
    if (pinEnabled) body.currentPin = currentPin;
    const ok = await patchPrivacy(body);
    if (!ok) return;
    toast.success(pinEnabled ? "PIN updated" : "PIN enabled");
    setNewPin("");
    setCurrentPin("");
    setConfirmPin("");
  }

  async function handleRemove() {
    const ok = await patchPrivacy({ remove: true, currentPin });
    if (!ok) return;
    toast.success("PIN lock removed");
    setCurrentPin("");
  }

  return (
    <section className="border border-border bg-bg-secondary p-6 max-w-lg mt-6">
      <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
        Privacy PIN
      </h2>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        Optionally lock finance and sensitive actions behind a {PIN_MIN_LEN}–
        {PIN_MAX_LEN} digit PIN. Amounts can still be hidden on the finance page
        with the show/hide toggle without a PIN.
      </p>
      <p className="text-[11px] uppercase tracking-label text-text-muted mb-4">
        Status:{" "}
        <span className="text-text-secondary">
          {pinEnabled ? "PIN lock enabled" : "PIN lock off"}
        </span>
      </p>

      <div className="space-y-4">
        {pinEnabled ? (
          <div>
            <Label htmlFor="privacy-current-pin">Current PIN</Label>
            <Input
              id="privacy-current-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_MAX_LEN}
              value={currentPin}
              disabled={loading}
              onChange={(e) =>
                setCurrentPin(e.target.value.replace(/\D/g, ""))
              }
            />
          </div>
        ) : null}

        <div>
          <Label htmlFor="privacy-new-pin">
            {pinEnabled ? "New PIN" : "PIN"}
          </Label>
          <Input
            id="privacy-new-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_MAX_LEN}
            value={newPin}
            disabled={loading}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div>
          <Label htmlFor="privacy-confirm-pin">Confirm PIN</Label>
          <Input
            id="privacy-confirm-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_MAX_LEN}
            value={confirmPin}
            disabled={loading}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="!text-[11px]"
            loading={loading}
            disabled={loading || newPin.length < PIN_MIN_LEN}
            onClick={() => void handleSetOrChange()}
          >
            {pinEnabled ? "Change PIN" : "Enable PIN lock"}
          </Button>
          {pinEnabled ? (
            <Button
              type="button"
              variant="secondary"
              className="!text-[11px]"
              loading={loading}
              disabled={loading || currentPin.length < PIN_MIN_LEN}
              onClick={() => void handleRemove()}
            >
              Remove PIN
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
