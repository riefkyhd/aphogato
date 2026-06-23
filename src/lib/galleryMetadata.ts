import type { Metadata } from "next";
import { socialShareImageUrl } from "@/lib/mediaUrls";
import { loadGalleryByToken } from "@/lib/gallery";
import { resolveProjectCoverUrl } from "@/lib/projectCover";
import { getSiteUrl } from "@/lib/siteUrl";

function galleryDescription(
  projectName: string,
  clientName: string | null,
  photoCount: number
): string {
  const photoLabel = `${photoCount} photo${photoCount === 1 ? "" : "s"}`;
  if (clientName?.trim()) {
    return `Hi ${clientName.trim()}, your ${photoLabel} from ${projectName} are ready to view and select.`;
  }
  return `View and select your favorite photos from ${projectName} (${photoLabel}).`;
}

export async function buildGalleryMetadata(token: string): Promise<Metadata> {
  const data = await loadGalleryByToken(token);
  if (!data) {
    return { title: "Gallery not found" };
  }

  const { project, photos } = data;
  const title = project.client_name?.trim()
    ? `${project.name} — ${project.client_name.trim()}`
    : project.name;
  const description = galleryDescription(
    project.name,
    project.client_name,
    photos.length
  );
  const coverUrl = resolveProjectCoverUrl(project, photos);
  const pageUrl = `${getSiteUrl()}/gallery/${token}`;

  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Muhammad Hadid Photography",
      type: "website",
      ...(coverUrl
        ? {
            images: [
              {
                url: socialShareImageUrl(coverUrl),
                width: 1200,
                height: 630,
                alt: project.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: coverUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(coverUrl
        ? { images: [socialShareImageUrl(coverUrl)] }
        : {}),
    },
  };

  return metadata;
}
