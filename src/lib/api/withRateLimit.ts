import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export function rateLimitOrResponse(
  request: Request,
  prefix: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${prefix}:${ip}`, limit, windowMs);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    }
  );
}
