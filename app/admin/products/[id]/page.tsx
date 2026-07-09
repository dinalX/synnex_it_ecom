import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-access";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("/admin/products");
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="admin-content-page">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Admin / products / {id}</p>
          <h1>Edit Product</h1>
        </div>
        <Link href="/admin/products" className="secondary-action">Back to list</Link>
      </div>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Editor</p>
            <h2>{product.name}</h2>
          </div>
        </div>
        <div style={{ marginTop: "24px" }}>
            <ProductForm 
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
        </div>
      </section>
    </main>
  );
}
