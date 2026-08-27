import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { withErrorHandler } from "@/lib/api/logError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click JSON dump of the user's core data (clients, projects,
 * quotations, calendar events, income/expense entries). Useful as a
 * "peace of mind" export before schema changes or app migrations.
 */
export const GET = withErrorHandler("export.all", async () => {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const supabase = auth.supabase;

  const [
    clientsRes,
    projectsRes,
    quotationsRes,
    eventsRes,
    incomeRes,
    expensesRes,
    priceListRes,
    deliverablesRes,
  ] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("projects").select("*"),
    supabase.from("quotations").select("*"),
    supabase.from("events").select("*"),
    supabase.from("income_entries").select("*"),
    supabase.from("expense_entries").select("*"),
    supabase.from("price_list_items").select("*"),
    supabase.from("deliverable_items").select("*"),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    clients: clientsRes.data ?? [],
    projects: projectsRes.data ?? [],
    quotations: quotationsRes.data ?? [],
    events: eventsRes.data ?? [],
    income_entries: incomeRes.data ?? [],
    expense_entries: expensesRes.data ?? [],
    price_list_items: priceListRes.data ?? [],
    deliverable_items: deliverablesRes.data ?? [],
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="aphogato-export-${stamp}.json"`,
      "cache-control": "no-store",
    },
  });
});
