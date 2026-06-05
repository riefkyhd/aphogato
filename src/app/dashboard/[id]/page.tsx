import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProjectDetailClient } from "./ProjectDetailClient";
import { normalizeExpense } from "@/lib/finance/normalize";
import {
  filterExpensesForProject,
  sumExpenseAmounts,
} from "@/lib/finance/projectExpenses";
import { normalizeProject } from "@/lib/normalizeProject";
import type { Photo, Project } from "@/lib/types";

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

  const [photosRes, eventsRes, expensesRes] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("project_id", params.id)
      .order("created_at", { ascending: false }),
    supabase.from("events").select("id").eq("project_id", params.id),
    supabase
      .from("expense_entries")
      .select("*")
      .order("entry_date", { ascending: false }),
  ]);

  const eventIdsForProject = new Set(
    (eventsRes.data ?? []).map((e) => e.id as string)
  );
  const projectExpenses = filterExpensesForProject(
    (expensesRes.data ?? []).map((r) => normalizeExpense(r)),
    params.id,
    eventIdsForProject
  );

  return (
    <ProjectDetailClient
      project={normalizeProject(project as Project)}
      initialPhotos={(photosRes.data ?? []) as Photo[]}
      projectExpenseTotal={sumExpenseAmounts(projectExpenses)}
      projectExpenseCount={projectExpenses.length}
    />
  );
}
