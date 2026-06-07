import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  migrateCloudinaryUrlForFolderRename,
  renameCloudinaryFolder,
} from "@/lib/cloudinary";
import { resolveRenamedCloudinaryFolder } from "@/lib/resolveCloudinaryFolder";
import type { Photo, Project } from "@/lib/types";

function normalizeFolder(folder: string): string {
  return folder.trim().replace(/^\/+|\/+$/g, "");
}

export async function renameProject(
  supabase: SupabaseClient,
  projectId: string,
  rawName: string
): Promise<{
  project: Project;
  folderRenamed: boolean;
  photosUpdated: number;
  referencesUpdated: number;
  photos: Photo[];
}> {
  const name = rawName.trim();
  if (!name) {
    throw new Error("Project name is required");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Project not found");
  }

  const current = project as Project;
  if (current.name === name) {
    const { data: photos } = await supabase
      .from("photos")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    return {
      project: current,
      folderRenamed: false,
      photosUpdated: 0,
      referencesUpdated: 0,
      photos: (photos ?? []) as Photo[],
    };
  }

  const oldFolder = normalizeFolder(current.cloudinary_folder);
  const newFolder = normalizeFolder(
    await resolveRenamedCloudinaryFolder(
      supabase,
      projectId,
      current.cloudinary_folder,
      name
    )
  );

  const folderChanged = oldFolder !== newFolder;
  if (folderChanged) {
    await renameCloudinaryFolder(oldFolder, newFolder);
  }

  const { data: updatedProject, error: updateError } = await supabase
    .from("projects")
    .update({
      name,
      cloudinary_folder: newFolder,
    })
    .eq("id", projectId)
    .select("*")
    .single();

  if (updateError || !updatedProject) {
    throw new Error(updateError?.message ?? "Failed to update project");
  }

  let photosUpdated = 0;
  let referencesUpdated = 0;

  if (folderChanged) {
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, cloudinary_url")
      .eq("project_id", projectId);

    if (photosError) {
      throw new Error(photosError.message);
    }

    for (const photo of photos ?? []) {
      const cloudinary_url = migrateCloudinaryUrlForFolderRename(
        photo.cloudinary_url as string,
        oldFolder,
        newFolder
      );
      const { error } = await supabase
        .from("photos")
        .update({ cloudinary_url })
        .eq("id", photo.id);
      if (error) throw new Error(error.message);
      photosUpdated += 1;
    }

    const { data: references, error: referencesError } = await supabase
      .from("project_references")
      .select("id, cloudinary_url")
      .eq("project_id", projectId);

    if (referencesError) {
      throw new Error(referencesError.message);
    }

    for (const reference of references ?? []) {
      const cloudinary_url = migrateCloudinaryUrlForFolderRename(
        reference.cloudinary_url as string,
        oldFolder,
        newFolder
      );
      const { error } = await supabase
        .from("project_references")
        .update({ cloudinary_url })
        .eq("id", reference.id);
      if (error) throw new Error(error.message);
      referencesUpdated += 1;
    }
  }

  const { data: photos, error: photosListError } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (photosListError) {
    throw new Error(photosListError.message);
  }

  return {
    project: updatedProject as Project,
    folderRenamed: folderChanged,
    photosUpdated,
    referencesUpdated,
    photos: (photos ?? []) as Photo[],
  };
}
