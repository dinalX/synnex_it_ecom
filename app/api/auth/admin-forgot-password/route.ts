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

  // Both branches below are wrapped so the response is identical (status,
  // body, and roughly constant time) whether or not `email` matches an
  // active admin — a real timing gap or an unhandled exception on the
  // "found" path would otherwise let an attacker distinguish valid admin
  // emails from invalid ones. The email send itself is fire-and-forget
  // (not awaited) so a slow SMTP round trip on the "found" path can't
  // reintroduce that same timing gap.
  const started = Date.now();
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (admin && admin.active) {
    try {
      const { token, tokenHash } = generateResetToken();
      await prisma.$transaction([
        prisma.adminPasswordResetToken.deleteMany({ where: { adminId: admin.id, usedAt: null } }),
        prisma.adminPasswordResetToken.create({
          data: {
            adminId: admin.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        }),
      ]);

      const resetUrl = `${siteConfig.url}/admin/reset-password?token=${token}`;
      sendEmail({
        to: admin.email,
        subject: "Reset your Synnex admin password",
        text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
        html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
      }).catch((e) => console.error("Failed to send admin password reset email", e));
    } catch (e) {
      console.error("Failed to process admin password reset request", e);
    }
  }

  const MIN_RESPONSE_MS = 200;
  const elapsed = Date.now() - started;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
  }

  return jsonResponse({ message: GENERIC_MESSAGE });
}
