"use client";

import { usePathname, useRouter } from "next/navigation";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FEATURES } from "@/lib/features";

export function ProjectsViewToggle() {
  const pathname = usePathname();
  const router = useRouter();

  if (!FEATURES.projectPipeline) return null;

  const view =
    pathname === "/dashboard/galleries/board" ||
    pathname === "/dashboard/board"
      ? "pipeline"
      : "grid";

  return (
    <SegmentedControl
      value={view}
      aria-label="Galleries view"
      options={[
        { value: "grid", label: "Grid" },
        { value: "pipeline", label: "Pipeline" },
      ]}
      onChange={(next) => {
        router.push(
          next === "pipeline"
            ? "/dashboard/galleries/board"
            : "/dashboard/galleries"
        );
      }}
    />
  );
}
