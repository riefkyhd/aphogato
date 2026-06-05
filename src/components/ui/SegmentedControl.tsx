"use client";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
  className,
  size = "default",
  "aria-label": ariaLabel,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "compact";
  "aria-label"?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-sm border border-border overflow-hidden",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled || opt.disabled}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "transition-colors",
            size === "compact"
              ? "px-2.5 py-1 text-[10px] uppercase tracking-label"
              : "px-3 py-2 text-[11px] uppercase tracking-label",
            value === opt.value
              ? "bg-bg-elevated text-text-primary"
              : "bg-bg-secondary text-text-muted hover:text-text-secondary",
            (disabled || opt.disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SegmentedField<T extends string>({
  label,
  ...props
}: {
  label: string;
} & React.ComponentProps<typeof SegmentedControl<T>>) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-label text-text-muted mb-2">
        {label}
      </p>
      <SegmentedControl {...props} />
    </div>
  );
}
