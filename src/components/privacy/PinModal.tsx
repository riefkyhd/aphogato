"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { PIN_MAX_LEN } from "@/lib/privacy/constants";

export function PinModal({
  open,
  title = "Enter PIN",
  description = "Enter your privacy PIN to continue.",
  error,
  loading = false,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title?: string;
  description?: string;
  error?: string | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void | Promise<void>;
}) {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setPin("");
      return;
    }
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-sm border border-border bg-bg-elevated p-6 shadow-lg">
        <h2
          id="pin-modal-title"
          className="text-lg font-light tracking-[0.05em] uppercase text-text-primary"
        >
          {title}
        </h2>
        <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
          {description}
        </p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin.trim()) void onSubmit(pin.trim());
          }}
        >
          <div>
            <Label htmlFor="privacy-pin-input">PIN</Label>
            <Input
              ref={inputRef}
              id="privacy-pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_MAX_LEN}
              value={pin}
              disabled={loading}
              placeholder="••••"
              className="tracking-[0.3em] text-center"
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {error ? (
            <p className="text-[12px] text-status-editing" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={loading}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={loading}
              disabled={loading || pin.length < 4}
            >
              Unlock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
