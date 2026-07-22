import { prisma } from "@/lib/db";
import { errorResponse, jsonResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { generateResetToken } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site";

const GENERIC_MESSAGE = "If that email matches an account, a reset link has been sent.";

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
  // body, and roughly constant time) whether or not `email` matches a
  // customer with a password — see the identical admin-forgot-password
  // route for why this matters (timing/enumeration).
  const started = Date.now();
  const customer = await prisma.customer.findUnique({ where: { email } });

  if (customer && customer.passwordHash) {
    try {
      const { token, tokenHash } = generateResetToken();
      await prisma.$transaction([
        prisma.customerPasswordResetToken.deleteMany({ where: { customerId: customer.id, usedAt: null } }),
        prisma.customerPasswordResetToken.create({
          data: {
            customerId: customer.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        }),
      ]);

      const resetUrl = `${siteConfig.url}/reset-password?token=${token}`;
      sendEmail({
        to: customer.email,
        subject: "Reset your Synnex account password",
        text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
        html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
      }).catch((e) => console.error("Failed to send customer password reset email", e));
    } catch (e) {
      console.error("Failed to process customer password reset request", e);
    }
  }

  const MIN_RESPONSE_MS = 200;
  const elapsed = Date.now() - started;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
  }

  return jsonResponse({ message: GENERIC_MESSAGE });
}
