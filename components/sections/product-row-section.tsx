import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@prisma/client";
import { ProductCard } from "@/components/product-card";

export function ProductRowSection({
  eyebrow,
  title,
  viewAllHref,
  viewAllLabel = "View all",
  products,
  id,
}: {
  eyebrow: string;
  title: string;
  viewAllHref: string;
  viewAllLabel?: string;
  products: Product[];
  id?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="product-section" id={id}>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <Link href={viewAllHref} className="section-view-all">
          {viewAllLabel}
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="product-grid product-grid-4x2">
        {products.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </section>
  );
}
