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
