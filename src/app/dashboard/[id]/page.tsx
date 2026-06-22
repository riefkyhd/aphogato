import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProjectDetailClient } from "./ProjectDetailClient";
import { normalizeProject } from "@/lib/normalizeProject";
import { fetchAllProjectPhotos } from "@/lib/photos/fetchProjectPhotos";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!project) notFound();

  const photos = await fetchAllProjectPhotos(supabase, params.id);

  return (
    <ProjectDetailClient
      project={normalizeProject(project as Project)}
      initialPhotos={photos}
    />
  );
}
