"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Loader2, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/api-client";
import type { Product } from "@prisma/client";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(product);
    } finally {
      setAdding(false);
    }
  }

  const discount = product.compareAt && product.compareAt > product.price
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;
  const shortDesc = product.shortDescription
    || (product.description.includes(".")
      ? product.description.split(".")[0] + "."
      : product.description.slice(0, 120) + (product.description.length > 120 ? "..." : ""));

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-image-link">
        <Image src={product.image} alt={product.name} width={720} height={560} />
        <span className="product-category-badge" style={{ backgroundColor: product.accent }}>
          {product.category}
        </span>
        {discount > 0 && (
          <span className="product-discount-badge">-{discount}%</span>
        )}
        <span className="product-rating-badge">
          <Star size={11} fill="currentColor" />
          {product.rating}
        </span>
      </Link>
      <div className="product-card-body">
        <div className="product-card-title-wrap">
          <Link href={`/products/${product.slug}`}>
            <h3>{product.name}</h3>
          </Link>
        </div>
        <p className="product-card-desc">
          {shortDesc}
        </p>
        <div className="product-card-price">
          {product.compareAt ? <del>{formatCurrency(product.compareAt)}</del> : null}
          <strong>{formatCurrency(product.price)}</strong>
        </div>
        <button className="add-to-cart" onClick={handleAdd} disabled={adding} aria-busy={adding}>
          {adding ? <Loader2 size={16} className="spin" /> : <ShoppingCart size={16} />}
          {adding ? "Adding…" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
