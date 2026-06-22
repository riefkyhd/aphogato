/**
 * Creates a small face-search test project by copying photos from
 * "Tennis Sparring - Franca".
 *
 * Usage: node scripts/create-franca-face-test-project.mjs
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";

const SOURCE_PROJECT_ID = "68d18c53-f93d-4ce2-92a6-10d271436db5";
const PHOTO_SAMPLE_SIZE = 24;
const TEST_PROJECT_NAME = "Face Search Test — Franca";

function loadEnvLocal() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const path = join(root, ".env.local");
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveFolder(supabase, projectName) {
  const year = new Date().getFullYear();
  const base = `${year}/${slugify(projectName)}`;
  let attempt = 1;
  while (true) {
    const candidate = attempt <= 1 ? base : `${base}-${attempt}`;
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("cloudinary_folder", candidate)
      .maybeSingle();
    if (!data) return candidate;
    attempt += 1;
  }
}

function samplePhotos(photos, size) {
  if (photos.length <= size) return photos;
  const step = photos.length / size;
  const picked = [];
  for (let i = 0; i < size; i++) {
    picked.push(photos[Math.floor(i * step)]);
  }
  return picked;
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env in .env.local");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await supabase
    .from("projects")
    .select("id, name, gallery_token")
    .eq("name", TEST_PROJECT_NAME)
    .maybeSingle();

  if (existing) {
    const { count } = await supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("project_id", existing.id);
    console.log(
      JSON.stringify(
        {
          alreadyExists: true,
          projectId: existing.id,
          name: existing.name,
          galleryToken: existing.gallery_token,
          photoCount: count ?? 0,
          dashboardUrl: `/dashboard/${existing.id}`,
          galleryUrl: `/gallery/${existing.gallery_token}`,
        },
        null,
        2
      )
    );
    return;
  }

  const { data: sourceProject, error: sourceError } = await supabase
    .from("projects")
    .select("client_name, cloudinary_account, max_photo_selection")
    .eq("id", SOURCE_PROJECT_ID)
    .single();

  if (sourceError || !sourceProject) {
    throw new Error("Source project Tennis Sparring - Franca not found");
  }

  const { data: sourcePhotos, error: photosError } = await supabase
    .from("photos")
    .select(
      "filename, cloudinary_url, perceptual_hash, shot_at, is_selected, created_at"
    )
    .eq("project_id", SOURCE_PROJECT_ID)
    .order("created_at", { ascending: true });

  if (photosError) {
    throw new Error(photosError.message);
  }
  if (!sourcePhotos?.length) {
    throw new Error("Source project has no photos");
  }

  const picked = samplePhotos(sourcePhotos, PHOTO_SAMPLE_SIZE);
  const cloudinary_folder = await resolveFolder(supabase, TEST_PROJECT_NAME);
  const gallery_token = nanoid();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: TEST_PROJECT_NAME,
      client_name: sourceProject.client_name,
      cloudinary_folder,
      cloudinary_account: sourceProject.cloudinary_account ?? "default",
      gallery_token,
      status: "selected",
      max_photo_selection: Math.min(
        sourceProject.max_photo_selection ?? 50,
        50
      ),
      face_search_enabled: true,
    })
    .select("id, name, gallery_token")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Failed to create project");
  }

  const rows = picked.map((photo) => ({
    project_id: project.id,
    filename: photo.filename,
    cloudinary_url: photo.cloudinary_url,
    is_selected: false,
    perceptual_hash: photo.perceptual_hash,
    shot_at: photo.shot_at,
  }));

  const { error: insertError } = await supabase.from("photos").insert(rows);
  if (insertError) {
    await supabase.from("projects").delete().eq("id", project.id);
    throw new Error(insertError.message);
  }

  console.log(
    JSON.stringify(
      {
        projectId: project.id,
        name: project.name,
        galleryToken: project.gallery_token,
        photoCount: rows.length,
        faceSearchEnabled: true,
        dashboardUrl: `/dashboard/${project.id}`,
        galleryUrl: `/gallery/${project.gallery_token}`,
        nextSteps: [
          "Open dashboard → Project setup → Face search → Index missing photos",
          "Wait until status is Ready, then open gallery link and try Cari foto saya",
        ],
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
