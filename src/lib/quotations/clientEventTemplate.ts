import { format, isValid, parse, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { QuotationDraft } from "@/lib/quotations/types";

export type ClientEventFields = Pick<
  QuotationDraft,
  | "clientName"
  | "clientPhone"
  | "clientSocial"
  | "projectTitle"
  | "eventDate"
  | "eventLocation"
  | "eventDuration"
>;

const LABELS = {
  clientName: "Name",
  clientPhone: "Phone",
  clientSocial: "Instagram",
  projectTitle: "Event name",
  eventDate: "Event date (DD/MM/YY)",
  eventLocation: "Location",
  eventDuration: "Duration",
} as const;

const FIELD_ALIASES: Record<string, keyof ClientEventFields> = {
  nama: "clientName",
  name: "clientName",
  client: "clientName",
  "no hp": "clientPhone",
  "no. hp": "clientPhone",
  hp: "clientPhone",
  phone: "clientPhone",
  telepon: "clientPhone",
  "no telepon": "clientPhone",
  "no. telepon": "clientPhone",
  sosmed: "clientSocial",
  "sosmed/ig": "clientSocial",
  social: "clientSocial",
  ig: "clientSocial",
  instagram: "clientSocial",
  "nama acara": "projectTitle",
  acara: "projectTitle",
  event: "projectTitle",
  "event name": "projectTitle",
  project: "projectTitle",
  "tanggal acara": "eventDate",
  "tanggal acara (dd/mm/yy)": "eventDate",
  tanggal: "eventDate",
  date: "eventDate",
  "event date": "eventDate",
  durasi: "eventDuration",
  duration: "eventDuration",
  lokasi: "eventLocation",
  location: "eventLocation",
  venue: "eventLocation",
};

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "d/M/yy",
  "dd/MM/yy",
  "d/M/yyyy",
  "dd/MM/yyyy",
  "d-M-yyyy",
  "d.M.yyyy",
  "d MMMM yyyy",
  "d MMM yyyy",
  "d MMMM y",
  "d MMM y",
];

function normalizeEventDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const iso = parseISO(trimmed);
    if (isValid(iso)) {
      return format(iso, "yyyy-MM-dd");
    }
  } catch {
    // fall through
  }

  for (const pattern of DATE_FORMATS) {
    const parsed = parse(trimmed, pattern, new Date(), { locale: id });
    if (isValid(parsed)) {
      return format(parsed, "yyyy-MM-dd");
    }
  }

  return trimmed;
}

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildClientEventClipboard(): string {
  const body = [
    `${LABELS.clientName}:`,
    `${LABELS.clientPhone}:`,
    `${LABELS.clientSocial}:`,
    "",
    `${LABELS.projectTitle}:`,
    `${LABELS.eventDate}:`,
    `${LABELS.eventDuration}:`,
    `${LABELS.eventLocation}:`,
  ];

  return [
    "Hi! Please send the details below so I can prepare your quotation:",
    "",
    ...body,
  ]
    .join("\n")
    .trimEnd();
}

export function parseClientEventText(text: string): Partial<ClientEventFields> {
  const result: Partial<ClientEventFields> = {};
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;

    const rawKey = line.slice(0, separator);
    const rawValue = line.slice(separator + 1).trim();
    const field = FIELD_ALIASES[normalizeKey(rawKey)];
    if (!field || !rawValue) continue;

    if (field === "eventDate") {
      result.eventDate = normalizeEventDate(rawValue);
    } else {
      result[field] = rawValue;
    }
  }

  return result;
}

export function pickClientEventFields(
  draft: QuotationDraft
): ClientEventFields {
  return {
    clientName: draft.clientName,
    clientPhone: draft.clientPhone,
    clientSocial: draft.clientSocial,
    projectTitle: draft.projectTitle,
    eventDate: draft.eventDate,
    eventLocation: draft.eventLocation,
    eventDuration: draft.eventDuration,
  };
}
