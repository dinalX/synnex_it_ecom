import Link from "next/link";
import { fetchCategories } from "@/lib/data";

export async function CollectionsSection() {
  const categories = await fetchCategories();

  return (
    <section className="collections" id="collections">
      <div className="section-heading">
        <p className="eyebrow">Collections</p>
        <h2>Solutions for retail, restaurants, pharmacies, and offices</h2>
      </div>
      <div className="category-row">
        {categories.map((category) => (
          <a
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="category-pill"
          >
            {category.name}
          </a>
        ))}
      </div>
    </section>
  );
}
