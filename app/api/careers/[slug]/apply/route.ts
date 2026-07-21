import { prisma } from "@/lib/db";
import { errorResponse, jsonResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { isLinkedInProfileUrl, isValidEmail, isValidHttpUrl } from "@/lib/form-validation";
import { checkUrlReachable } from "@/lib/url-check";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getRequestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1";
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  const { slug } = await params;
  const job = await prisma.jobPost.findUnique({ where: { slug } });
  if (!job || !job.published) return errorResponse("Job post not found", 404);

  let body: { name?: string; email?: string; phone?: string; linkedinUrl?: string; cvUrl?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const phone = (body.phone || "").trim() || null;
  const linkedinUrl = (body.linkedinUrl || "").trim() || null;
  const cvUrl = (body.cvUrl || "").trim();
  const message = (body.message || "").trim() || null;

  if (!name || !email) return errorResponse("Name and email are required");
  if (!isValidEmail(email)) return errorResponse("Enter a valid email address");
  if (linkedinUrl && !isLinkedInProfileUrl(linkedinUrl)) {
    return errorResponse("Enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/your-name)");
  }
  if (!cvUrl) return errorResponse("CV URL is required");
  if (!isValidHttpUrl(cvUrl)) return errorResponse("Enter a valid CV URL starting with http:// or https://");

  // Confirm the CV link actually resolves to something (a private/login-gated
  // CV still counts — see checkUrlReachable). LinkedIn is format-validated only:
  // it aggressively blocks server-side probes, so a fetch would give false
  // negatives on genuine profile URLs.
  const cvCheck = await checkUrlReachable(cvUrl);
  if (!cvCheck.ok) {
    return errorResponse(`We couldn't open your CV link — ${cvCheck.reason}. Please check it and try again.`);
  }

  const ipAddress = getRequestIp(request);
  const recent = await prisma.jobApplication.findFirst({
    where: { ipAddress, createdAt: { gte: new Date(Date.now() - WEEK_MS) } },
  });
  if (recent) {
    return errorResponse("You can only submit one job application per week.", 429);
  }

  await prisma.jobApplication.create({
    data: { jobPostId: job.id, name, email, phone, linkedinUrl, cvUrl, message, ipAddress },
  });

  return jsonResponse({ success: true }, 201);
}
