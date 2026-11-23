"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Archive,
  ArrowUpRight,
  ChevronDown,
  GitBranchPlus,
  Receipt,
  Rocket,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import type { SavedQuotation } from "@/lib/quotations/db";
import { formatMoney } from "@/lib/finance/formatMoney";
import { ServiceBadges } from "@/components/common/ServiceBadges";
import { cn } from "@/lib/utils";

function formatListDate(iso: string | null): string {
  if (!iso) return "No date";
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

const STORAGE_KEY = "aphogato-quotation-archive-open";

export function QuotationArchive({
  items,
  activeId,
  onLoad,
  onRevision,
  onFinalInvoice,
  onLaunchProject,
  onRequestDelete,
  deletingId,
}: {
  items: SavedQuotation[];
  activeId: string | null;
  onLoad: (item: SavedQuotation) => void;
  onRevision: (item: SavedQuotation) => void;
  onFinalInvoice: (item: SavedQuotation) => void;
  onLaunchProject: (item: SavedQuotation) => void;
  onRequestDelete: (item: SavedQuotation) => void;
  deletingId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setOpen(stored === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  const handleSelect = (item: SavedQuotation) => {
    onLoad(item);
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "false");
    } catch {
      // Ignore localStorage errors
    }
  };

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeId),
    [items, activeId]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const quoteNo = (item.quote_number || "").toLowerCase();
      const client = (item.client_name || "").toLowerCase();
      const title = (item.project_title || "").toLowerCase();
      return quoteNo.includes(q) || client.includes(q) || title.includes(q);
    });
  }, [items, search]);

  return (
    <section className="border border-border bg-bg-secondary">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-bg-primary/20 transition-colors min-h-[44px]"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h2 className="text-[11px] uppercase tracking-label text-text-muted">
            Archive
          </h2>
          <span className="text-[11px] text-text-muted tabular-nums">
            ({items.length} saved)
          </span>
          {activeItem ? (
            <span className="text-[11px] text-text-secondary truncate max-w-[200px]">
              · Loaded:{" "}
              <span className="font-medium text-text-primary">
                {activeItem.quote_number}
              </span>
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-label text-text-muted hidden sm:inline">
            {open ? "Minimize" : "View archive"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-text-muted transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </div>
      </button>

      {open ? (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 pt-0 border-t border-border/50">
          {items.length === 0 ? (
            <div className="border border-dashed border-border p-6 text-center mt-3">
              <Archive
                className="h-6 w-6 mx-auto text-text-muted mb-2"
                aria-hidden
              />
              <p className="text-[13px] text-text-primary">
                No saved quotes yet
              </p>
              <p className="mt-1 text-[12px] text-text-secondary leading-relaxed">
                Draft a quote below, then press Save to archive it here.
              </p>
            </div>
          ) : (
            <>
              {items.length > 3 ? (
                <div className="relative pt-3">
                  <Search
                    className="absolute left-2.5 top-5.5 h-3.5 w-3.5 text-text-muted pointer-events-none"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by quote number or client..."
                    className="w-full h-8 pl-8 pr-7 text-[12px] bg-bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover rounded-none"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-5 text-text-muted hover:text-text-primary p-0.5"
                      aria-label="Clear search"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              ) : null}

              {filteredItems.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-text-muted">
                  No saved quotations match &ldquo;{search}&rdquo;
                </p>
              ) : (
                <ul className="divide-y divide-border border border-border max-h-80 overflow-y-auto">
                  {filteredItems.map((item) => {
                    const label =
                      item.client_name?.trim() ||
                      item.project_title?.trim() ||
                      "Untitled quotation";

                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-start gap-0 transition-colors hover:bg-bg-primary/40",
                          activeId === item.id && "bg-bg-primary/50"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(item)}
                          className="min-w-0 flex-1 text-left px-4 py-3"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[12px] text-text-primary truncate">
                              {item.quote_number}
                            </p>
                            <ServiceBadges services={item.services} size="xs" />
                          </div>
                          <p className="text-[13px] text-text-secondary mt-0.5 truncate">
                            {label}
                          </p>
                          <p className="text-[11px] text-text-muted mt-1 flex flex-wrap items-center gap-1.5">
                            <span>{formatListDate(item.quote_date)}</span>
                            <span>·</span>
                            <span className="tabular-nums font-medium text-text-primary">
                              {formatMoney(item.subtotal, item.currency)}
                            </span>
                            {item.currency && item.currency !== "IDR" ? (
                              <span className="text-[10px] text-text-muted">
                                (≈{" "}
                                {formatMoney(
                                  item.total_idr ??
                                    Math.round(
                                      item.subtotal *
                                        (item.exchange_rate_to_idr || 1)
                                    ),
                                  "IDR"
                                )}
                                )
                              </span>
                            ) : null}
                          </p>
                        </button>
                        <div className="flex items-center shrink-0 pr-1 py-1">
                          {item.project_id ? (
                            <Tooltip label="Open Workspace">
                              <Link
                                href={`/dashboard/${item.project_id}`}
                                className="p-2 text-text-muted hover:text-text-primary transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
                                aria-label={`Open workspace for ${item.quote_number}`}
                              >
                                <ArrowUpRight
                                  className="h-4 w-4 text-status-delivered"
                                  aria-hidden
                                />
                              </Link>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Launch project">
                              <IconButton
                                onClick={() => onLaunchProject(item)}
                                label={`Accept and launch project for ${item.quote_number}`}
                                className="hover:text-status-delivered"
                              >
                                <Rocket className="h-4 w-4" aria-hidden />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip label="Final invoice">
                            <IconButton
                              onClick={() => onFinalInvoice(item)}
                              label={`Create final invoice for ${item.quote_number}`}
                            >
                              <Receipt className="h-4 w-4" aria-hidden />
                            </IconButton>
                          </Tooltip>
                          <Tooltip label="Create revision">
                            <IconButton
                              onClick={() => onRevision(item)}
                              label={`Create revision for ${item.quote_number}`}
                            >
                              <GitBranchPlus className="h-4 w-4" aria-hidden />
                            </IconButton>
                          </Tooltip>
                          <Tooltip label="Delete from archive">
                            <IconButton
                              onClick={() => onRequestDelete(item)}
                              disabled={deletingId === item.id}
                              label={`Delete ${item.quote_number}`}
                              className="hover:text-status-editing"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
