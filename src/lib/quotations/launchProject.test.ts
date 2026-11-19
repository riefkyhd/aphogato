import { describe, expect, it } from "vitest";
import { prepareLaunchPayloads } from "@/lib/quotations/launchProject";
import type { SavedQuotation } from "@/lib/quotations/db";

const mockQuote: SavedQuotation = {
  id: "quote-123",
  quote_number: "MH-202611-0001",
  quote_date: "2026-11-12",
  valid_until: "2026-11-26",
  currency: "IDR",
  exchange_rate_to_idr: 1,
  exchange_rate_date: "2026-11-12T10:00:00Z",
  total_idr: 15000000,
  client_name: "Derio & Salma",
  client_phone: "08123456789",
  client_social: "@deriosalma",
  project_title: "Wedding of Derio & Salma",
  event_date: "2026-12-20",
  event_location: "The Dharmawangsa, Jakarta",
  event_duration: "08:00 - 22:00",
  line_items: [
    {
      id: "line-1",
      description: "Full Day Wedding Coverage",
      qty: 1,
      unitPrice: 15000000,
    },
  ],
  deliverables: [
    { id: "del-1", description: "50 Edited High-Res Photos" },
    { id: "del-2", description: "All RAW Photos in Flashdrive" },
  ],
  notes: "Client requested cinematic tones",
  terms: "50% deposit required",
  subtotal: 15000000,
  parent_id: null,
  revision: 0,
  project_id: null,
  status: "draft",
  created_at: "2026-11-12T10:00:00Z",
  updated_at: "2026-11-12T10:00:00Z",
};

describe("prepareLaunchPayloads", () => {
  it("extracts project, event, income, and deliverables correctly", () => {
    const payload = prepareLaunchPayloads(mockQuote);

    expect(payload.project.name).toBe("Wedding of Derio & Salma");
    expect(payload.project.client_name).toBe("Derio & Salma");
    expect(payload.project.max_photo_selection).toBe(50);

    expect(payload.event.title).toBe("Wedding of Derio & Salma");
    expect(payload.event.client_name).toBe("Derio & Salma");
    expect(payload.event.shoot_date).toBe("2026-12-20");
    expect(payload.event.location).toBe("The Dharmawangsa, Jakarta");
    expect(payload.event.shoot_time).toBe("08:00 - 22:00");

    expect(payload.income.amount).toBe(7500000);
    expect(payload.income.client_name).toBe("Derio & Salma");
    expect(payload.income.entry_date).toBe("2026-11-12");

    expect(payload.deliverables).toEqual([
      "50 Edited High-Res Photos",
      "All RAW Photos in Flashdrive",
    ]);
  });

  it("handles fallback titles and dates when quotation fields are sparse", () => {
    const sparseQuote: SavedQuotation = {
      ...mockQuote,
      project_title: null,
      event_date: null,
      event_location: null,
      event_duration: null,
      deliverables: [],
      line_items: [
        {
          id: "item-1",
          description: "Studio Portrait Session",
          qty: 1,
          unitPrice: 2000000,
        },
      ],
      subtotal: 2000000,
    };

    const payload = prepareLaunchPayloads(sparseQuote);

    expect(payload.project.name).toBe("Derio & Salma Shoot");
    expect(payload.event.title).toBe("Derio & Salma Shoot");
    expect(payload.event.shoot_date).toBe("2026-11-12");
    expect(payload.income.amount).toBe(1000000);
    expect(payload.deliverables).toEqual(["Studio Portrait Session"]);
  });

  it("converts foreign currency DP to IDR for income.amount while preserving original currency", () => {
    const foreignQuote: SavedQuotation = {
      ...mockQuote,
      currency: "SGD",
      exchange_rate_to_idr: 14000,
      exchange_rate_date: "2026-11-19T00:00:00Z",
      total_idr: 28000000,
      subtotal: 2000,
      line_items: [
        {
          id: "item-sgd",
          description: "Singapore Pre-wedding",
          qty: 1,
          unitPrice: 2000,
        },
      ],
    };

    const payload = prepareLaunchPayloads(foreignQuote);
    expect(payload.income.currency).toBe("SGD");
    expect(payload.income.exchange_rate_to_idr).toBe(14000);
    expect(payload.income.original_amount).toBe(1000); // 50% of 2000 SGD
    expect(payload.income.amount).toBe(14000000); // 1000 SGD * 14000 = 14,000,000 IDR
  });
});
