import type { Metadata } from "next";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { fetchProducts, fetchCategories } from "@/lib/data";
import { Search, SlidersHorizontal, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Products - Synnex IT Solution",
  description: "Browse our catalog of POS machines, barcode scanners, biometric security, and IT hardware.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    subcategory?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "name", label: "Name A-Z" },
];

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, subcategory, search, sort, page } = await searchParams;

  const [{ products, pagination }, categories] = await Promise.all([
    fetchProducts({
      search,
      category,
      subcategory,
      sort,
      page: page ? Number(page) : 1,
      limit: 12,
    }),
    fetchCategories(),
  ]);

  const activeCat = category ? categories.find((c) => c.slug === category) : null;
  const activeSub = subcategory && activeCat
    ? (activeCat.children || []).find((s) => s.slug === subcategory)
    : null;

  const heading = activeSub?.name || activeCat?.name || "All Products";
  const description = activeCat
    ? activeCat.shortDescription || activeCat.description || ""
    : "Browse our complete catalog of POS hardware, barcode solutions, biometric security, networking, and IT equipment.";

  const hasFilters = category || subcategory || search;

  function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [1];
    if (current > 3) pages.push("ellipsis");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("ellipsis");
    pages.push(total);
    return pages;
  }

  function buildUrl(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const cat = "category" in overrides ? overrides.category : category;
    const sub = "subcategory" in overrides ? overrides.subcategory : subcategory;
    const s = "search" in overrides ? overrides.search : search;
    const so = "sort" in overrides ? overrides.sort : sort;
    const filterChanged = "category" in overrides || "subcategory" in overrides || "search" in overrides || "sort" in overrides;
    const p = "page" in overrides ? overrides.page : filterChanged ? undefined : String(pagination.page);
    if (cat) sp.set("category", cat);
    if (sub) sp.set("subcategory", sub);
    if (s) sp.set("search", s);
    if (so && so !== "newest") sp.set("sort", so);
    if (p && p !== "1") sp.set("page", p);
    const q = sp.toString();
    return `/products${q ? `?${q}` : ""}`;
  }

  return (
    <main className="products-page">
      {/* Hero */}
      <section className="products-hero">
        <div className="products-hero-inner">
          {search ? (
            <>
              <p className="eyebrow">Search results</p>
              <h1>&ldquo;{search}&rdquo;</h1>
              <p>{pagination.total} product{pagination.total !== 1 ? "s" : ""} matching your search.</p>
            </>
          ) : (
            <>
              <p className="eyebrow">Products</p>
              <h1>{heading}</h1>
              <p>{description}</p>
            </>
          )}
        </div>
      </section>

      <div className="products-layout">
        {/* Sidebar Filters */}
        <aside className="products-sidebar">
          <input type="checkbox" id="filterToggle" className="filter-toggle-input" />
          <label htmlFor="filterToggle" className="filter-toggle-label">
            <SlidersHorizontal size={16} /> Filters &amp; Search
          </label>
          <div className="filter-section">
            <div className="filter-header">
              <h3><SlidersHorizontal size={16} /> Filters</h3>
              {hasFilters && (
                <Link href="/products" className="filter-clear">Clear all</Link>
              )}
            </div>

            {/* Search */}
            <div className="filter-group">
              <label className="filter-label">Search</label>
              <form action="/products" method="get" className="filter-search">
                <Search size={16} />
                <input
                  name="search"
                  defaultValue={search || ""}
                  placeholder="Search products..."
                />
                {category && <input type="hidden" name="category" value={category} />}
                {subcategory && <input type="hidden" name="subcategory" value={subcategory} />}
                {sort && <input type="hidden" name="sort" value={sort} />}
              </form>
            </div>

            {/* Categories */}
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <div className="filter-options">
                <Link
                  href={buildUrl({ category: undefined, subcategory: undefined })}
                  className={`filter-option ${!category ? "active" : ""}`}
                >
                  All Categories
                </Link>
                {categories.map((cat) => {
                  const isParentActive = category === cat.slug && !subcategory;
                  return (
                    <div key={cat.slug} className="filter-cat-group">
                      <Link
                        href={buildUrl({ category: cat.slug, subcategory: undefined })}
                        className={`filter-option ${isParentActive ? "active" : ""}`}
                      >
                        {cat.name}
                      </Link>
                      {(cat.children || []).map((sub) => (
                        <Link
                          key={sub.slug}
                          href={buildUrl({ category: cat.slug, subcategory: sub.slug })}
                          className={`filter-option filter-sub ${subcategory === sub.slug ? "active" : ""}`}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sort */}
            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <div className="filter-options">
                {sortOptions.map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildUrl({ sort: opt.value === "newest" ? undefined : opt.value })}
                    className={`filter-option ${sort === opt.value || (!sort && opt.value === "newest") ? "active" : ""}`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Active filters */}
            {hasFilters && (
              <div className="filter-tags">
                {activeCat && (
                  <Link href={buildUrl({ category: undefined, subcategory: undefined })} className="filter-tag">
                    {activeCat.name} <X size={12} />
                  </Link>
                )}
                {activeSub && (
                  <Link href={buildUrl({ subcategory: undefined })} className="filter-tag">
                    {activeSub.name} <X size={12} />
                  </Link>
                )}
                {search && (
                  <Link href={buildUrl({ search: undefined })} className="filter-tag">
                    &quot;{search}&quot; <X size={12} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Product Grid */}
        <section className="products-content">
          <div className="products-toolbar">
            <p className="products-count">
              {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
            </p>
          </div>

          {products.length === 0 ? (
            <div className="products-empty">
              <Search size={40} className="products-empty-icon" />
              <h2>No products found</h2>
              <p>
                {search
                  ? <>No results for &ldquo;{search}&rdquo;. Try a different term or browse categories.</>
                  : "No products match your current filters."}
              </p>
              <div className="products-empty-actions">
                {hasFilters && (
                  <Link href="/products" className="primary-action">
                    Clear all filters
                  </Link>
                )}
                <Link href="/products" className="secondary-action">
                  Browse all products
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="products-pagination">
                  {pagination.page > 1 && (
                    <Link
                      href={buildUrl({ page: String(pagination.page - 1) })}
                      className="secondary-action"
                    >
                      Previous
                    </Link>
                  )}
                  <div className="pagination-pages">
                    {getPageNumbers(pagination.page, pagination.totalPages).map((p, index) =>
                      p === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">&hellip;</span>
                      ) : (
                        <Link
                          key={p}
                          href={buildUrl({ page: String(p) })}
                          className={`pagination-page ${p === pagination.page ? "active" : ""}`}
                        >
                          {p}
                        </Link>
                      )
                    )}
                  </div>
                  {pagination.page < pagination.totalPages && (
                    <Link
                      href={buildUrl({ page: String(pagination.page + 1) })}
                      className="secondary-action"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
