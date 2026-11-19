import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";

export const runtime = "nodejs";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchFromOpenErApi(currency: string): Promise<number | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.IDR;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

async function fetchFromFrankfurter(currency: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${currency}&symbols=IDR`,
      {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.IDR;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const url = new URL(req.url);
  const fromParam = (url.searchParams.get("from") || "SGD").trim().toUpperCase();

  if (fromParam === "IDR") {
    return NextResponse.json({
      currency: "IDR",
      rateToIdr: 1,
      fetchedAt: new Date().toISOString(),
      source: "fixed",
    });
  }

  // 1. Check database cache
  let cachedRow: { rate_to_idr: number; fetched_at: string } | null = null;
  try {
    const { data } = await supabase
      .from("exchange_rate_cache")
      .select("rate_to_idr, fetched_at")
      .eq("base_currency", fromParam)
      .maybeSingle();
    if (data) {
      cachedRow = data;
      const ageMs = Date.now() - new Date(data.fetched_at).getTime();
      if (ageMs < CACHE_TTL_MS) {
        return NextResponse.json({
          currency: fromParam,
          rateToIdr: Number(data.rate_to_idr),
          fetchedAt: data.fetched_at,
          source: "cache",
        });
      }
    }
  } catch {
    // If DB cache table read fails, continue to external fetch
  }

  // 2. Fetch live rate (primary: open.er-api.com, fallback: Frankfurter)
  let liveRate = await fetchFromOpenErApi(fromParam);
  let provider = "open.er-api.com";
  if (!liveRate) {
    liveRate = await fetchFromFrankfurter(fromParam);
    provider = "frankfurter";
  }

  if (liveRate) {
    const nowIso = new Date().toISOString();
    // Update DB cache in background/safely
    try {
      await supabase.from("exchange_rate_cache").upsert({
        base_currency: fromParam,
        target_currency: "IDR",
        rate_to_idr: liveRate,
        fetched_at: nowIso,
      });
    } catch {
      // Non-blocking upsert error
    }

    return NextResponse.json({
      currency: fromParam,
      rateToIdr: liveRate,
      fetchedAt: nowIso,
      source: provider,
    });
  }

  // 3. Fallback to stale cache if live fetch failed
  if (cachedRow) {
    return NextResponse.json({
      currency: fromParam,
      rateToIdr: Number(cachedRow.rate_to_idr),
      fetchedAt: cachedRow.fetched_at,
      source: "stale_cache",
    });
  }

  return NextResponse.json(
    { error: `Unable to fetch exchange rate for ${fromParam}` },
    { status: 502 }
  );
}
