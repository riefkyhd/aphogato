"use client";

import { useRef } from "react";
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
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  function focusEnabled(nextIndex: number, dir: 1 | -1) {
    const len = options.length;
    for (let step = 0; step < len; step++) {
      const idx = ((nextIndex + step * dir) % len + len) % len;
      const opt = options[idx];
      if (!opt.disabled) {
        buttonsRef.current[idx]?.focus();
        onChange(opt.value);
        return;
      }
    }
  }

  function handleKey(index: number, e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusEnabled(index + 1, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusEnabled(index - 1, -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusEnabled(0, 1);
    } else if (e.key === "End") {
      e.preventDefault();
      focusEnabled(options.length - 1, -1);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-sm border border-border overflow-hidden",
        className
      )}
    >
      {options.map((opt, index) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={disabled || opt.disabled}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKey(index, e)}
            className={cn(
              "transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-text-primary",
              size === "compact"
                ? "px-2.5 py-1 text-[10px] uppercase tracking-label"
                : "px-3 py-2 text-[11px] uppercase tracking-label",
              active
                ? "bg-bg-elevated text-text-primary"
                : "bg-bg-secondary text-text-muted hover:text-text-secondary",
              (disabled || opt.disabled) && "opacity-50 cursor-not-allowed"
            )}
          >
            {opt.label}
          </button>
        );
      })}
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
