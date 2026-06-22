import type { SupabaseClient } from "@supabase/supabase-js";
import type { Photo } from "@/lib/types";

/** PostgREST (Supabase) returns at most 1000 rows per request by default. */
export const SUPABASE_MAX_ROWS_PER_REQUEST = 1000;

type FetchProjectPhotosOptions = {
  columns?: string;
  order?: { column: string; ascending?: boolean };
};

/**
 * Load all photos for a project, paginating past the 1000-row Supabase cap.
 */
export async function fetchAllProjectPhotos(
  supabase: SupabaseClient,
  projectId: string,
  options?: FetchProjectPhotosOptions
): Promise<Photo[]> {
  return fetchAllProjectPhotoRows<Photo>(supabase, projectId, {
    columns: options?.columns ?? "*",
    order: options?.order ?? { column: "created_at", ascending: false },
  });
}

export async function fetchAllProjectPhotoRows<T = Photo>(
  supabase: SupabaseClient,
  projectId: string,
  options: {
    columns: string;
    order?: { column: string; ascending?: boolean };
  }
): Promise<T[]> {
  const order = options.order ?? { column: "created_at", ascending: false };
  const all: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("photos")
      .select(options.columns)
      .eq("project_id", projectId)
      .order(order.column, { ascending: order.ascending ?? false })
      .range(from, from + SUPABASE_MAX_ROWS_PER_REQUEST - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as T[];
    all.push(...batch);
    if (batch.length < SUPABASE_MAX_ROWS_PER_REQUEST) break;
    from += SUPABASE_MAX_ROWS_PER_REQUEST;
  }

  return all;
}

/** Selected filenames for Bridge export — paginated past the 1000-row cap. */
export async function fetchSelectedPhotoFilenames(
  supabase: SupabaseClient,
  projectId: string
): Promise<string[]> {
  const selected: string[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("photos")
      .select("filename")
      .eq("project_id", projectId)
      .eq("is_selected", true)
      .order("created_at", { ascending: true })
      .range(from, from + SUPABASE_MAX_ROWS_PER_REQUEST - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = data ?? [];
    for (const row of batch) {
      selected.push(row.filename as string);
    }
    if (batch.length < SUPABASE_MAX_ROWS_PER_REQUEST) break;
    from += SUPABASE_MAX_ROWS_PER_REQUEST;
  }

  return selected;
}
