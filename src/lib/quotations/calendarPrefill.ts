import type { QuotationDraft } from "@/lib/quotations/types";

export function buildCalendarPrefillUrl(draft: Pick<
  QuotationDraft,
  "projectTitle" | "clientName" | "eventDate" | "eventLocation" | "eventDuration" | "notes"
>): string | null {
  const title = draft.projectTitle.trim();
  const date = draft.eventDate.trim();
  if (!title || !date) return null;

  const params = new URLSearchParams({ new: "1", title, date });
  const client = draft.clientName.trim();
  const location = draft.eventLocation.trim();
  const duration = draft.eventDuration.trim();
  const notes = draft.notes.trim();

  if (client) params.set("client", client);
  if (location) params.set("location", location);
  if (duration) params.set("duration", duration);
  if (notes) params.set("notes", notes);

  return `/dashboard/calendar?${params.toString()}`;
}
