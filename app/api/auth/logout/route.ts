import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, USER_SESSION_COOKIE } from "@/lib/auth";
import { errorResponse, validateCSRF } from "@/lib/api";

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);

  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.set(USER_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });

  return response;
}
