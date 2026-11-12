import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/api/requireAuth";
import { ensureClientByName } from "@/lib/clients/ensureClientByName";
import { normalizeQuotation } from "@/lib/quotations/db";
import { prepareLaunchPayloads } from "@/lib/quotations/launchProject";
import { resolveUniqueCloudinaryFolder } from "@/lib/resolveCloudinaryFolder";
import { normalizeStorageProvider } from "@/lib/storage/provider";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const quoteId = params.id;
  if (!quoteId) {
    return NextResponse.json({ error: "Quotation ID required" }, { status: 400 });
  }

  // 1. Fetch quotation
  const { data: quoteRow, error: quoteErr } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteErr || !quoteRow) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  const quote = normalizeQuotation(quoteRow as Record<string, unknown>);

  // Check if quotation is already linked to a project (idempotency)
  let existingProjectId = quote.project_id;
  if (!existingProjectId) {
    try {
      const { data: projByQuote } = await supabase
        .from("projects")
        .select("id")
        .eq("quotation_id", quoteId)
        .maybeSingle();
      if (projByQuote?.id) {
        existingProjectId = projByQuote.id;
      }
    } catch {
      // Column quotation_id may not exist yet in projects table
    }
  }

  if (existingProjectId) {
    const { data: existingEvent } = await supabase
      .from("events")
      .select("id")
      .eq("project_id", existingProjectId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      projectId: existingProjectId,
      eventId: existingEvent?.id ?? null,
      alreadyLaunched: true,
      projectUrl: `/dashboard/${existingProjectId}`,
      invoiceUrl: `/dashboard/invoices?from=${encodeURIComponent(quote.id)}`,
    });
  }

  // Parse optional overrides from request body if any
  let body: { storage_provider?: string; dp_amount?: number; log_dp?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const payloads = prepareLaunchPayloads(quote);
  const storage_provider = normalizeStorageProvider(body.storage_provider || "gdrive");

  // 2. Ensure Client
  if (payloads.project.client_name) {
    try {
      await ensureClientByName(supabase, payloads.project.client_name);
    } catch {
      // Continue even if client book already has the name
    }
  }

  // 3. Resolve Folder & Token
  const gallery_token = nanoid();
  let cloudinary_folder: string;
  try {
    cloudinary_folder = await resolveUniqueCloudinaryFolder(supabase, payloads.project.name);
  } catch {
    cloudinary_folder = `aphogato_${gallery_token.slice(0, 8)}`;
  }

  // 4. Create Project
  const projectInsertData: Record<string, unknown> = {
    name: payloads.project.name,
    client_name: payloads.project.client_name,
    cloudinary_folder,
    cloudinary_account: "default",
    storage_provider,
    gallery_token,
    status: "pending",
    max_photo_selection: payloads.project.max_photo_selection,
    quotation_id: quote.id,
  };

  let project: { id: string } | null = null;
  const { data: projData, error: projErr } = await supabase
    .from("projects")
    .insert(projectInsertData)
    .select("id")
    .single();

  if (projErr) {
    // If quotation_id column doesn't exist yet, retry without it
    delete projectInsertData.quotation_id;
    const retry = await supabase
      .from("projects")
      .insert(projectInsertData)
      .select("id")
      .single();

    if (retry.error || !retry.data) {
      return NextResponse.json(
        { error: retry.error?.message ?? "Failed to create project" },
        { status: 500 }
      );
    }
    project = retry.data;
  } else {
    project = projData;
  }

  const projectId = project.id;

  // 5. Create Calendar Event
  const { data: event } = await supabase
    .from("events")
    .insert({
      title: payloads.event.title,
      client_name: payloads.event.client_name,
      shoot_date: payloads.event.shoot_date,
      shoot_time: payloads.event.shoot_time,
      location: payloads.event.location,
      status: payloads.event.status,
      notes: payloads.event.notes,
      project_id: projectId,
    })
    .select("id")
    .single();

  const eventId = event?.id ?? null;

  // 6. Log Down Payment in Income Entries
  const shouldLogDp = body.log_dp !== false;
  let incomeId: string | null = null;
  const incomeAmount = typeof body.dp_amount === "number" && body.dp_amount >= 0
    ? body.dp_amount
    : payloads.income.amount;

  if (shouldLogDp && eventId && incomeAmount > 0) {
    const { data: inc } = await supabase
      .from("income_entries")
      .insert({
        event_id: eventId,
        entry_date: payloads.income.entry_date,
        amount: incomeAmount,
        currency: "IDR",
        client_name: payloads.income.client_name,
        description: payloads.income.description,
      })
      .select("id")
      .single();

    incomeId = inc?.id ?? null;
  }

  // 7. Populate Deliverables Checklist
  if (payloads.deliverables.length > 0) {
    const deliverableRows = payloads.deliverables.map((title, index) => ({
      project_id: projectId,
      event_id: eventId,
      title,
      done: false,
      sort_order: index,
    }));

    await supabase.from("deliverable_items").insert(deliverableRows);
  }

  // 8. Update Quotation Status
  try {
    await supabase
      .from("quotations")
      .update({
        project_id: projectId,
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);
  } catch {
    // Graceful ignore if columns not migrated yet
  }

  return NextResponse.json({
    ok: true,
    projectId,
    eventId,
    incomeId,
    projectUrl: `/dashboard/${projectId}`,
    invoiceUrl: `/dashboard/invoices?from=${encodeURIComponent(quote.id)}`,
  });
}
