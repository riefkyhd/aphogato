/** Slug segment from project name (no year prefix). */
export function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `[year]/[slug]` e.g. `2026/wedding-derio-salma` */
export function buildCloudinaryFolderPath(
  projectName: string,
  year = new Date().getFullYear()
): string {
  const slug = slugifyProjectName(projectName);
  if (!slug) {
    throw new Error("Project name must contain at least one letter or number");
  }
  return `${year}/${slug}`;
}

/** Next available folder when `base` is already taken in Supabase. */
export function nextCloudinaryFolderCandidate(
  base: string,
  attempt: number
): string {
  if (attempt <= 1) return base;
  return `${base}-${attempt}`;
}
