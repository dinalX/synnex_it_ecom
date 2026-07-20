import type { Prisma } from "@prisma/client";

type ProductCategoryFilter = { id: string; name: string };
type ProductSubcategoryFilter = { name: string };

export function buildProductWhereInput({
  search,
  category,
  subcategory,
}: {
  search?: string;
  category?: ProductCategoryFilter | null;
  subcategory?: ProductSubcategoryFilter | null;
}): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { published: true };
  const andClauses: Prisma.ProductWhereInput[] = [];

  if (search) {
    andClauses.push({
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    });
  }

  if (category) {
    andClauses.push({
      OR: [
        { categoryId: category.id },
        { category: category.name },
      ],
    });
  }

  if (subcategory) {
    // Product.categoryId always stores the top-level parent category's id
    // (see prisma/seed.ts and app/admin/(panel)/products/actions.ts) — a
    // subcategory's own id is never stored on Product. Product.category
    // holds the subcategory's name instead, so that's what narrows here.
    andClauses.push({ category: subcategory.name });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  return where;
}
