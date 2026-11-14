"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GallerySearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function GallerySearchInput({
  value,
  onChange,
  placeholder = "Search filename…",
  disabled = false,
  className,
}: GallerySearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses the search input when not typing in another field
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        const isInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active?.getAttribute("contenteditable") === "true";
        if (!isInput) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-text-muted"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label="Search photos by filename"
        className={cn(
          "h-9 w-full rounded-sm border border-border bg-bg-elevated/80 pl-9 pr-8 text-[13px] text-text-primary placeholder:text-text-muted transition-colors",
          "focus:border-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Hide default search cancel button in WebKit browsers
          "[&::-webkit-search-cancel-button]:hidden"
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-sm text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
