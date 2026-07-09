import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi("category.update");
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
      parentId: string;
      shortDescription: string;
      description: string;
      imageUrl: string;
      icon: string;
      accent: string;
      sortOrder: number;
      published: boolean;
    }>;

    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing) return errorResponse("Category not found", 404);

    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        ...(body.shortDescription !== undefined && { shortDescription: body.shortDescription || null }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.icon !== undefined && { icon: body.icon || null }),
        ...(body.accent !== undefined && { accent: body.accent }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.published !== undefined && { published: body.published }),
      },
    });

    return jsonResponse({ category });
  } catch {
    return errorResponse("Failed to update category", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi("category.delete");
  if (!admin) return errorResponse("Unauthorized", 401);
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);

  const { id } = await params;

  try {
    await prisma.productCategory.delete({ where: { id } });
    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Failed to delete category", 500);
  }
}
