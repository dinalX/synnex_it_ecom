import Link from "next/link";
import { ArrowRight, Barcode, Fingerprint, Monitor, Package, Printer } from "lucide-react";
import { fetchCategories } from "@/lib/data";

const iconByName: Record<string, React.ComponentType<{ size?: number }>> = {
  Monitor,
  Barcode,
  Fingerprint,
  Printer,
};

/** Compact strip under the hero: one tile per featured main category. */
export async function QuickLinksSection() {
  const categories = (await fetchCategories()).filter((category) => category.featured).slice(0, 3);
  if (categories.length === 0) return null;

  return (
    <section className="quick-links" aria-label="Popular categories">
      {categories.map((category) => {
        const Icon = iconByName[category.icon ?? ""] ?? Package;
        return (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="quick-link-tile"
            style={{ ["--accent" as string]: category.accent }}
          >
            <span className="quick-link-icon">
              <Icon size={22} />
            </span>
            <span className="quick-link-text">
              <strong>{category.name}</strong>
              <span>
                Explore
                <ArrowRight size={13} />
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
