import { prisma } from "@/lib/db";
import { errorResponse, jsonResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { hashResetToken } from "@/lib/reset-token";
import { hashPassword } from "@/lib/password";
import { validateNewPassword } from "@/lib/password-policy";

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);

  const sizeCheck = validateBodySize(request);
  if (!sizeCheck.valid) return errorResponse(sizeCheck.error, 413);

  const form = await request.formData();
  const token = (form.get("token") as string) || "";
  const newPassword = (form.get("newPassword") as string) || "";
  const confirmPassword = (form.get("confirmPassword") as string) || "";

  if (!token) {
    return errorResponse("Missing reset token", 400);
  }

  const policyError = validateNewPassword(newPassword, confirmPassword);
  if (policyError) {
    return errorResponse(policyError, 400);
  }

  const tokenHash = hashResetToken(token);
  const record = await prisma.adminPasswordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return errorResponse("This reset link is invalid or has expired", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: record.adminId }, data: { passwordHash } }),
    prisma.adminPasswordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return jsonResponse({ success: true });
}
