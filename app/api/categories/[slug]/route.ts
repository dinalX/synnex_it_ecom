import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const category = await prisma.productCategory.findUnique({
      where: { slug },
      include: {
        children: { orderBy: { sortOrder: "asc" } },
        parent: true,
      },
    });
    if (!category) return errorResponse("Category not found", 404);
    return jsonResponse({ category });
  } catch {
    return errorResponse("Failed to fetch category", 500);
  }
}
