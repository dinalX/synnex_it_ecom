import { prisma } from "@/lib/db";
import { jsonResponse, errorResponse, getSearchParams, getPagination } from "@/lib/api";
import { buildProductWhereInput } from "@/lib/product-filters";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { page, limit, search, category, subcategory, sort } = getSearchParams(url);
  const { skip, take } = getPagination(page, limit);

  let categoryFilter: { id: string; name: string } | null = null;
  let subcategoryFilter: { id: string } | null = null;

  if (category) {
    const cat = await prisma.productCategory.findUnique({ where: { slug: category } });
    if (cat) {
      categoryFilter = { id: cat.id, name: cat.name };
    }
  }

  if (subcategory) {
    const sub = await prisma.productCategory.findUnique({ where: { slug: subcategory } });
    if (sub) {
      subcategoryFilter = { id: sub.id };
    }
  }

  const where = buildProductWhereInput({
    search,
    category: categoryFilter,
    subcategory: subcategoryFilter,
  });

  const orderBy: Record<string, string> =
    sort === "price_asc" ? { price: "asc" } :
    sort === "price_desc" ? { price: "desc" } :
    sort === "rating" ? { rating: "desc" } :
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
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return errorResponse("Failed to fetch products", 500);
  }
}
