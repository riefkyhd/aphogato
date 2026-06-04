export type ProjectStatus = "pending" | "selected" | "editing" | "delivered";

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  cloudinary_folder: string;
  gallery_token: string;
  created_at: string;
  status: ProjectStatus;
}

export interface Photo {
  id: string;
  project_id: string;
  filename: string;
  cloudinary_url: string;
  is_selected: boolean;
  created_at: string;
}

export type ShootType =
  | "wedding"
  | "portrait"
  | "event"
  | "commercial"
  | "other";
export type EventStatus = "scheduled" | "shot" | "editing" | "delivered";

export interface CalendarEvent {
  id: string;
  title: string;
  client_name: string | null;
  shoot_type: ShootType;
  location: string | null;
  shoot_date: string;
  shoot_time: string | null;
  status: EventStatus;
  notes: string | null;
  project_id: string | null;
  google_event_id: string | null;
  synced_at: string | null;
  created_at: string;
}
