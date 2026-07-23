import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { CategoryManager, type CategoryRow } from "./category-manager";

export default async function AdminCategoriesPage() {
  await requireAdminPage("/admin/categories", "category.view");

  const categories = await prisma.productCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      icon: true,
      accent: true,
      shortDescription: true,
      published: true,
    },
  });

  // Arbitrary-depth tree (the taxonomy actually goes 3 levels deep in
  // places, e.g. Barcode Solution > Barcode Label Roll > Thermal Transfer
  // Wax Ribbon Roll), not just top-level + one layer of children.
  const byId = new Map<string, CategoryRow>(categories.map((cat) => [cat.id, { ...cat, children: [] }]));
  const roots: CategoryRow[] = [];
  for (const cat of categories) {
    const row = byId.get(cat.id)!;
    if (cat.parentId && byId.has(cat.parentId)) {
      byId.get(cat.parentId)!.children.push(row);
    } else {
      roots.push(row);
    }
  }

  return (
    <section className="admin-content-page">
      <CategoryManager categories={roots} />
    </section>
  );
}
