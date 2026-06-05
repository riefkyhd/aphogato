"use client";

import { usePathname, useRouter } from "next/navigation";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export function ProjectsViewToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const view = pathname === "/dashboard/board" ? "pipeline" : "grid";

  return (
    <SegmentedControl
      value={view}
      aria-label="Projects view"
      options={[
        { value: "grid", label: "Grid" },
        { value: "pipeline", label: "Pipeline" },
      ]}
      onChange={(next) => {
        router.push(next === "pipeline" ? "/dashboard/board" : "/dashboard");
      }}
    />
  );
}
