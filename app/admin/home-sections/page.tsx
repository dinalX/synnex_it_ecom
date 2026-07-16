import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { HomeSectionManager } from "./home-section-manager";

const FIXED_SECTIONS = [
  { key: "top-deals", label: "Top Deals" },
  { key: "top-rated", label: "Top Rated" },
  { key: "new-arrivals", label: "New Arrivals" },
];

export default async function AdminHomeSectionsPage() {
  await requireAdminPage("/admin/home-sections", "home-section.view");

  const [categories, items, products] = await Promise.all([
    prisma.productCategory.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.homeSectionItem.findMany({
      orderBy: { sortOrder: "asc" },
      include: { product: { select: { id: true, name: true, image: true, price: true } } },
    }),
    prisma.product.findMany({
      where: { published: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true },
    }),
  ]);

  const sections = [...FIXED_SECTIONS, ...categories.map((c) => ({ key: c.slug, label: c.name }))];

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <HomeSectionManager sections={sections} items={items} products={products} />
      </section>
    </main>
  );
}
