import type { ProjectStatus } from "@/lib/types";

export type BoardProject = {
  id: string;
  name: string;
  client_name: string | null;
  status: ProjectStatus;
  created_at: string;
  cover_url: string | null;
  photo_count: number;
  deliverables_done: number;
  deliverables_total: number;
  next_shoot_date: string | null;
};

export const BOARD_COLUMNS: {
  status: ProjectStatus;
  label: string;
  hint: string;
}[] = [
  {
    status: "pending",
    label: "Awaiting selection",
    hint: "Gallery shared; client has not confirmed picks",
  },
  {
    status: "selected",
    label: "Client selected",
    hint: "Client confirmed selections; ready to edit",
  },
  {
    status: "editing",
    label: "Editing",
    hint: "Retouch and delivery in progress",
  },
  {
    status: "delivered",
    label: "Delivered",
    hint: "Job complete",
  },
];

export const BOARD_STATUS_ORDER: ProjectStatus[] = BOARD_COLUMNS.map(
  (c) => c.status
);

export function groupProjectsByStatus(
  projects: BoardProject[]
): Record<ProjectStatus, BoardProject[]> {
  const groups: Record<ProjectStatus, BoardProject[]> = {
    pending: [],
    selected: [],
    editing: [],
    delivered: [],
  };
  for (const p of projects) {
    const status = BOARD_STATUS_ORDER.includes(p.status) ? p.status : "pending";
    groups[status].push(p);
  }
  for (const status of BOARD_STATUS_ORDER) {
    groups[status].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  return groups;
}
