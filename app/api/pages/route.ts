import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, validateBodySize, validateCSRF } from "@/lib/api";

export async function GET() {
  try {
    const pages = await prisma.pageContent.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
    });
    return jsonResponse({ pages });
  } catch {
    return errorResponse("Failed to fetch pages", 500);
  }
}

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  try {
    const body = await request.json() as {
      id: string;
    };

    const page = await prisma.pageContent.findUnique({
      where: { slug: body.id },
    });
    if (!page) return errorResponse("Page not found", 404);
    return jsonResponse({ page });
  } catch {
    return errorResponse("Failed to fetch page", 500);
  }
}
