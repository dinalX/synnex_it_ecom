import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { fetchProducts } from "@/lib/data";

export async function ProductGridSection() {
  const { products: latestProducts } = await fetchProducts({ sort: "newest", limit: 8 });

  return (
    <section className="product-section" id="shop">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2>Latest products</h2>
        </div>
        <Link href="/admin">Manage inventory</Link>
      </div>
      <div className="product-grid product-grid-4x2">
        {latestProducts.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </section>
  );
}
