import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCloudinaryFolderPath,
  nextCloudinaryFolderCandidate,
} from "@/lib/cloudinaryFolder";

export async function resolveUniqueCloudinaryFolder(
  supabase: SupabaseClient,
  projectName: string
): Promise<string> {
  const base = buildCloudinaryFolderPath(projectName);
  let attempt = 1;

  while (true) {
    const candidate = nextCloudinaryFolderCandidate(base, attempt);
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("cloudinary_folder", candidate)
      .maybeSingle();

    if (!data) return candidate;
    attempt += 1;
  }
}
