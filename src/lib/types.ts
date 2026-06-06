export type ProjectStatus = "pending" | "selected" | "editing" | "delivered";

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  cloudinary_folder: string;
  gallery_token: string;
  created_at: string;
  status: ProjectStatus;
  max_photo_selection: number;
}

export interface Photo {
  id: string;
  project_id: string;
  filename: string;
  cloudinary_url: string;
  is_selected: boolean;
  created_at: string;
  perceptual_hash?: string | null;
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
  shoot_end_time: string | null;
  status: EventStatus;
  notes: string | null;
  project_id: string | null;
  google_event_id: string | null;
  synced_at: string | null;
  created_at: string;
}

export interface IncomeEntry {
  id: string;
  event_id: string | null;
  entry_date: string;
  amount: number;
  currency: string;
  client_name: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface ExpenseEntry {
  id: string;
  event_id: string | null;
  project_id: string | null;
  entry_date: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface FinanceMonthSummary {
  month: number;
  income: number;
  expenses: number;
  net: number;
}

export interface FinanceSummary {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  months: FinanceMonthSummary[];
}

export interface DeliverableItem {
  id: string;
  project_id: string | null;
  event_id: string | null;
  title: string;
  done: boolean;
  sort_order: number;
  created_at: string;
}

export type ClientSocialPlatform = "instagram" | "threads";

export interface ClientSocialAccount {
  platform: ClientSocialPlatform;
  username: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  social_accounts: ClientSocialAccount[];
  created_at: string;
}

export interface ProjectReference {
  id: string;
  project_id: string;
  filename: string;
  cloudinary_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface PriceListItem {
  id: string;
  name: string;
  amount: number;
  category: string | null;
  notes: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}
