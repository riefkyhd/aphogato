import { ProjectBoardClient } from "@/components/projects/ProjectBoardClient";
import { loadBoardProjects } from "@/lib/projects/loadBoardProjects";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProjectBoardPage() {
  const supabase = createServerSupabase();
  const projects = await loadBoardProjects(supabase);

  return (
    <>
      <ProjectBoardClient initialProjects={projects} />
    </>
  );
}
