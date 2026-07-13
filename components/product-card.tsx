"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Eye, Loader2, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { QuickViewDialog } from "@/components/quick-view-dialog";
import { formatCurrency } from "@/lib/api-client";
import { kokoMonthlyInstallment } from "@/lib/installments";
import type { Product } from "@prisma/client";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      await addItem(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    } finally {
      setAdding(false);
    }
  }

  const discount = product.compareAt && product.compareAt > product.price
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;
  const inStock = product.inventory > 0;
  const shortDesc = product.shortDescription
    || (product.description.includes(".")
      ? product.description.split(".")[0] + "."
      : product.description.slice(0, 120) + (product.description.length > 120 ? "..." : ""));

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-image-link">
        <Image
          src={product.image}
          alt={product.name}
          width={720}
          height={560}
          sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
        />
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
      <button
        type="button"
        className="quick-view-button"
        onClick={() => setQuickViewOpen(true)}
      >
        <Eye size={14} />
        Quick view
      </button>
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
        <p className="product-installment">
          or 3 × {formatCurrency(kokoMonthlyInstallment(product.price))} with Koko
        </p>
        <p className={`product-stock ${inStock ? "in-stock" : "out-of-stock"}`}>
          {inStock
            ? product.inventory <= 10
              ? `Only ${product.inventory} left in stock`
              : "In stock"
            : "Out of stock"}
        </p>
        <button
          className={`add-to-cart${added ? " is-added" : ""}`}
          onClick={handleAdd}
          disabled={adding || !inStock}
          aria-busy={adding}
        >
          {adding ? (
            <Loader2 size={16} className="spin" />
          ) : added ? (
            <Check size={16} />
          ) : (
            <ShoppingCart size={16} />
          )}
          {adding ? "Adding…" : added ? "Added" : inStock ? "Add to Cart" : "Out of stock"}
        </button>
      </div>
      {quickViewOpen ? (
        <QuickViewDialog product={product} onClose={() => setQuickViewOpen(false)} />
      ) : null}
    </article>
  );
}
