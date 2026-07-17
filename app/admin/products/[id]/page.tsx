import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { getProductFormCategories } from "@/lib/product-categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("/admin/products", "product.view");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    getProductFormCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / products / {id}</p>
            <h1 className="text-2xl font-bold text-foreground">Edit product</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/products">Back to list</Link>
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              categories={categories}
              initialData={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                category: product.category,
                price: product.price,
                compareAt: product.compareAt ?? undefined,
                inventory: product.inventory,
                sku: product.sku ?? undefined,
                image: product.image,
                accent: product.accent,
                description: product.description,
                shortDescription: product.shortDescription ?? undefined,
                specs: product.specs,
                published: product.published,
              }}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
