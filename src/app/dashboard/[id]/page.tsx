import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProjectDetailClient } from "./ProjectDetailClient";
import type { Photo, Project } from "@/lib/types";

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

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <ProjectDetailClient
      project={project as Project}
      initialPhotos={(photos ?? []) as Photo[]}
    />
  );
}
