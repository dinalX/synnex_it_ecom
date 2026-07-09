import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, getCategoryTree, validateBodySize, validateCSRF } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) return errorResponse("Unauthorized", 401);

  try {
    const categories = await prisma.productCategory.findMany({
      include: { children: { orderBy: { sortOrder: "asc" } }, parent: true },
      orderBy: { sortOrder: "asc" },
    });
    return jsonResponse({ categories, tree: await getCategoryTree() });
  } catch {
    return errorResponse("Failed to fetch categories", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) return errorResponse("Unauthorized", 401);
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);
  const bodyCheck = validateBodySize(request);
  if (!bodyCheck.valid) return errorResponse(bodyCheck.error, 413);

  try {
    const body = await request.json() as {
      name: string;
      slug: string;
      parentId?: string;
      shortDescription?: string;
      description?: string;
      imageUrl?: string;
      icon?: string;
      accent?: string;
      sortOrder?: number;
      published?: boolean;
    };

    if (!body.name || !body.slug) {
      return errorResponse("name and slug are required");
    }

    const category = await prisma.productCategory.create({
      data: {
        name: body.name,
        slug: body.slug,
        parentId: body.parentId || null,
        shortDescription: body.shortDescription || null,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        icon: body.icon || null,
        accent: body.accent || "#1f8a70",
        sortOrder: body.sortOrder || 0,
        published: body.published ?? true,
      },
    });

    return jsonResponse({ category }, 201);
  } catch {
    return errorResponse("Failed to create category", 500);
  }
}
