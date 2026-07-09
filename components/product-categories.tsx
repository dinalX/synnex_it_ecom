"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CategoryPill } from "@/components/category-pill";
import { useHoverDropdown } from "@/components/use-hover-dropdown";

type Subcategory = { id: string; slug: string; name: string };
type Category = { id: string; slug: string; name: string; children?: Subcategory[] };

function ProductCategoriesInner() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const activeSubcategory = searchParams.get("subcategory") || "";
  const { openId, open, scheduleClose, cancelClose } = useHoverDropdown();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories?parents=true")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  return (
    <div className="categories-bar" role="navigation" aria-label="Product categories">
      <div className="categories-scroll">
        {categories.map((cat) => (
          <CategoryPill
            key={cat.slug}
            category={cat}
            isActive={activeCategory === cat.slug || activeSubcategory === cat.slug}
            isOpen={openId === cat.slug}
            onOpen={open}
            onScheduleClose={scheduleClose}
            onCancelClose={cancelClose}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductCategories() {
  return (
    <Suspense fallback={<div className="categories-bar" />}>
      <ProductCategoriesInner />
    </Suspense>
  );
}
