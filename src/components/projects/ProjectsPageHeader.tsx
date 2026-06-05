import { NavigatingLink } from "@/components/NavigatingLink";
import { ProjectsViewToggle } from "@/components/projects/ProjectsViewToggle";

export function ProjectsPageHeader({
  title = "Projects",
}: {
  title?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8">
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase">
          {title}
        </h1>
        <ProjectsViewToggle />
      </div>
      <NavigatingLink
        href="/dashboard/new"
        className="btn-primary w-full sm:w-auto justify-center"
        loadingLabel="Opening…"
      >
        New project
      </NavigatingLink>
    </div>
  );
}
