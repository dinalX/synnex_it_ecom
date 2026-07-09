import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    if (slug) {
      const page = await prisma.pageContent.findUnique({ where: { slug } });
      if (!page) return errorResponse("Page not found", 404);
      return jsonResponse({ page });
    }

    const pages = await prisma.pageContent.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
    });
    return jsonResponse({ pages });
  } catch {
    return errorResponse("Failed to fetch pages", 500);
  }
}
