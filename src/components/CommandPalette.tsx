"use client";

import {
  Calendar,
  FileText,
  Images,
  Search,
  User,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FEATURES } from "@/lib/features";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/app/api/search/route";

type QuickAction = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  run: (router: ReturnType<typeof useRouter>) => void;
};

function buildQuickActions(): QuickAction[] {
  return [
    {
      id: "new-quote",
      label: "New quote",
      hint: "Quotation",
      icon: FileText,
      enabled: FEATURES.quotations,
      run: (r) => r.push("/dashboard/quotations"),
    },
    {
      id: "new-event",
      label: "New calendar event",
      hint: "Calendar",
      icon: Calendar,
      enabled: FEATURES.calendar,
      run: (r) => r.push("/dashboard/calendar?new=1"),
    },
    {
      id: "new-expense",
      label: "Add expense",
      hint: "Finance",
      icon: Wallet,
      enabled: FEATURES.finance,
      run: (r) => r.push("/dashboard/finance"),
    },
    {
      id: "new-gallery",
      label: "New gallery",
      hint: "Galleries",
      icon: Images,
      enabled: FEATURES.newProject,
      run: (r) => r.push("/dashboard/galleries/new"),
    },
    {
      id: "jump-clients",
      label: "Open client book",
      hint: "Clients",
      icon: User,
      enabled: FEATURES.clients,
      run: (r) => r.push("/dashboard/clients"),
    },
  ];
}

const TYPE_ICON: Record<SearchResult["type"], React.ComponentType<{ className?: string }>> = {
  project: Images,
  client: User,
  quotation: FileText,
  event: Calendar,
};

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  project: "Gallery",
  client: "Client",
  quotation: "Quote",
  event: "Event",
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyScrollLock(open);

  const quickActions = useMemo(
    () => buildQuickActions().filter((a) => a.enabled),
    []
  );

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setHighlightIndex(0);
    abortRef.current?.abort();
  }, []);

  // Global keybinding: Cmd/Ctrl+K toggles the palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        closePalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePalette]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Debounced search on query change.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const json = (await res.json()) as SearchResult[];
        setResults(Array.isArray(json) ? json : []);
        setHighlightIndex(0);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filteredActions = q
      ? quickActions.filter((a) => a.label.toLowerCase().includes(q))
      : quickActions;
    return [
      ...filteredActions.map((a) => ({
        kind: "action" as const,
        id: a.id,
        label: a.label,
        hint: a.hint,
        icon: a.icon,
        run: () => a.run(router),
      })),
      ...results.map((r) => ({
        kind: "result" as const,
        id: r.id,
        label: r.title,
        hint: r.subtitle ?? TYPE_LABEL[r.type],
        icon: TYPE_ICON[r.type],
        run: () => router.push(r.href),
      })),
    ];
  }, [quickActions, query, results, router]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[highlightIndex];
      if (item) {
        item.run();
        closePalette();
      }
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg-primary/85 backdrop-blur-sm"
        aria-label="Close command palette"
        onClick={closePalette}
        tabIndex={-1}
      />
      <div className="relative w-full max-w-lg border border-border bg-bg-elevated shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-text-muted" aria-hidden />
          <label htmlFor="command-palette-input" className="sr-only">
            Search or run a command
          </label>
          <input
            id="command-palette-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search or run a command…"
            className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex text-[10px] uppercase tracking-label text-text-muted border border-border px-1.5 py-0.5">
            Esc
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-[13px] text-text-muted text-center">
              {searching
                ? "Searching…"
                : query.trim()
                  ? "Nothing matched. Try another word."
                  : "Type to search or pick a quick action."}
            </p>
          ) : (
            <ul>
              {items.map((item, idx) => {
                const Icon = item.icon;
                const active = idx === highlightIndex;
                return (
                  <li key={`${item.kind}:${item.id}`}>
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-border last:border-0 transition-colors",
                        active
                          ? "bg-bg-primary/60 text-text-primary"
                          : "text-text-secondary hover:bg-bg-primary/40 hover:text-text-primary"
                      )}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onClick={() => {
                        item.run();
                        closePalette();
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                      <span className="min-w-0 flex-1 text-[13px] truncate">
                        {item.label}
                      </span>
                      {item.hint ? (
                        <span className="text-[11px] uppercase tracking-label text-text-muted shrink-0">
                          {item.hint}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
