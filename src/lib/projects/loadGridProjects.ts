import "server-only";

import type { ProjectCardData } from "@/components/ProjectCard";
import { loadProjectPhotoStats } from "@/lib/projects/loadProjectPhotoStats";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export async function loadGridProjects(): Promise<ProjectCardData[]> {
  const supabase = createServerSupabase();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !projects) return [];

  const ids = projects.map((p) => p.id);
  if (ids.length === 0) return [];

  const photoStats = await loadProjectPhotoStats(supabase, ids);

  return projects.map((p) => {
    const stats = photoStats.get(p.id);
    return {
      ...(p as Project),
      cover: stats?.cover_url ? { cloudinary_url: stats.cover_url } : null,
      photo_count: stats?.photo_count ?? 0,
    };
  });
}
