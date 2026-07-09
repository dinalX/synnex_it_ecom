import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AdminUser, Customer } from "@prisma/client";
import { prisma } from "@/lib/db";
import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { ADMIN_SESSION_COOKIE, USER_SESSION_COOKIE, createSessionToken, type SessionRole } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

async function parseRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, string>;
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries()) as Record<string, string>;
}

function safeRedirect(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  const body = await parseRequest(request);
  const role = body.role === "admin" ? "admin" : "user";
  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";
  const redirectTo = safeRedirect(body.redirectTo || (role === "admin" ? "/admin" : "/checkout"));
  let customer: Customer | null = null;
  let admin: AdminUser | null = null;

  if (!email || password.length < 4) {
    return NextResponse.redirect(new URL(`${role === "admin" ? "/admin/login" : "/login"}?error=invalid`, request.url));
  }

  if (role === "admin") {
    admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.active) {
      return NextResponse.redirect(new URL(`/admin/login?error=invalid&redirect=${encodeURIComponent(redirectTo)}`, request.url));
    }

    const verification = await verifyPassword(password, admin.passwordHash);
    if (!verification.valid) {
      return NextResponse.redirect(new URL(`/admin/login?error=invalid&redirect=${encodeURIComponent(redirectTo)}`, request.url));
    }

    if (verification.upgradedHash) {
      await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: verification.upgradedHash } });
    }

    await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  } else {
    customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      const passwordHash = await hashPassword(password);
      customer = await prisma.customer.create({
        data: { email, name: email.split("@")[0] || "User", passwordHash },
      });
    } else if (!customer.passwordHash) {
      return NextResponse.redirect(new URL(`/login?error=invalid`, request.url));
    } else {
      const verification = await verifyPassword(password, customer.passwordHash);
      if (!verification.valid) {
        return NextResponse.redirect(new URL(`/login?error=invalid`, request.url));
      }

      if (verification.upgradedHash) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { passwordHash: verification.upgradedHash },
        });
      }
    }

    await prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
  }

  const token = await createSessionToken({
    id: customer?.id || admin?.id,
    email,
    name: customer?.name || admin?.name || email.split("@")[0] || "Synnex user",
    role: role as SessionRole,
  });
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

export async function GET() {
  return NextResponse.json({ ok: true });
}
