import type { BoardProject } from "@/lib/projects/board";
import { normalizeProject } from "@/lib/normalizeProject";
import type { Project, ProjectStatus } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadBoardProjects(
  supabase: SupabaseClient
): Promise<BoardProject[]> {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !projects?.length) return [];

  const ids = projects.map((p) => p.id as string);

  const [photosRes, deliverablesRes, eventsRes] = await Promise.all([
    supabase
      .from("photos")
      .select("project_id, cloudinary_url, created_at")
      .in("project_id", ids)
      .order("created_at", { ascending: true }),
    supabase
      .from("deliverable_items")
      .select("project_id, done")
      .in("project_id", ids),
    supabase
      .from("events")
      .select("project_id, shoot_date")
      .in("project_id", ids)
      .order("shoot_date", { ascending: true }),
  ]);

  const coverByProject = new Map<string, string>();
  const countByProject = new Map<string, number>();
  for (const row of photosRes.data ?? []) {
    const pid = row.project_id as string;
    countByProject.set(pid, (countByProject.get(pid) ?? 0) + 1);
    if (!coverByProject.has(pid)) {
      coverByProject.set(pid, row.cloudinary_url as string);
    }
  }

  const deliverablesByProject = new Map<
    string,
    { done: number; total: number }
  >();
  for (const row of deliverablesRes.data ?? []) {
    const pid = row.project_id as string | null;
    if (!pid) continue;
    const cur = deliverablesByProject.get(pid) ?? { done: 0, total: 0 };
    cur.total += 1;
    if (row.done) cur.done += 1;
    deliverablesByProject.set(pid, cur);
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const nextShootByProject = new Map<string, string>();
  const lastShootByProject = new Map<string, string>();
  for (const row of eventsRes.data ?? []) {
    const pid = row.project_id as string | null;
    const date = row.shoot_date as string;
    if (!pid || !date) continue;
    if (date >= today) {
      const existing = nextShootByProject.get(pid);
      if (!existing || date < existing) {
        nextShootByProject.set(pid, date);
      }
    } else {
      const existing = lastShootByProject.get(pid);
      if (!existing || date > existing) {
        lastShootByProject.set(pid, date);
      }
    }
  }

  return projects.map((raw) => {
    const p = normalizeProject(raw as Project);
    const id = p.id;
    const deliverables = deliverablesByProject.get(id) ?? {
      done: 0,
      total: 0,
    };
    return {
      id,
      name: p.name,
      client_name: p.client_name,
      status: (p.status as ProjectStatus) ?? "pending",
      created_at: p.created_at,
      cover_url: coverByProject.get(id) ?? null,
      photo_count: countByProject.get(id) ?? 0,
      deliverables_done: deliverables.done,
      deliverables_total: deliverables.total,
      next_shoot_date:
        nextShootByProject.get(id) ?? lastShootByProject.get(id) ?? null,
    };
  });
}
