import { prisma } from "@/lib/db";
import { ProductManager } from "./product-manager";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";

export default async function AdminProductsPage() {
  await requireAdminPage("/admin/products", "product.view");
  const products = await prisma.product.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <ProductManager products={products} />
      </section>
    </main>
  );
}
