import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi("product.update");
  if (!admin) return errorResponse("Unauthorized", 401);
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  const { id } = await params;

  try {
    const body = await request.json() as Partial<{
      name: string;
      slug: string;
      category: string;
      categoryId: string;
      price: number;
      compareAt: number;
      description: string;
      shortDescription: string;
      specs: string;
      image: string;
      accent: string;
      inventory: number;
      sku: string;
      published: boolean;
    }>;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return errorResponse("Product not found", 404);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.compareAt !== undefined && { compareAt: body.compareAt }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.shortDescription !== undefined && { shortDescription: body.shortDescription }),
        ...(body.specs !== undefined && { specs: body.specs }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.accent !== undefined && { accent: body.accent }),
        ...(body.inventory !== undefined && { inventory: body.inventory }),
        ...(body.sku !== undefined && { sku: body.sku }),
        ...(body.published !== undefined && { published: body.published }),
      },
      include: { categoryRef: true, images: true },
    });

    return jsonResponse({ product });
  } catch {
    return errorResponse("Failed to update product", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi("product.delete");
  if (!admin) return errorResponse("Unauthorized", 401);
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Failed to delete product", 500);
  }
}
