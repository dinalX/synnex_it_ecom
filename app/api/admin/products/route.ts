import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, getSearchParams, getPagination, validateBodySize, validateCSRF } from "@/lib/api";
import { requireAdminApi } from "@/lib/admin-access";

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (!admin) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const { page, limit, search, category, sort } = getSearchParams(url);
  const { skip, take } = getPagination(page, limit);

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
    ];
  }
  if (category) where.category = category;

  const orderBy: Record<string, string> =
    sort === "price_asc" ? { price: "asc" } :
    sort === "price_desc" ? { price: "desc" } :
    sort === "name" ? { name: "asc" } :
    { createdAt: "desc" };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { categoryRef: true, images: { orderBy: { sortOrder: "asc" } } },
        skip,
        take,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return jsonResponse({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return errorResponse("Failed to fetch products", 500);
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
      category?: string;
      categoryId?: string;
      price: number;
      compareAt?: number;
      description: string;
      shortDescription?: string;
      specs?: string;
      image?: string;
      accent?: string;
      inventory?: number;
      sku?: string;
    };

    if (!body.name || !body.slug || body.price == null) {
      return errorResponse("name, slug, and price are required");
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        category: body.category || "",
        categoryId: body.categoryId || null,
        price: body.price,
        compareAt: body.compareAt || null,
        description: body.description || "",
        shortDescription: body.shortDescription || null,
        specs: body.specs || "",
        image: body.image || "/products/placeholder.svg",
        accent: body.accent || "#1f8a70",
        inventory: body.inventory || 0,
        sku: body.sku || null,
        published: true,
      },
      include: { categoryRef: true, images: true },
    });

    return jsonResponse({ product }, 201);
  } catch (e) {
    return errorResponse("Failed to create product", 500);
  }
}
