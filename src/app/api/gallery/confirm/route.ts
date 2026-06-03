import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  let body: { token?: string; selectedIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token;
  const selectedIds = Array.isArray(body.selectedIds) ? body.selectedIds : null;
  if (!token || !selectedIds) {
    return NextResponse.json(
      { error: "token and selectedIds are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabase();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("gallery_token", token)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  // Verify all selectedIds belong to this project to avoid spoofing.
  const { data: validRows, error: validError } = await supabase
    .from("photos")
    .select("id")
    .eq("project_id", project.id)
    .in("id", selectedIds.length > 0 ? selectedIds : ["00000000-0000-0000-0000-000000000000"]);

  if (validError) {
    return NextResponse.json({ error: validError.message }, { status: 500 });
  }

  const validIds = new Set((validRows ?? []).map((r) => r.id));
  if (validIds.size !== selectedIds.length) {
    return NextResponse.json(
      { error: "One or more selected photos do not belong to this gallery" },
      { status: 400 }
    );
  }

  // Reset all photos to is_selected = false, then mark chosen ones true.
  const { error: clearError } = await supabase
    .from("photos")
    .update({ is_selected: false })
    .eq("project_id", project.id);
  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 });
  }

  if (validIds.size > 0) {
    const { error: setError } = await supabase
      .from("photos")
      .update({ is_selected: true })
      .in("id", Array.from(validIds));
    if (setError) {
      return NextResponse.json({ error: setError.message }, { status: 500 });
    }
  }

  // First confirmation: pending → selected. Re-confirm never resets to pending.
  // If photographer advanced to editing/delivered, only photos change.
  if (project.status === "pending") {
    const { error: statusError } = await supabase
      .from("projects")
      .update({ status: "selected" })
      .eq("id", project.id);
    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, count: validIds.size });
}
