import { prisma } from "@/lib/db";
import { ProductManager } from "./product-manager";
import { requireAdminPage } from "@/lib/admin-access";
import { getProductFormCategories } from "@/lib/product-categories";

export default async function AdminProductsPage() {
  await requireAdminPage("/admin/products", "product.view");
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    getProductFormCategories(),
  ]);

  return (
    <section className="admin-content-page">
      <ProductManager products={products} categories={categories} />
    </section>
  );
}
