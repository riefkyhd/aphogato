"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowUpRight, CheckCircle2, FileText, MessageSquare, Receipt, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import type { CalendarEvent, IncomeEntry, Project } from "@/lib/types";
import type { SavedQuotation } from "@/lib/quotations/db";

export function ProjectDealSection({
  project,
  event = null,
  quotation,
  income,
  onIncomeUpdated,
}: {
  project: Project;
  event?: CalendarEvent | null;
  quotation: SavedQuotation | null;
  income: IncomeEntry | null;
  onIncomeUpdated?: () => void;
}) {
  const router = useRouter();
  const { moneyVisible, isLocked } = usePrivacyLockContext();
  const showAmounts = moneyVisible && !isLocked;

  const [currentPaid, setCurrentPaid] = useState(income?.amount ?? 0);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    setCurrentPaid(income?.amount ?? 0);
  }, [income]);

  const totalQuoted = quotation?.subtotal ?? 0;
  const balanceRemaining = Math.max(0, totalQuoted - currentPaid);

  const clientPhone = quotation?.client_phone?.trim() ?? "";
  const clientSocial = quotation?.client_social?.trim() ?? "";

  const whatsappUrl = clientPhone
    ? `https://wa.me/${clientPhone.replace(/\D/g, "")}`
    : null;

  async function handleMarkBalancePaid() {
    if (!quotation || balanceRemaining <= 0) return;
    setMarkingPaid(true);

    try {
      const res = await fetch("/api/finance/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: format(new Date(), "yyyy-MM-dd"),
          amount: totalQuoted,
          currency: "IDR",
          client_name: project.client_name,
          description: `Pelunasan: ${quotation.quote_number} (${project.name})`,
          event_id: event?.id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to mark balance as paid");
        setMarkingPaid(false);
        return;
      }

      toast.success("Balance marked as paid in full");
      setCurrentPaid(totalQuoted);
      setMarkingPaid(false);
      router.refresh();
      if (onIncomeUpdated) onIncomeUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
      setMarkingPaid(false);
    }
  }

  return (
    <div className="space-y-6">
      {quotation ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border bg-bg-secondary p-4 sm:p-5">
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              Quotation
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[15px] text-text-primary font-medium tracking-[0.03em] tabular-nums">
                {quotation.quote_number}
              </span>
              <Link
                href="/dashboard/quotations"
                className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
              >
                View
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
            <p className="mt-2 text-[12px] text-text-muted">
              {quotation.project_title || "Photography Package"}
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Package Total</span>
              <span className="text-[14px] text-text-primary tabular-nums font-medium">
                <MaskedMoney amount={totalQuoted} visible={showAmounts} />
              </span>
            </div>
          </div>

          <div className="border border-border bg-bg-secondary p-4 sm:p-5">
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              Payment &amp; Down Payment
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[15px] text-status-delivered font-medium tabular-nums">
                <MaskedMoney amount={currentPaid} visible={showAmounts} />
              </span>
              <span className="text-[10px] uppercase tracking-label px-2 py-0.5 rounded-sm bg-status-delivered/10 text-status-delivered border border-status-delivered/20">
                {currentPaid >= totalQuoted && totalQuoted > 0 ? "Paid Full" : "DP Logged"}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-text-muted">
              {currentPaid >= totalQuoted
                ? "Total package value paid in full"
                : "Remaining balance due on shoot / delivery"}
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-text-muted">Balance Due</span>
              <span className="text-[14px] text-text-secondary tabular-nums">
                <MaskedMoney amount={balanceRemaining} visible={showAmounts} />
              </span>
            </div>
            {balanceRemaining > 0 ? (
              <div className="mt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={markingPaid}
                  disabled={markingPaid}
                  onClick={() => void handleMarkBalancePaid()}
                  className="w-full !text-[11px] !min-h-[44px] sm:!min-h-9 !py-1.5 uppercase tracking-label font-medium text-status-delivered border-status-delivered/30 hover:bg-status-delivered/10"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" aria-hidden />
                  Mark Balance Paid (Pelunasan)
                </Button>
              </div>
            ) : null}
          </div>

          <div className="border border-border bg-bg-secondary p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-label text-text-muted">
                Invoice &amp; Billing
              </span>
              <p className="mt-1 text-[13px] text-text-primary">
                1-Click Final Invoice
              </p>
              <p className="mt-1 text-[12px] text-text-secondary leading-relaxed">
                Generate or export the luxury client invoice prefilled from this quote.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <Link
                href={`/dashboard/invoices?from=${encodeURIComponent(quotation.id)}`}
                className="w-full inline-flex items-center justify-center gap-1.5 btn-primary !text-[11px] !min-h-[44px] sm:!min-h-9 !py-2 uppercase tracking-label font-medium"
              >
                <Receipt className="h-3.5 w-3.5" aria-hidden />
                Create Final Invoice
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-border p-6 text-center">
          <FileText className="h-6 w-6 mx-auto text-text-muted mb-2" aria-hidden />
          <h3 className="text-[13px] text-text-primary">No quotation linked</h3>
          <p className="mt-1 text-[12px] text-text-secondary max-w-md mx-auto leading-relaxed">
            This project was created directly without a quotation. You can create a new quote to lock in pricing and terms.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/quotations"
              className="btn-secondary !text-[11px] !min-h-[44px] sm:!min-h-9 !px-4 !py-2 inline-flex items-center gap-1.5 uppercase tracking-label"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Create Quotation
            </Link>
          </div>
        </div>
      )}

      {/* Client Contact & Profile Card */}
      <div className="border border-border bg-bg-secondary p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-text-muted" aria-hidden />
            <h3 className="text-[11px] uppercase tracking-label text-text-muted">
              Client Contact Information
            </h3>
          </div>
          {project.client_name ? (
            <Link
              href="/dashboard/clients"
              className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary"
            >
              Client Book →
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[11px] text-text-muted">Client Name</span>
            <p className="text-[14px] text-text-primary font-medium mt-0.5">
              {project.client_name || "Unassigned"}
            </p>
          </div>

          <div>
            <span className="text-[11px] text-text-muted">Phone Number</span>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[13px] text-text-primary">
                {clientPhone || "No phone added"}
              </p>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-status-delivered hover:opacity-80 p-1"
                  aria-label="Chat on WhatsApp"
                >
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-text-muted">Social / Instagram</span>
            <p className="text-[13px] text-text-primary mt-0.5">
              {clientSocial || "No social handle"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
