import { prisma } from "@/lib/db";
import type { ProductFormCategory } from "@/components/admin/product-form";

export async function getProductFormCategories(): Promise<ProductFormCategory[]> {
  const categories = await prisma.productCategory.findMany({
    where: { parentId: { not: null } },
    select: { id: true, name: true, parentId: true, parent: { select: { name: true } } },
    orderBy: [{ parent: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    parentId: cat.parentId as string,
    parentName: cat.parent?.name ?? "Other",
  }));
}
