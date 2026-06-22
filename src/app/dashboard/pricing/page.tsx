import { createServerSupabase } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/features";
import type { PriceListItem } from "@/lib/types";
import { PricingClient } from "./PricingClient";

export const dynamic = "force-dynamic";

function normalizeItem(row: Record<string, unknown>): PriceListItem {
  return {
    ...(row as unknown as PriceListItem),
    amount: Number(row.amount),
  };
}

export default async function PricingPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("price_list_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const items = (data ?? []).map((row) =>
    normalizeItem(row as Record<string, unknown>)
  );

  return FEATURES.pricing ? (
    <PricingClient initialItems={items} />
  ) : null;
}
