import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabase/server";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { StatusDot, type ProjectStatus } from "@/components/StatusDot";
import type { Project, Photo } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ProjectWithCover extends Project {
  cover?: Pick<Photo, "cloudinary_url"> | null;
  photo_count: number;
}

async function loadProjects(): Promise<ProjectWithCover[]> {
  const supabase = createServerSupabase();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !projects) return [];

  const ids = projects.map((p) => p.id);
  if (ids.length === 0) return [];

  const { data: photos } = await supabase
    .from("photos")
    .select("project_id, cloudinary_url, created_at")
    .in("project_id", ids)
    .order("created_at", { ascending: true });

  const coverByProject = new Map<string, string>();
  const countByProject = new Map<string, number>();
  for (const p of photos ?? []) {
    countByProject.set(p.project_id, (countByProject.get(p.project_id) ?? 0) + 1);
    if (!coverByProject.has(p.project_id)) {
      coverByProject.set(p.project_id, p.cloudinary_url);
    }
  }

  return projects.map((p) => ({
    ...(p as Project),
    cover: coverByProject.has(p.id)
      ? { cloudinary_url: coverByProject.get(p.id)! }
      : null,
    photo_count: countByProject.get(p.id) ?? 0,
  }));
}

export default async function DashboardPage() {
  const projects = await loadProjects();

  return (
    <main className="px-6 md:px-10 py-10">
      <div className="flex items-end justify-between mb-10">
        <h1 className="text-2xl font-light tracking-[0.05em] uppercase">
          Projects
        </h1>
        <Link href="/dashboard/new" className="btn-primary">
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2px]">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}

function ProjectCard({ project }: { project: ProjectWithCover }) {
  return (
    <Link
      href={`/dashboard/${project.id}`}
      className="group relative block aspect-[3/2] bg-bg-elevated overflow-hidden"
    >
      {project.cover ? (
        <Image
          loader={cloudinaryLoader}
          src={project.cover.cloudinary_url}
          alt={project.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-300 group-hover:brightness-110"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-[11px] uppercase tracking-label">
          No photos yet
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-text-primary text-lg font-light tracking-[0.05em] uppercase leading-tight">
          {project.name}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">
            {project.client_name ?? "—"}
          </span>
          <StatusDot status={(project.status as ProjectStatus) ?? "pending"} />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border border-border bg-bg-secondary p-16 text-center">
      <p className="text-text-secondary text-[14px]">
        No projects yet.
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-label text-text-muted">
        Create your first project to get started.
      </p>
      <Link
        href="/dashboard/new"
        className="btn-primary inline-flex mt-8"
      >
        New project
      </Link>
    </div>
  );
}
