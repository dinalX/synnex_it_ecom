import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        categoryRef: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product) return errorResponse("Product not found", 404);
    return jsonResponse({ product });
  } catch {
    return errorResponse("Failed to fetch product", 500);
  }
}
