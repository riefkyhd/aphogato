import { ContentColumn } from "@/components/layout/ContentColumn";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { FEATURES } from "@/lib/features";
import { NewProjectForm } from "./NewProjectForm";

export const metadata = {
  title: "New project — Aphogato",
};

export default function NewProjectPage() {
  return (
    <DashboardMain>
      <ContentColumn size="md">
        <h1 className="text-2xl font-light tracking-[0.05em] uppercase mb-2">
          New project
        </h1>
        <p className="text-text-secondary text-[15px] mb-10 leading-relaxed">
          Set up a gallery for your client. On the next screen, add your photos
          and share the link when you&rsquo;re ready.
        </p>
        {FEATURES.newProject ? <NewProjectForm /> : null}
      </ContentColumn>
    </DashboardMain>
  );
}
