import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  getDriveFileMeta,
  getGDriveAccessToken,
} from "@/lib/gdrive/client";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const photoOrFileId = params.id;
  if (!photoOrFileId) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const widthParam = url.searchParams.get("w");
  const downloadParam = url.searchParams.get("download") === "1";

  const supabase = createAdminSupabase();

  // 1. Resolve photo record by ID or by gdrive_file_id
  let fileId = photoOrFileId;
  let filename = "photo.jpg";

  // Check if it's a UUID (photos.id)
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      photoOrFileId
    );

  if (isUuid) {
    const { data: photo } = await supabase
      .from("photos")
      .select("id, filename, gdrive_file_id, cloudinary_url")
      .eq("id", photoOrFileId)
      .maybeSingle();

    if (photo) {
      filename = photo.filename;
      if (photo.gdrive_file_id) {
        fileId = photo.gdrive_file_id;
      } else if (photo.cloudinary_url?.startsWith("gdrive://")) {
        fileId = photo.cloudinary_url.replace("gdrive://", "");
      }
    } else {
      // Check project_references
      const { data: ref } = await supabase
        .from("project_references")
        .select("id, filename, cloudinary_url")
        .eq("id", photoOrFileId)
        .maybeSingle();

      if (ref?.cloudinary_url?.startsWith("gdrive://")) {
        filename = ref.filename;
        fileId = ref.cloudinary_url.replace("gdrive://", "");
      }
    }
  }

  try {
    const token = await getGDriveAccessToken();

    // 2. Full-Resolution Master Download Mode (?download=1)
    if (downloadParam) {
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!driveRes.ok) {
        return new NextResponse("File Not Found on Drive", {
          status: driveRes.status,
        });
      }

      const contentType =
        driveRes.headers.get("content-type") ?? "image/jpeg";
      const contentLength = driveRes.headers.get("content-length");

      const responseHeaders: Record<string, string> = {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, no-cache, no-store, max-age=0",
      };
      if (contentLength) {
        responseHeaders["Content-Length"] = contentLength;
      }

      return new NextResponse(driveRes.body, {
        status: 200,
        headers: responseHeaders,
      });
    }

    // 3. Responsive Thumbnail & Lightbox Mode (?w=...)
    const meta = await getDriveFileMeta(fileId);
    if (!meta) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const requestedWidth = widthParam ? parseInt(widthParam, 10) : 900;
    const targetWidth = isNaN(requestedWidth) ? 900 : Math.min(2560, Math.max(80, requestedWidth));

    let thumbUrl = meta.thumbnailLink;
    if (thumbUrl) {
      // Google Drive thumbnailLink format: https://lh3.googleusercontent.com/...=s220
      // Replace suffix =s220 with =s${targetWidth} or =w120-h120-c for small thumbs
      if (targetWidth <= 120) {
        thumbUrl = thumbUrl.replace(/=s\d+.*$/, "=w120-h120-c");
      } else {
        thumbUrl = thumbUrl.replace(/=s\d+.*$/, `=s${targetWidth}`);
      }

      const thumbRes = await fetch(thumbUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (thumbRes.ok) {
        const contentType = thumbRes.headers.get("content-type") ?? "image/jpeg";
        return new NextResponse(thumbRes.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        });
      }
    }

    // Fallback: Stream directly from Drive if thumbnailLink is not yet generated
    const fallbackRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!fallbackRes.ok) {
      return new NextResponse("Media Unavailable", { status: fallbackRes.status });
    }

    return new NextResponse(fallbackRes.body, {
      status: 200,
      headers: {
        "Content-Type": fallbackRes.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Media Proxy Error";
    return new NextResponse(message, { status: 500 });
  }
}
