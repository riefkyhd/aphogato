import { QuotationClient } from "@/app/dashboard/quotations/QuotationClient";
import { normalizeQuotation } from "@/lib/quotations/db";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PriceListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quotation — Gallery of Muhammad Hadid",
};

function normalizeItem(row: Record<string, unknown>): PriceListItem {
  return {
    ...(row as unknown as PriceListItem),
    amount: Number(row.amount),
  };
}

export default async function QuotationsPage() {
  const supabase = createServerSupabase();
  const [priceResult, quotationResult] = await Promise.all([
    supabase
      .from("price_list_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("quotations")
      .select("*")
      .order("quote_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  const items = (priceResult.data ?? []).map((row) =>
    normalizeItem(row as Record<string, unknown>)
  );

  const savedQuotations = (quotationResult.data ?? []).map((row) =>
    normalizeQuotation(row as Record<string, unknown>)
  );

  return (
    <QuotationClient
      priceListItems={items}
      initialSavedQuotations={savedQuotations}
    />
  );
}
