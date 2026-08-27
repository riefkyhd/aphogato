import Link from "next/link";
import { PowerOff } from "lucide-react";
import { DashboardMain } from "@/components/layout/DashboardShell";

export function FeatureDisabled({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <DashboardMain>
      <div className="max-w-[420px] mx-auto text-center py-16">
        <PowerOff className="h-8 w-8 mx-auto text-text-muted mb-4" aria-hidden />
        <h1 className="text-lg font-light tracking-[0.05em] uppercase">
          {label} is turned off
        </h1>
        <p className="mt-3 text-[13px] text-text-secondary leading-relaxed">
          {description ??
            "This feature is disabled in feature flags. Enable it in the codebase (src/lib/features.ts) to use this section."}
        </p>
        <Link
          href="/dashboard"
          className="btn-primary inline-flex items-center justify-center mt-6"
        >
          Back to Home
        </Link>
      </div>
    </DashboardMain>
  );
}
