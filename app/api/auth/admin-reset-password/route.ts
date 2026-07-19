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

  // Claim the token atomically first (usedAt: null guards against two
  // concurrent submissions of the same token both passing validation and
  // both updating the password) before doing anything else with it.
  const claim = await prisma.adminPasswordResetToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  if (claim.count !== 1) {
    return errorResponse("This reset link is invalid or has expired", 400);
  }

  const record = await prisma.adminPasswordResetToken.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (!record || !record.admin.active) {
    return errorResponse("This reset link is invalid or has expired", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({ where: { id: record.adminId }, data: { passwordHash } });

  return jsonResponse({ success: true });
}
