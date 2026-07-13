import { FeaturedCollectionsTabs, type CollectionTab } from "@/components/featured-collections-tabs";
import { fetchCategories, fetchProducts } from "@/lib/data";
import type { Product } from "@prisma/client";

/**
 * Tabbed merchandising section: "Top Deals" plus one tab per main category.
 * All tab data is fetched server-side so switching is instant on the client.
 */
export async function FeaturedCollectionsSection({ deals }: { deals: Product[] }) {
  const categories = await fetchCategories();

  const categoryTabs = await Promise.all(
    categories.map(async (category): Promise<CollectionTab> => {
      const { products } = await fetchProducts({ category: category.slug, limit: 6 });
      return {
        key: category.slug,
        label: category.name,
        href: `/products?category=${category.slug}`,
        products,
      };
    }),
  );

  // deals[0] becomes the promo tile, so the Top Deals grid starts at deals[1].
  const promo = deals[0] ?? null;
  const tabs: CollectionTab[] = [
    { key: "top-deals", label: "Top Deals", href: "/products", products: deals.slice(1, 7) },
    ...categoryTabs.filter((tab) => tab.products.length > 0),
  ];

  return (
    <section className="product-section" id="deals">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Featured collections</p>
          <h2>Shop what&apos;s moving</h2>
        </div>
      </div>
      <FeaturedCollectionsTabs tabs={tabs} promo={promo} />
    </section>
  );
}
