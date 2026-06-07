"use client";

import { format, parseISO } from "date-fns";
import { GitBranchPlus, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import type { SavedQuotation } from "@/lib/quotations/db";
import { formatMoney } from "@/lib/finance/formatMoney";
import { cn } from "@/lib/utils";

function formatListDate(iso: string | null): string {
  if (!iso) return "No date";
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

export function QuotationArchive({
  items,
  activeId,
  onLoad,
  onRevision,
  onRequestDelete,
  deletingId,
}: {
  items: SavedQuotation[];
  activeId: string | null;
  onLoad: (item: SavedQuotation) => void;
  onRevision: (item: SavedQuotation) => void;
  onRequestDelete: (item: SavedQuotation) => void;
  deletingId: string | null;
}) {
  if (items.length === 0) {
    return (
      <p className="text-[12px] text-text-muted">
        No saved quotations yet. Use Save to archive a quote for administration.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border">
      {items.map((item) => {
        const label =
          item.client_name?.trim() ||
          item.project_title?.trim() ||
          "Untitled quotation";

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onLoad(item)}
              className={cn(
                "w-full text-left px-4 py-3 transition-colors hover:bg-bg-primary/40",
                activeId === item.id && "bg-bg-primary/50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] text-text-primary truncate">
                    {item.quote_number}
                  </p>
                  <p className="text-[13px] text-text-secondary mt-0.5 truncate">
                    {label}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {formatListDate(item.quote_date)} · {formatMoney(item.subtotal)}
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <Tooltip label="Create revision">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevision(item);
                      }}
                      label={`Create revision for ${item.quote_number}`}
                    >
                      <GitBranchPlus className="h-4 w-4" aria-hidden />
                    </IconButton>
                  </Tooltip>
                  <Tooltip label="Delete from archive">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete(item);
                      }}
                      disabled={deletingId === item.id}
                      label={`Delete ${item.quote_number}`}
                      className="hover:text-status-editing"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
