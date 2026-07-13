"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { formatCurrency } from "@/lib/api-client";
import type { Product } from "@prisma/client";

export type CollectionTab = {
  key: string;
  label: string;
  href: string;
  products: Product[];
};

export function FeaturedCollectionsTabs({
  tabs,
  promo,
}: {
  tabs: CollectionTab[];
  promo: Product | null;
}) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const active = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];
  const promoDiscount =
    promo?.compareAt && promo.compareAt > promo.price
      ? Math.round(((promo.compareAt - promo.price) / promo.compareAt) * 100)
      : 0;

  return (
    <>
      <div className="fc-tabs" role="tablist" aria-label="Featured collections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active.key}
            className={`sub-pill${tab.key === active.key ? " active" : ""}`}
            onClick={() => setActiveKey(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="fc-layout">
        {promo ? (
          <Link href={`/products/${promo.slug}`} className="fc-promo-tile">
            <Image
              src={promo.image}
              alt={promo.name}
              fill
              sizes="(max-width: 980px) 100vw, 300px"
            />
            <span className="fc-promo-overlay">
              {promoDiscount > 0 ? (
                <span className="product-discount-badge">-{promoDiscount}%</span>
              ) : null}
              <strong>{promo.name}</strong>
              <span className="fc-promo-price">
                {formatCurrency(promo.price)}
                {promo.compareAt && promo.compareAt > promo.price ? (
                  <del>{formatCurrency(promo.compareAt)}</del>
                ) : null}
              </span>
              <span className="fc-promo-cta">
                Shop this deal
                <ArrowRight size={15} />
              </span>
            </span>
          </Link>
        ) : null}

        <div className="fc-grid" role="tabpanel" aria-label={active.label}>
          {active.products.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
          {active.products.length === 0 ? (
            <p className="fc-empty">No products in this collection yet.</p>
          ) : null}
        </div>
      </div>

      <Link href={active.href} className="section-view-all fc-view-all">
        View all {active.label.toLowerCase()}
        <ArrowRight size={16} />
      </Link>
    </>
  );
}
