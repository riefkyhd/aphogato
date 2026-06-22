import { Suspense } from "react";
import { InvoiceClient } from "@/app/dashboard/invoices/InvoiceClient";
import { FEATURES } from "@/lib/features";
import { normalizeQuotation } from "@/lib/quotations/db";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invoice — Gallery of Muhammad Hadid",
};

export default async function InvoicesPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("quotations")
    .select("*")
    .order("quote_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const savedQuotations = (data ?? []).map((row) =>
    normalizeQuotation(row as Record<string, unknown>)
  );

  return FEATURES.invoices ? (
    <Suspense fallback={null}>
      <InvoiceClient initialSavedQuotations={savedQuotations} />
    </Suspense>
  ) : null;
}
