import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
let rateLimitCleanupAt = Date.now() + 300_000;

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now < rateLimitCleanupAt) return;
  rateLimitCleanupAt = now + 300_000;
  for (const [key, record] of rateLimitMap) {
    if (record.resetAt < now) rateLimitMap.delete(key);
  }
  if (rateLimitMap.size > 10_000) rateLimitMap.clear();
}

function checkRateLimit(ip: string): boolean {
  cleanupRateLimitMap();
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count += 1;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/forgot-password") ||
    pathname.startsWith("/admin/reset-password")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin") || pathname.startsWith("/admin")) {
    const admin = await verifySessionToken(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
      "admin",
    );

    if (!admin) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
      }

      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/auth/admin-forgot-password",
    "/api/auth/admin-reset-password",
  ],
};
