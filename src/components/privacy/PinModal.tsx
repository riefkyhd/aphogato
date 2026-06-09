"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormActions } from "@/components/ui/FormActions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ModalShell } from "@/components/ui/ModalShell";
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
  }, [open]);

  return (
    <ModalShell
      open={open}
      onClose={() => !loading && onClose()}
      titleId="pin-modal-title"
      zClassName="z-[120]"
      maxWidthClassName="max-w-sm"
    >
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
        <FormActions className="sm:flex-row sm:[&_button]:flex-1">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || pin.length < 4}
          >
            Unlock
          </Button>
        </FormActions>
      </form>
    </ModalShell>
  );
}
