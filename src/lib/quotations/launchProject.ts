import { format } from "date-fns";
import { quotationDownPayment } from "@/lib/quotations/calculations";
import type { SavedQuotation } from "@/lib/quotations/db";

export type LaunchProjectPayloads = {
  project: {
    name: string;
    client_name: string | null;
    max_photo_selection: number;
    quotation_id: string;
  };
  event: {
    title: string;
    client_name: string | null;
    shoot_date: string;
    shoot_time: string | null;
    location: string | null;
    status: string;
    notes: string | null;
  };
  income: {
    amount: number;
    entry_date: string;
    client_name: string | null;
    description: string;
  };
  deliverables: string[];
};

function extractMaxPhotoSelection(deliverables: string[], fallback = 50): number {
  for (const item of deliverables) {
    const match = item.match(/(\d+)\s*(?:edited|final|foto|photo|selected|picks)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num <= 500) {
        return num;
      }
    }
  }
  return fallback;
}

export function prepareLaunchPayloads(
  quote: SavedQuotation,
  options?: { defaultMaxPhotoSelection?: number }
): LaunchProjectPayloads {
  const fallbackDate = quote.quote_date || format(new Date(), "yyyy-MM-dd");
  const shootDate = quote.event_date?.trim() || fallbackDate;

  const rawClient = quote.client_name?.trim() || null;
  const rawProjectTitle = quote.project_title?.trim() || null;

  const title =
    rawProjectTitle ||
    (rawClient ? `${rawClient} Shoot` : "Untitled Shoot");

  const deliverableTitles =
    quote.deliverables.length > 0
      ? quote.deliverables
          .map((d) => d.description.trim())
          .filter(Boolean)
      : quote.line_items
          .map((item) => item.description.trim())
          .filter(Boolean);

  const fallbackMax = options?.defaultMaxPhotoSelection ?? 50;
  const maxSelection = extractMaxPhotoSelection(deliverableTitles, fallbackMax);

  const dpAmount = quotationDownPayment(quote.line_items);
  const incomeAmount = dpAmount > 0 ? dpAmount : Math.round(quote.subtotal * 0.5);

  return {
    project: {
      name: title,
      client_name: rawClient,
      max_photo_selection: maxSelection,
      quotation_id: quote.id,
    },
    event: {
      title,
      client_name: rawClient,
      shoot_date: shootDate,
      shoot_time: quote.event_duration?.trim() || null,
      location: quote.event_location?.trim() || null,
      status: "scheduled",
      notes: quote.notes?.trim() ? `Quote ${quote.quote_number}: ${quote.notes.trim()}` : `Quote ${quote.quote_number}`,
    },
    income: {
      amount: incomeAmount,
      entry_date: fallbackDate,
      client_name: rawClient,
      description: `DP ${quote.quote_number} (${title})`,
    },
    deliverables: deliverableTitles,
  };
}
