import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/types";

const ALLOWED: ProjectStatus[] = ["pending", "selected", "editing", "delivered"];

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { status?: ProjectStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status || !ALLOWED.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of ${ALLOWED.join(", ")}` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: body.status })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
