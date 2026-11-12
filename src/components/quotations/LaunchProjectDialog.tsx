"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Calendar, CheckCircle2, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { formatMoney } from "@/lib/finance/formatMoney";
import { quotationDownPayment } from "@/lib/quotations/calculations";
import type { SavedQuotation } from "@/lib/quotations/db";

export function LaunchProjectDialog({
  open,
  quote,
  onClose,
  onLaunched,
}: {
  open: boolean;
  quote: SavedQuotation | null;
  onClose: () => void;
  onLaunched?: (projectId: string) => void;
}) {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);
  const [logDp, setLogDp] = useState(true);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!quote) return null;

  const title =
    quote.project_title?.trim() ||
    (quote.client_name?.trim() ? `${quote.client_name} Shoot` : "Untitled Shoot");

  const dpAmount = quotationDownPayment(quote.line_items);
  const expectedDp = dpAmount > 0 ? dpAmount : Math.round(quote.subtotal * 0.5);

  const deliverablesCount =
    quote.deliverables.length > 0
      ? quote.deliverables.length
      : quote.line_items.filter((item) => item.description.trim()).length;

  async function handleLaunch() {
    if (!quote) return;
    setLaunching(true);

    try {
      const res = await fetch(`/api/quotations/${quote.id}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_dp: logDp }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Failed to launch project");
        setLaunching(false);
        return;
      }

      toast.success("Project launched successfully");
      onClose();

      if (onLaunched) {
        onLaunched(data.projectId);
      } else {
        router.push(data.projectUrl);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      setLaunching(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      titleId="launch-project-dialog-title"
    >
      <div className="space-y-4">
        <div>
          <span className="text-[11px] uppercase tracking-label text-text-muted">
            Quotation Deal Pipeline
          </span>
          <h2
            id="launch-project-dialog-title"
            className="text-lg font-light tracking-[0.05em] uppercase text-text-primary mt-1"
          >
            Accept &amp; Launch Project
          </h2>
          <p className="mt-1 text-[13px] text-text-secondary leading-relaxed">
            Convert <span className="text-text-primary font-medium">{quote.quote_number}</span> into an active shoot. This single confirmation will orchestrate your workspace.
          </p>
        </div>

        <div className="border border-border bg-bg-primary/50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Package className="h-4 w-4 text-text-muted mt-0.5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-label text-text-muted">
                Project &amp; Client
              </p>
              <p className="text-[14px] text-text-primary font-medium truncate">
                {title}
              </p>
              {quote.client_name ? (
                <p className="text-[12px] text-text-secondary">
                  Client: {quote.client_name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-border/70 pt-3">
            <Calendar className="h-4 w-4 text-text-muted mt-0.5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-label text-text-muted">
                Shoot Schedule
              </p>
              <p className="text-[13px] text-text-primary">
                {quote.event_date || quote.quote_date || "Date to be scheduled"}
                {quote.event_duration ? ` · ${quote.event_duration}` : ""}
              </p>
              {quote.event_location ? (
                <p className="text-[12px] text-text-secondary truncate">
                  {quote.event_location}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-border/70 pt-3">
            <DollarSign className="h-4 w-4 text-text-muted mt-0.5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-label text-text-muted">
                Expected Down Payment (Income)
              </p>
              <p className="text-[14px] text-status-delivered font-medium tabular-nums">
                {formatMoney(expectedDp)}
                <span className="text-[11px] text-text-muted ml-2 font-normal">
                  (Total {formatMoney(quote.subtotal)})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-border/70 pt-3">
            <CheckCircle2 className="h-4 w-4 text-text-muted mt-0.5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-label text-text-muted">
                Deliverables Checklist
              </p>
              <p className="text-[13px] text-text-primary">
                {deliverablesCount} item{deliverablesCount === 1 ? "" : "s"} ready to track
              </p>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2.5 p-3 rounded-sm border border-border/70 bg-bg-primary/30 cursor-pointer text-[13px] text-text-primary hover:bg-bg-primary/50 transition-colors">
          <input
            type="checkbox"
            checked={logDp}
            onChange={(e) => setLogDp(e.target.checked)}
            className="rounded-sm border-border text-text-primary focus:ring-0 h-4 w-4"
          />
          <span className="select-none">Log Down Payment (DP) to Finance now</span>
        </label>

        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={launching}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            onClick={handleLaunch}
            loading={launching}
            disabled={launching}
            className="w-full sm:w-auto"
          >
            Launch Project
            <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden />
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
