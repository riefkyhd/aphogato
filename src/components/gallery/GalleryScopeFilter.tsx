"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";

export type GalleryScope = "all" | "selected";

export function GalleryScopeFilter({
  value,
  selectedCount,
  onChange,
  disabled,
}: {
  value: GalleryScope;
  selectedCount: number;
  onChange: (value: GalleryScope) => void;
  disabled?: boolean;
}) {
  const selectedLabel =
    selectedCount > 0 ? `Terpilih (${selectedCount})` : "Terpilih";

  return (
    <SegmentedControl
      value={value}
      disabled={disabled}
      aria-label="Filter gallery photos"
      className="w-full sm:w-auto"
      options={[
        { value: "all", label: "Semua" },
        {
          value: "selected",
          label: selectedLabel,
          disabled: selectedCount === 0 && value !== "selected",
        },
      ]}
      onChange={onChange}
    />
  );
}
