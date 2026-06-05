import { NextResponse } from "next/server";
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import { requireAuth } from "@/lib/api/requireAuth";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; refId: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: ref, error: fetchError } = await supabase
    .from("project_references")
    .select("*")
    .eq("id", params.refId)
    .eq("project_id", params.id)
    .single();

  if (fetchError || !ref) {
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  }

  try {
    await deleteCloudinaryImageByUrl(ref.cloudinary_url);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Cloudinary delete failed",
      },
      { status: 500 }
    );
  }

  const { error: deleteError } = await supabase
    .from("project_references")
    .delete()
    .eq("id", params.refId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
