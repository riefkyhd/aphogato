import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";

export const dynamic = "force-dynamic";

export type SearchResult = {
  id: string;
  type: "project" | "client" | "quotation" | "event";
  title: string;
  subtitle?: string | null;
  href: string;
};

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    return NextResponse.json<SearchResult[]>([]);
  }

  const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const supabase = auth.supabase;

  try {
    const [projectsRes, clientsRes, quotationsRes, eventsRes] =
      await Promise.all([
        supabase
          .from("projects")
          .select("id, name, client_name, status")
          .or(`name.ilike.${pattern},client_name.ilike.${pattern}`)
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("clients")
          .select("id, name, phone")
          .ilike("name", pattern)
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase
          .from("quotations")
          .select("id, quote_number, client_name, project_title")
          .or(
            `quote_number.ilike.${pattern},client_name.ilike.${pattern},project_title.ilike.${pattern}`
          )
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("events")
          .select("id, title, shoot_date, client_name")
          .or(`title.ilike.${pattern},client_name.ilike.${pattern}`)
          .order("shoot_date", { ascending: false })
          .limit(5),
      ]);

    const results: SearchResult[] = [];

    if (projectsRes.data) {
      for (const row of projectsRes.data as Array<{
        id: string;
        name: string;
        client_name: string | null;
        status: string;
      }>) {
        results.push({
          id: `project:${row.id}`,
          type: "project",
          title: row.name,
          subtitle: [row.client_name, row.status].filter(Boolean).join(" · "),
          href: `/dashboard/${row.id}`,
        });
      }
    }

    if (clientsRes.data) {
      for (const row of clientsRes.data as Array<{
        id: string;
        name: string;
        phone: string | null;
      }>) {
        results.push({
          id: `client:${row.id}`,
          type: "client",
          title: row.name,
          subtitle: row.phone,
          href: `/dashboard/clients`,
        });
      }
    }

    if (quotationsRes.data) {
      for (const row of quotationsRes.data as Array<{
        id: string;
        quote_number: string;
        client_name: string | null;
        project_title: string | null;
      }>) {
        results.push({
          id: `quotation:${row.id}`,
          type: "quotation",
          title: row.quote_number,
          subtitle: row.client_name ?? row.project_title,
          href: `/dashboard/quotations`,
        });
      }
    }

    if (eventsRes.data) {
      for (const row of eventsRes.data as Array<{
        id: string;
        title: string;
        shoot_date: string;
        client_name: string | null;
      }>) {
        results.push({
          id: `event:${row.id}`,
          type: "event",
          title: row.title,
          subtitle: [row.shoot_date, row.client_name].filter(Boolean).join(" · "),
          href: `/dashboard/calendar`,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
