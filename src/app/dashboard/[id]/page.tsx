import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProjectDetailClient } from "./ProjectDetailClient";
import { normalizeProject } from "@/lib/normalizeProject";
import { fetchAllProjectPhotos } from "@/lib/photos/fetchProjectPhotos";
import { normalizeQuotation } from "@/lib/quotations/db";
import { normalizeExpense, normalizeIncome } from "@/lib/finance/normalize";
import type { CalendarEvent, ExpenseEntry, IncomeEntry, Project } from "@/lib/types";
import type { SavedQuotation } from "@/lib/quotations/db";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!project) notFound();

  const photos = await fetchAllProjectPhotos(supabase, params.id);

  // 1. Fetch linked calendar event
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("project_id", params.id)
    .maybeSingle();

  const linkedEvent = (eventData as CalendarEvent | null) ?? null;

  // 2. Fetch linked quotation (and check for any newer revisions in the chain)
  let linkedQuotation: SavedQuotation | null = null;
  const projectQuoteId = (project as { quotation_id?: string | null }).quotation_id;
  if (projectQuoteId) {
    const { data: q } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", projectQuoteId)
      .maybeSingle();

    if (q) {
      const rootId = q.parent_id ?? q.id;
      const { data: latestRev } = await supabase
        .from("quotations")
        .select("*")
        .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
        .order("revision", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      linkedQuotation = normalizeQuotation(
        (latestRev ?? q) as Record<string, unknown>
      );
    }
  }

  if (!linkedQuotation && project.client_name) {
    const { data: q } = await supabase
      .from("quotations")
      .select("*")
      .eq("client_name", project.client_name)
      .order("quote_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (q) linkedQuotation = normalizeQuotation(q as Record<string, unknown>);
  }

  // 3. Fetch linked income
  let linkedIncome: IncomeEntry | null = null;
  if (linkedEvent?.id) {
    const { data: inc } = await supabase
      .from("income_entries")
      .select("*")
      .eq("event_id", linkedEvent.id)
      .maybeSingle();
    if (inc) linkedIncome = normalizeIncome(inc);
  }

  // 4. Fetch linked expenses
  let expenseFilter = `project_id.eq.${params.id}`;
  if (linkedEvent?.id) {
    expenseFilter += `,event_id.eq.${linkedEvent.id}`;
  }
  const { data: expRows } = await supabase
    .from("expense_entries")
    .select("*")
    .or(expenseFilter)
    .order("entry_date", { ascending: false });

  const linkedExpenses: ExpenseEntry[] = (expRows ?? []).map((row) =>
    normalizeExpense(row)
  );

  return FEATURES.projectDetail ? (
    <ProjectDetailClient
      project={normalizeProject(project as Project)}
      initialPhotos={photos}
      initialEvent={linkedEvent}
      initialQuotation={linkedQuotation}
      initialIncome={linkedIncome}
      initialExpenses={linkedExpenses}
    />
  ) : null;
}
