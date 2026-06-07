import { Skeleton } from "@/components/ui/Skeleton";

export function GalleryPhotosLoading() {
  return (
    <div aria-busy="true" aria-label="Loading photos">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Skeleton className="h-9 w-full rounded-sm sm:w-[9.5rem]" />
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-9 w-9 rounded-sm sm:w-[7.5rem]" />
          <Skeleton className="h-9 w-[4.5rem] rounded-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1.5 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="aspect-[3/4] w-full rounded-sm"
          />
        ))}
      </div>
    </div>
  );
}
