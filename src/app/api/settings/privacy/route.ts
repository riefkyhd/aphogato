import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { hashPin, validatePinFormat, verifyPin } from "@/lib/privacy/pin";
import {
  getPrivacyPinHash,
  isPrivacyPinEnabled,
  removePrivacyPinHash,
  setPrivacyPinHash,
} from "@/lib/privacy/settings";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const pinEnabled = await isPrivacyPinEnabled();
    return NextResponse.json({ pinEnabled });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load privacy settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PatchBody = {
  pin?: string;
  currentPin?: string;
  remove?: boolean;
};

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const existingHash = await getPrivacyPinHash();
    const pinEnabled = Boolean(existingHash);

    if (body.remove) {
      if (!pinEnabled) {
        return NextResponse.json({ error: "No PIN is set" }, { status: 400 });
      }
      const currentPin = body.currentPin?.trim() ?? "";
      const formatError = validatePinFormat(currentPin);
      if (formatError) {
        return NextResponse.json({ error: formatError }, { status: 400 });
      }
      const valid = await verifyPin(currentPin, existingHash!);
      if (!valid) {
        return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 403 });
      }
      await removePrivacyPinHash();
      return NextResponse.json({ pinEnabled: false });
    }

    const newPin = body.pin?.trim() ?? "";
    const formatError = validatePinFormat(newPin);
    if (formatError) {
      return NextResponse.json({ error: formatError }, { status: 400 });
    }

    if (pinEnabled) {
      const currentPin = body.currentPin?.trim() ?? "";
      const currentFormatError = validatePinFormat(currentPin);
      if (currentFormatError) {
        return NextResponse.json(
          { error: "Current PIN is required to change or remove" },
          { status: 400 }
        );
      }
      const valid = await verifyPin(currentPin, existingHash!);
      if (!valid) {
        return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 403 });
      }
    }

    const nextHash = await hashPin(newPin);
    await setPrivacyPinHash(nextHash);
    return NextResponse.json({ pinEnabled: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update privacy settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
