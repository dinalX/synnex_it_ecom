import { prisma } from "@/lib/db";
import { buildProductWhereInput } from "@/lib/product-filters";

export async function fetchProducts(params?: {
  search?: string;
  category?: string;
  subcategory?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page || 1;
  const limit = Math.min(params?.limit || 20, 100);
  const skip = (page - 1) * limit;

  let categoryFilter: { id: string; name: string } | null = null;
  let subcategoryFilter: { id: string } | null = null;

  if (params?.subcategory) {
    const sub = await prisma.productCategory.findUnique({ where: { slug: params.subcategory } });
    if (sub) {
      subcategoryFilter = { id: sub.id };
    }
  }

  if (params?.category) {
    const cat = await prisma.productCategory.findUnique({ where: { slug: params.category } });
    if (cat) {
      categoryFilter = { id: cat.id, name: cat.name };
    }
  }

  const where = buildProductWhereInput({
    search: params?.search,
    category: categoryFilter,
    subcategory: subcategoryFilter,
  });

  const orderBy: Record<string, string> =
    params?.sort === "price_asc" ? { price: "asc" } :
    params?.sort === "price_desc" ? { price: "desc" } :
    params?.sort === "rating" ? { rating: "desc" } :
    params?.sort === "name" ? { name: "asc" } :
    { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { categoryRef: true, images: { orderBy: { sortOrder: "asc" } } },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function fetchProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      categoryRef: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function fetchCategories() {
  return prisma.productCategory.findMany({
    where: { published: true, parentId: null },
    include: {
      children: {
        where: { published: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function fetchCategory(slug: string) {
  return prisma.productCategory.findUnique({
    where: { slug },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
      parent: true,
    },
  });
}
