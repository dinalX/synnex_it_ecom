"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@prisma/client";
import { ProductCard } from "@/components/product-card";

export function ProductCarouselRow({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateArrows, products]);

  function scrollByCard(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(":scope > *");
    const amount = (card?.offsetWidth ?? 260) + 20;
    el.scrollBy({ left: direction * amount * 2, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div className="product-carousel-wrap">
      <button
        type="button"
        className="product-carousel-arrow product-carousel-arrow-prev"
        aria-label="Scroll to previous products"
        onClick={() => scrollByCard(-1)}
        disabled={!canScrollPrev}
      >
        <ChevronLeft size={18} />
      </button>
      <div
        className="product-carousel"
        ref={trackRef}
        onScroll={updateArrows}
        role="region"
        aria-label="Products"
      >
        {products.map((product) => (
          <div className="product-carousel-item" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="product-carousel-arrow product-carousel-arrow-next"
        aria-label="Scroll to next products"
        onClick={() => scrollByCard(1)}
        disabled={!canScrollNext}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
