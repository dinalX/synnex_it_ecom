import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, USER_SESSION_COOKIE, createSessionToken, type SessionRole } from "@/lib/auth";

export async function createSessionRedirect(
  request: Request,
  role: SessionRole,
  user: { id: string; email: string; name: string },
  redirectTo: string,
) {
  const token = await createSessionToken({ id: user.id, email: user.email, name: user.name, role });
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  const cookieName = role === "admin" ? ADMIN_SESSION_COOKIE : USER_SESSION_COOKIE;
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
