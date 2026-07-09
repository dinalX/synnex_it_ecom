import type { Prisma } from "@prisma/client";

type ProductCategoryFilter = { id: string; name: string };
type ProductSubcategoryFilter = { id: string };

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
    andClauses.push({ categoryId: subcategory.id });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  return where;
}
