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
  return (
    <SegmentedControl
      value={value}
      disabled={disabled}
      aria-label="Filter gallery photos"
      className="w-full sm:w-auto"
      options={[
        { value: "all", label: "All" },
        {
          value: "selected",
          label: "Selected",
          disabled: selectedCount === 0 && value !== "selected",
        },
      ]}
      onChange={onChange}
    />
  );
}
