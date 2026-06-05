import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import type { DeliverableItem } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id");
  const eventId = url.searchParams.get("event_id");

  if (!projectId && !eventId) {
    return NextResponse.json(
      { error: "project_id or event_id is required" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("deliverable_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (projectId) query = query.eq("project_id", projectId);
  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as DeliverableItem[]);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: {
    title?: string;
    project_id?: string;
    event_id?: string;
    sort_order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const projectId = body.project_id?.trim() || null;
  const eventId = body.event_id?.trim() || null;
  if (!projectId && !eventId) {
    return NextResponse.json(
      { error: "project_id or event_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("deliverable_items")
    .insert({
      title,
      project_id: projectId,
      event_id: eventId,
      sort_order: body.sort_order ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create item" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as DeliverableItem);
}
