import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { validatePinFormat, verifyPin } from "@/lib/privacy/pin";
import { getPrivacyPinHash } from "@/lib/privacy/settings";
import {
  checkRateLimit,
  getClientIp,
  pruneRateLimitBuckets,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const VERIFY_LIMIT = 5;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  pruneRateLimitBuckets();

  const ip = getClientIp(request);
  const rate = checkRateLimit(`privacy-verify:${ip}`, VERIFY_LIMIT, VERIFY_WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rate.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  let body: { pin?: string };
  try {
    body = (await request.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pin = body.pin?.trim() ?? "";
  const formatError = validatePinFormat(pin);
  if (formatError) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 403 });
  }

  try {
    const hash = await getPrivacyPinHash();
    if (!hash) {
      return NextResponse.json({ ok: true, pinEnabled: false });
    }

    const valid = await verifyPin(pin, hash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, pinEnabled: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to verify PIN";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
