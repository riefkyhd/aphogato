import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCloudinaryFolderPath,
  buildRenamedCloudinaryFolderPath,
  nextCloudinaryFolderCandidate,
} from "@/lib/cloudinaryFolder";

async function resolveUniqueFolderCandidate(
  supabase: SupabaseClient,
  base: string,
  excludeProjectId?: string
): Promise<string> {
  let attempt = 1;

  while (true) {
    const candidate = nextCloudinaryFolderCandidate(base, attempt);
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("cloudinary_folder", candidate)
      .maybeSingle();

    if (!data || data.id === excludeProjectId) return candidate;
    attempt += 1;
  }
}

export async function resolveUniqueCloudinaryFolder(
  supabase: SupabaseClient,
  projectName: string
): Promise<string> {
  const base = buildCloudinaryFolderPath(projectName);
  return resolveUniqueFolderCandidate(supabase, base);
}

export async function resolveRenamedCloudinaryFolder(
  supabase: SupabaseClient,
  projectId: string,
  currentFolder: string,
  newProjectName: string
): Promise<string> {
  const base = buildRenamedCloudinaryFolderPath(currentFolder, newProjectName);
  return resolveUniqueFolderCandidate(supabase, base, projectId);
}
