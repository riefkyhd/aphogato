import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import type { ProjectStatus } from "@/lib/types";

const ALLOWED: ProjectStatus[] = ["pending", "selected", "editing", "delivered"];

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

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
