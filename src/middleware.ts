import { createServerClient } from "@supabase/ssr";
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
import {
  hasSupabaseAuthCookie,
  isAuthGuardRoute,
  readMiddlewareSessionUser,
} from "./lib/supabase/middlewareAuth";

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

function nextResponse(request: NextRequest) {
  return NextResponse.next({ request: { headers: request.headers } });
}

function createReadonlyMiddlewareSupabase(request: NextRequest) {
  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set() {
        // Redirect-only routes; session refresh happens in dashboard layout.
      },
      remove() {
        // Redirect-only routes; session refresh happens in dashboard layout.
      },
    },
  });
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

  if (!isAuthGuardRoute(pathname)) {
    return applySecurityHeaders(nextResponse(request));
  }

  const url = request.nextUrl;
  const isHome = pathname === "/";
  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname === "/login";
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  if (isLogin && !hasAuthCookie) {
    return applySecurityHeaders(nextResponse(request));
  }

  if (isHome && !hasAuthCookie) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  if (isDashboard && !hasAuthCookie) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", url.pathname);
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  // Dashboard: pass through when cookies exist; layout validates + refreshes session.
  if (isDashboard) {
    return applySecurityHeaders(nextResponse(request));
  }

  // Home / login with cookies: read session locally (no Auth server round trip).
  const supabase = createReadonlyMiddlewareSupabase(request);
  const user = await readMiddlewareSessionUser(supabase);

  if (isHome) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = user ? "/dashboard" : "/login";
    redirectUrl.search = "";
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  if (isLogin && user) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.delete("next");
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  return applySecurityHeaders(nextResponse(request));
}

export const config = {
  matcher: [
    "/",
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
