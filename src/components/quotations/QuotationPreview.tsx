import { format, parseISO } from "date-fns";
import { forwardRef } from "react";
import {
  quotationDownPayment,
  quotationSubtotal,
} from "@/lib/quotations/calculations";
import type { QuotationDraft } from "@/lib/quotations/types";
import { formatMoney } from "@/lib/finance/formatMoney";
import { QUOTATION_BANK_ACCOUNT } from "@/lib/quotations/payment";

function formatTermsParagraph(text: string): string {
  return text.replace(/\s*\n+\s*/g, " ").trim();
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 leading-none">
      {children}
    </dt>
  );
}

/** Print-layout quotation preview — always A4 desktop structure (see QuotationPageFrame). */
export const QuotationPreview = forwardRef<
  HTMLElement,
  { draft: QuotationDraft }
>(function QuotationPreview({ draft }, ref) {
  const items = draft.lineItems.filter((i) => i.description.trim());
  const deliverables = draft.deliverables.filter((d) => d.description.trim());
  const total = quotationSubtotal(draft.lineItems);
  const downPayment = quotationDownPayment(draft.lineItems);
  const hasEventDetails =
    draft.projectTitle.trim() ||
    draft.eventDate.trim() ||
    draft.eventLocation.trim() ||
    draft.eventDuration.trim();

  return (
    <article
      ref={ref}
      className="quotation-document border border-neutral-200 bg-white text-neutral-900"
    >
      <header className="quotation-header border-b border-neutral-200 px-8 py-6">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="w-12 align-middle pr-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo/MH_logo.png"
                  alt="Muhammad Hadid"
                  width={48}
                  height={48}
                  className="block h-12 w-12 object-contain"
                />
              </td>
              <td className="align-middle">
                <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-900 leading-tight m-0">
                  Muhammad Hadid
                </p>
                <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 leading-tight m-0 mt-0.5">
                  Photography
                </p>
              </td>
              <td className="align-middle text-right whitespace-nowrap pl-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 leading-tight m-0">
                  Quotation
                </p>
                {draft.quoteNumber ? (
                  <p className="text-[12px] text-neutral-700 mt-1 tabular-nums break-all m-0">
                    {draft.quoteNumber}
                  </p>
                ) : null}
              </td>
            </tr>
          </tbody>
        </table>
      </header>

      <section className="quotation-meta px-8 py-6 border-b border-neutral-200 text-[13px]">
        <dl className="grid grid-cols-3 gap-4 m-0">
          <div>
            <MetaLabel>Date</MetaLabel>
            <dd className="m-0">{formatDisplayDate(draft.quoteDate)}</dd>
          </div>
          <div>
            <MetaLabel>Valid until</MetaLabel>
            <dd className="m-0">{formatDisplayDate(draft.validUntil)}</dd>
          </div>
          <div>
            <MetaLabel>Prepared for</MetaLabel>
            <dd className="m-0">{draft.clientName.trim() || "—"}</dd>
            {draft.clientPhone.trim() ? (
              <dd className="text-neutral-600 text-[12px] mt-0.5 break-words m-0">
                {draft.clientPhone.trim()}
              </dd>
            ) : null}
            {draft.clientSocial.trim() ? (
              <dd className="text-neutral-600 text-[12px] mt-0.5 break-words m-0">
                {draft.clientSocial.trim()}
              </dd>
            ) : null}
          </div>
        </dl>
      </section>

      {hasEventDetails ? (
        <section className="quotation-event px-8 py-6 border-b border-neutral-200 text-[13px]">
          <dl className="grid grid-cols-2 gap-4 m-0">
            {draft.projectTitle.trim() ? (
              <div className="col-span-2">
                <MetaLabel>Event</MetaLabel>
                <dd className="break-words m-0">{draft.projectTitle.trim()}</dd>
              </div>
            ) : null}
            <div>
              <MetaLabel>Event date</MetaLabel>
              <dd className="m-0">{formatDisplayDate(draft.eventDate)}</dd>
            </div>
            <div>
              <MetaLabel>Duration</MetaLabel>
              <dd className="m-0">{draft.eventDuration.trim() || "—"}</dd>
            </div>
            <div className="col-span-2">
              <MetaLabel>Location</MetaLabel>
              <dd className="break-words m-0">
                {draft.eventLocation.trim() || "—"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {deliverables.length > 0 ? (
        <section className="quotation-deliverables px-8 py-5 border-b border-neutral-200">
          <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-3 m-0">
            Deliverables
          </p>
          <ul className="space-y-2 text-[13px] text-neutral-700 m-0 p-0 list-none">
            {deliverables.map((item) => (
              <li key={item.id} className="flex gap-2 leading-relaxed m-0">
                <span className="text-neutral-400 shrink-0">·</span>
                <span className="break-words">{item.description.trim()}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="px-8 py-6">
        {items.length === 0 ? (
          <p className="py-8 text-center text-neutral-500 text-[12px] m-0">
            Add line items to preview the quotation
          </p>
        ) : (
          <>
            <section className="quotation-line-item">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 border-b border-neutral-200">
                  <th className="text-left font-normal pb-3 pr-4">Description</th>
                  <th className="text-right font-normal pb-3 w-12">Qty</th>
                  <th className="text-right font-normal pb-3 w-28">Rate</th>
                  <th className="text-right font-normal pb-3 w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 align-top"
                  >
                    <td className="py-3 pr-4 text-neutral-900 break-words">
                      {item.description.trim()}
                    </td>
                    <td className="py-3 text-right tabular-nums text-neutral-600">
                      {item.qty}
                    </td>
                    <td className="py-3 text-right tabular-nums text-neutral-600">
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-neutral-900">
                      {formatMoney(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </section>

            <div className="mt-6 pt-4 border-t border-neutral-200 space-y-4">
              <section className="quotation-totals flex justify-end">
                <div className="w-full max-w-xs space-y-3 text-right">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 m-0">
                      Total
                    </p>
                    <p className="text-lg font-light tracking-[0.04em] tabular-nums text-neutral-900 m-0">
                      {formatMoney(total)}
                    </p>
                  </div>
                  <div className="border-t border-neutral-100 pt-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 m-0">
                      Down payment (50%)
                    </p>
                    <p className="text-[15px] tabular-nums text-neutral-900 m-0">
                      {formatMoney(downPayment)}
                    </p>
                    <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed m-0">
                      Non-refundable. Required to secure the booking date.
                    </p>
                  </div>
                </div>
              </section>
              <section className="quotation-payment border-t border-neutral-100 pt-4">
                <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-2 m-0">
                  Payment
                </p>
                <p className="text-[12px] text-neutral-500 mb-3 leading-relaxed m-0">
                  Transfer the down payment to the account below.
                </p>
                <div className="space-y-1">
                  <p className="text-[13px] text-neutral-700 m-0">
                    {QUOTATION_BANK_ACCOUNT.bank} · {QUOTATION_BANK_ACCOUNT.name}
                  </p>
                  <p className="text-[15px] tabular-nums tracking-[0.02em] text-neutral-900 m-0">
                    {QUOTATION_BANK_ACCOUNT.number}
                  </p>
                </div>
              </section>
            </div>
          </>
        )}
      </div>

      {draft.notes.trim() ? (
        <div className="px-8 py-5 border-t border-neutral-200">
          <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-2 m-0">
            Notes
          </p>
          <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed break-words m-0">
            {draft.notes.trim()}
          </p>
        </div>
      ) : null}

      <div className="border-t border-neutral-200">
        {draft.terms.trim() ? (
          <section className="quotation-terms px-8 pt-3 pb-2 bg-neutral-50">
            <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500 mb-1 m-0">
              Terms
            </p>
            <p className="text-[10px] text-neutral-500 leading-[1.45] break-words m-0">
              {formatTermsParagraph(draft.terms)}
            </p>
          </section>
        ) : null}

        <footer className="border-t border-neutral-200 px-8 py-2.5">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">
                <td className="text-left align-middle">Indonesia · Available worldwide</td>
                <td className="text-right align-middle whitespace-nowrap">
                  muhammad-hadid.com
                </td>
              </tr>
            </tbody>
          </table>
        </footer>
      </div>
    </article>
  );
});
