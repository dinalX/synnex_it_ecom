import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { createSessionRedirect } from "@/lib/session-response";
import { recordAuditLog } from "@/lib/audit-log";

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
  const loginPath = role === "admin" ? "/admin/login" : "/login";
  const redirectTo = safeRedirect(body.redirectTo || (role === "admin" ? "/admin" : "/checkout"));

  const invalidRedirect = () =>
    NextResponse.redirect(
      new URL(`${loginPath}?error=invalid&redirect=${encodeURIComponent(redirectTo)}`, request.url),
    );

  if (!email || !password) {
    return invalidRedirect();
  }

  if (role === "admin") {
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.active) return invalidRedirect();

    const verification = await verifyPassword(password, admin.passwordHash);
    if (!verification.valid) return invalidRedirect();

    if (verification.upgradedHash) {
      await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: verification.upgradedHash } });
    }
    await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

    await recordAuditLog({ id: admin.id }, "auth.login", "AdminUser", admin.id, { email });

    return createSessionRedirect(
      request,
      "admin",
      { id: admin.id, email, name: admin.name || email.split("@")[0] || "Admin" },
      redirectTo,
    );
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !customer.passwordHash) return invalidRedirect();

  const verification = await verifyPassword(password, customer.passwordHash);
  if (!verification.valid) return invalidRedirect();

  if (verification.upgradedHash) {
    await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash: verification.upgradedHash } });
  }
  await prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });

  return createSessionRedirect(request, "user", { id: customer.id, email, name: customer.name }, redirectTo);
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
