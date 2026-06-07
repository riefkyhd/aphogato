import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  pruneRateLimitBuckets,
} from "./lib/security/rateLimit";
import { applySecurityHeaders } from "./lib/security/securityHeaders";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "./lib/supabase/env";

function rateLimitedResponse(
  request: NextRequest,
  prefix: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  if (Math.random() < 0.01) pruneRateLimitBuckets();

  const ip = getClientIp(request);
  const result = checkRateLimit(`${prefix}:${ip}`, limit, windowMs);
  if (result.allowed) return null;

  return applySecurityHeaders(
    NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSec) },
      }
    )
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/api/gallery/confirm" &&
    request.method === "PATCH"
  ) {
    const limited = rateLimitedResponse(request, "gallery-confirm", 30, 60_000);
    if (limited) return limited;
  }

  const uploadMatch = pathname.match(
    /^\/api\/projects\/[^/]+\/(?:upload(?:\/sign|\/complete)?|references\/(?:sign|complete))$/
  );
  if (uploadMatch && request.method === "POST") {
    const limited = rateLimitedResponse(request, "project-upload", 40, 60_000);
    if (limited) return limited;
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isDashboard = url.pathname.startsWith("/dashboard");
  const isLogin = url.pathname === "/login";

  if (isDashboard && !user) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", url.pathname);
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  if (isLogin && user) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.delete("next");
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/api/gallery/confirm",
    "/api/projects/:path*/upload",
    "/api/projects/:path*/upload/sign",
    "/api/projects/:path*/upload/complete",
    "/api/projects/:path*/references/sign",
    "/api/projects/:path*/references/complete",
  ],
};
