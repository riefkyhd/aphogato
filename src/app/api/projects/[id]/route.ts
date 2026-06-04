import { NextResponse } from "next/server";
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, cloudinary_url")
    .eq("project_id", params.id);

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  const cloudinaryErrors: string[] = [];
  for (const photo of photos ?? []) {
    try {
      await deleteCloudinaryImageByUrl(photo.cloudinary_url);
    } catch (err) {
      cloudinaryErrors.push(
        err instanceof Error ? err.message : "Cloudinary delete failed"
      );
    }
  }

  const { error: deleteProjectError } = await supabase
    .from("projects")
    .delete()
    .eq("id", params.id);

  if (deleteProjectError) {
    return NextResponse.json(
      { error: deleteProjectError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    photosDeleted: photos?.length ?? 0,
    cloudinaryErrors,
  });
}
