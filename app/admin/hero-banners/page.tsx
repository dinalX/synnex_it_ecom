import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { BannerManager } from "./banner-manager";

export default async function AdminHeroBannersPage() {
  await requireAdminPage("/admin/hero-banners", "hero-banner.view");

  const [banners, products] = await Promise.all([
    prisma.heroBanner.findMany({
      orderBy: { sortOrder: "asc" },
      include: { product: { select: { id: true, name: true } } },
    }),
    prisma.product.findMany({
      where: { published: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <BannerManager banners={banners} products={products} />
      </section>
    </main>
  );
}
