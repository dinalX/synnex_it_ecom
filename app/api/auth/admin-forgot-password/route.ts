import { prisma } from "@/lib/db";
import { errorResponse, jsonResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { generateResetToken } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site";

const GENERIC_MESSAGE = "If that email matches an admin account, a reset link has been sent.";

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);

  const sizeCheck = validateBodySize(request);
  if (!sizeCheck.valid) return errorResponse(sizeCheck.error, 413);

  const form = await request.formData();
  const email = ((form.get("email") as string) || "").trim().toLowerCase();

  if (!email) {
    return errorResponse("Email is required", 400);
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (admin && admin.active) {
    await prisma.adminPasswordResetToken.deleteMany({ where: { adminId: admin.id, usedAt: null } });

    const { token, tokenHash } = generateResetToken();
    await prisma.adminPasswordResetToken.create({
      data: {
        adminId: admin.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${siteConfig.url}/admin/reset-password?token=${token}`;
    await sendEmail({
      to: admin.email,
      subject: "Reset your Synnex admin password",
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
      html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
    });
  }

  return jsonResponse({ message: GENERIC_MESSAGE });
}
