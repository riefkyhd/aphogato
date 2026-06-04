import { NextResponse } from "next/server";
import {
  GALLERY_ERROR_CODES,
  staleSelectionMessage,
} from "@/lib/galleryErrors";
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
    return NextResponse.json(
      {
        error: "Gallery not found",
        code: GALLERY_ERROR_CODES.GALLERY_NOT_FOUND,
      },
      { status: 404 }
    );
  }

  const uniqueSelectedIds = [...new Set(selectedIds)];

  let validIds = new Set<string>();
  if (uniqueSelectedIds.length > 0) {
    const { data: validRows, error: validError } = await supabase
      .from("photos")
      .select("id")
      .eq("project_id", project.id)
      .in("id", uniqueSelectedIds);

    if (validError) {
      return NextResponse.json({ error: validError.message }, { status: 500 });
    }

    validIds = new Set((validRows ?? []).map((r) => r.id));
    const missingIds = uniqueSelectedIds.filter((id) => !validIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: staleSelectionMessage(missingIds.length),
          code: GALLERY_ERROR_CODES.STALE_SELECTION,
          missingIds,
          missingCount: missingIds.length,
        },
        { status: 409 }
      );
    }
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

  const { data: updatedProject, error: fetchProjectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", project.id)
    .single();

  if (fetchProjectError || !updatedProject) {
    return NextResponse.json(
      { error: fetchProjectError?.message ?? "Failed to load project" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    count: validIds.size,
    project: updatedProject,
  });
}
