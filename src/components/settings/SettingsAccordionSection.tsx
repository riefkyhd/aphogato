"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsAccordionSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border border-border bg-bg-secondary">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-4 px-4 sm:px-6 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-[11px] uppercase tracking-label text-text-muted">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-[13px] text-text-secondary leading-relaxed max-w-2xl">
              {description}
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-muted transition-transform mt-0.5",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 space-y-6">{children}</div>
      ) : null}
    </section>
  );
}
