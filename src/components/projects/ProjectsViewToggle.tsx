"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FEATURES } from "@/lib/features";

export function ProjectsViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  if (!FEATURES.projectPipeline) return null;

  const isPipeline =
    searchParams.get("view") === "pipeline" ||
    pathname === "/dashboard/galleries/board" ||
    pathname === "/dashboard/board";

  const view = isPipeline ? "pipeline" : "grid";

  return (
    <SegmentedControl
      value={view}
      aria-label="Projects view"
      options={[
        { value: "grid", label: "Grid" },
        { value: "pipeline", label: "Pipeline" },
      ]}
      onChange={(next) => {
        router.push(
          next === "pipeline" ? "/dashboard?view=pipeline" : "/dashboard"
        );
      }}
    />
  );
}
