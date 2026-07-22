import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { createSessionRedirect } from "@/lib/session-response";

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
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const phone = body.phone?.trim() || null;
  const password = body.password || "";
  const confirmPassword = body.confirmPassword;
  const redirectTo = safeRedirect(body.redirectTo || "/checkout");

  const fail = (error: string) =>
    NextResponse.redirect(
      new URL(`/register?error=${error}&redirect=${encodeURIComponent(redirectTo)}`, request.url),
    );

  if (!email || !name) return fail("invalid");
  if (password.length < 6) return fail("weak");
  if (confirmPassword !== undefined && confirmPassword !== password) return fail("mismatch");

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return fail("exists");

  const passwordHash = await hashPassword(password);
  const customer = await prisma.customer.create({ data: { email, name, phone, passwordHash } });

  return createSessionRedirect(request, "user", { id: customer.id, email, name: customer.name }, redirectTo);
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
