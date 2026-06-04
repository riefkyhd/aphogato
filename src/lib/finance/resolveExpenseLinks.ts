import type { SupabaseClient } from "@supabase/supabase-js";

type ExpenseLinkFields = {
  event_id: string | null;
  project_id: string | null;
};

/** When linked to an event, inherit that event's project when project is unset. */
export async function resolveExpenseLinks(
  supabase: SupabaseClient,
  data: ExpenseLinkFields
): Promise<ExpenseLinkFields> {
  if (!data.event_id || data.project_id) {
    return data;
  }

  const { data: event } = await supabase
    .from("events")
    .select("project_id")
    .eq("id", data.event_id)
    .maybeSingle();

  if (event?.project_id) {
    return { ...data, project_id: event.project_id };
  }

  return data;
}
