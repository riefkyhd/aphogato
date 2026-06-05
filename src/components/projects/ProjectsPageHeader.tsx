import { NavigatingLink } from "@/components/NavigatingLink";
import { ProjectsViewToggle } from "@/components/projects/ProjectsViewToggle";

export function ProjectsPageHeader({
  title = "Projects",
}: {
  title?: string;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase text-center sm:text-left">
          {title}
        </h1>
        <NavigatingLink
          href="/dashboard/new"
          className="btn-primary w-full sm:w-auto justify-center shrink-0"
          loadingLabel="Opening…"
        >
          New project
        </NavigatingLink>
      </div>
      <div className="flex justify-center mt-4 sm:mt-5">
        <ProjectsViewToggle />
      </div>
    </div>
  );
}
