import Link from "next/link";
import {
  ArrowRight,
  Barcode,
  Fingerprint,
  Monitor,
  Package,
  Printer,
} from "lucide-react";
import { fetchCategories } from "@/lib/data";

// Maps the icon name stored on each seeded parent category to a lucide icon.
const iconByName: Record<string, React.ComponentType<{ size?: number }>> = {
  Monitor,
  Barcode,
  Fingerprint,
  Printer,
};

export async function CategoryShowcaseSection() {
  const categories = await fetchCategories();
  if (categories.length === 0) return null;

  return (
    <section className="category-showcase" aria-label="Shop by solution">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Shop by category</p>
          <h2>Browse our solutions</h2>
        </div>
        <Link href="/products" className="section-view-all">
          All products
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="category-showcase-grid">
        {categories.map((category) => {
          const Icon = iconByName[category.icon ?? ""] ?? Package;
          const childCount = category.children.length;
          return (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="category-showcase-card"
              style={{ ["--accent" as string]: category.accent }}
            >
              <span className="category-showcase-icon">
                <Icon size={26} />
              </span>
              <div className="category-showcase-body">
                <h3>{category.name}</h3>
                <p>{category.shortDescription || category.description || ""}</p>
                {childCount > 0 ? (
                  <span className="category-showcase-count">{childCount} categories</span>
                ) : null}
              </div>
              <ArrowRight size={18} className="category-showcase-arrow" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
