"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserPreferencesContext } from "@/components/preferences/UserPreferencesProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  MAX_MAX_PHOTO_SELECTION,
  MIN_MAX_PHOTO_SELECTION,
} from "@/lib/photoSelectionLimit";
import type {
  CalendarViewMode,
  PhotoViewMode,
  PinSessionTimeoutMinutes,
} from "@/lib/preferences/types";
import { cn } from "@/lib/utils";

function SegmentedOption<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-label text-text-muted mb-2">
        {label}
      </p>
      <div className="inline-flex rounded border border-border overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-2 text-[11px] uppercase tracking-label transition-colors",
              value === opt.value
                ? "bg-text-primary text-bg-primary"
                : "bg-bg-secondary text-text-secondary hover:text-text-primary",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PreferencesSettings() {
  const { preferences, saving, updatePreferences } = useUserPreferencesContext();
  const [maxSelectionInput, setMaxSelectionInput] = useState(
    String(preferences.defaultMaxPhotoSelection)
  );

  useEffect(() => {
    setMaxSelectionInput(String(preferences.defaultMaxPhotoSelection));
  }, [preferences.defaultMaxPhotoSelection]);

  async function savePatch(
    patch: Parameters<typeof updatePreferences>[0],
    successMessage: string
  ) {
    try {
      await updatePreferences(patch);
      toast.success(successMessage);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save preference"
      );
    }
  }

  async function handleMaxSelectionBlur() {
    const n = Number(maxSelectionInput);
    if (
      !Number.isInteger(n) ||
      n < MIN_MAX_PHOTO_SELECTION ||
      n > MAX_MAX_PHOTO_SELECTION
    ) {
      setMaxSelectionInput(String(preferences.defaultMaxPhotoSelection));
      toast.error(
        `Enter a whole number between ${MIN_MAX_PHOTO_SELECTION} and ${MAX_MAX_PHOTO_SELECTION}`
      );
      return;
    }
    if (n === preferences.defaultMaxPhotoSelection) return;
    await savePatch(
      { defaultMaxPhotoSelection: n },
      "Default photo selection limit updated"
    );
  }

  return (
    <>
      <section className="border border-border bg-bg-secondary p-6 max-w-lg mt-6">
        <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
          Workflow defaults
        </h2>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
          Defaults for new projects and gallery views. Per-project overrides are
          still remembered in your browser until you change them on that project.
        </p>
        <div className="space-y-5">
          <SegmentedOption<PhotoViewMode>
            label="Photo gallery view"
            value={preferences.defaultPhotoView}
            options={[
              { value: "grid", label: "Grid" },
              { value: "list", label: "List" },
            ]}
            disabled={saving}
            onChange={(value) =>
              void savePatch({ defaultPhotoView: value }, "Default photo view updated")
            }
          />
          <SegmentedOption
            label="Photo filter"
            value={preferences.defaultPhotoSelectedFirst ? "selected" : "all"}
            options={[
              { value: "all", label: "All photos" },
              { value: "selected", label: "Selected first" },
            ]}
            disabled={saving}
            onChange={(value) =>
              void savePatch(
                { defaultPhotoSelectedFirst: value === "selected" },
                "Default photo filter updated"
              )
            }
          />
          <div>
            <Label htmlFor="default-max-selection">
              Default max client selection
            </Label>
            <Input
              id="default-max-selection"
              type="number"
              min={MIN_MAX_PHOTO_SELECTION}
              max={MAX_MAX_PHOTO_SELECTION}
              value={maxSelectionInput}
              disabled={saving}
              onChange={(e) => setMaxSelectionInput(e.target.value)}
              onBlur={() => void handleMaxSelectionBlur()}
              className="mt-2 max-w-[8rem]"
            />
            <p className="mt-2 text-[12px] text-text-muted leading-relaxed">
              Pre-fills the limit when you create a new project.
            </p>
          </div>
          <SegmentedOption<CalendarViewMode>
            label="Calendar view"
            value={preferences.defaultCalendarView}
            options={[
              { value: "month", label: "Month" },
              { value: "list", label: "List" },
            ]}
            disabled={saving}
            onChange={(value) =>
              void savePatch(
                { defaultCalendarView: value },
                "Default calendar view updated"
              )
            }
          />
        </div>
      </section>

      <section className="border border-border bg-bg-secondary p-6 max-w-lg mt-6">
        <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
          Finance &amp; privacy defaults
        </h2>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-5">
          Synced to your account. Session-only unlock state still clears when you
          lock or after the timeout below.
        </p>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-text-primary">Show amounts by default</p>
              <p className="text-[12px] text-text-muted mt-1">
                When off, finance figures start masked until you reveal them.
              </p>
            </div>
            <Button
              type="button"
              variant={preferences.moneyVisibleByDefault ? "secondary" : "primary"}
              className="!text-[11px] shrink-0"
              disabled={saving}
              onClick={() =>
                void savePatch(
                  {
                    moneyVisibleByDefault: !preferences.moneyVisibleByDefault,
                  },
                  preferences.moneyVisibleByDefault
                    ? "Amounts will start hidden"
                    : "Amounts will start visible"
                )
              }
            >
              {preferences.moneyVisibleByDefault ? "On" : "Off"}
            </Button>
          </div>
          <SegmentedOption
            label="PIN unlock timeout"
            value={String(preferences.pinSessionTimeoutMinutes)}
            options={[
              { value: "15", label: "15 min" },
              { value: "30", label: "30 min" },
              { value: "60", label: "60 min" },
            ]}
            disabled={saving}
            onChange={(value) =>
              void savePatch(
                {
                  pinSessionTimeoutMinutes: Number(
                    value
                  ) as PinSessionTimeoutMinutes,
                },
                "PIN session timeout updated"
              )
            }
          />
        </div>
      </section>
    </>
  );
}
