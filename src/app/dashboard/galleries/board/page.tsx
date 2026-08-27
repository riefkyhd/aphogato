import { ProjectBoardClient } from "@/components/projects/ProjectBoardClient";
import { FEATURES } from "@/lib/features";
import { loadBoardProjects } from "@/lib/projects/loadBoardProjects";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GalleriesBoardPage() {
  const supabase = createServerSupabase();
  const projects = await loadBoardProjects(supabase);

  return FEATURES.projectPipeline ? (
    <ProjectBoardClient initialProjects={projects} />
  ) : null;
}
