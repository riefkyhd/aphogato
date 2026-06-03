import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { loadGalleryByToken } from "@/lib/gallery";
import { GallerySelector } from "./GallerySelector";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function GalleryPage({
  params,
}: {
  params: { token: string };
}) {
  noStore();

  const data = await loadGalleryByToken(params.token);
  if (!data) notFound();

  const previouslyConfirmed = data.project.status !== "pending";

  return (
    <GallerySelector
      token={params.token}
      initialProject={data.project}
      initialPhotos={data.photos}
      previouslyConfirmed={previouslyConfirmed}
      initialConfirmedSelectedIds={data.confirmedSelectedIds}
    />
  );
}
