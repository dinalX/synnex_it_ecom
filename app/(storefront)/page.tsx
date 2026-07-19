import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/hero-section";
import { ProductRowSection } from "@/components/sections/product-row-section";
import { CategoryShowcaseSection } from "@/components/sections/category-showcase-section";
import { FeaturedCollectionsSection } from "@/components/sections/featured-collections-section";
import { QuickLinksSection } from "@/components/sections/quick-links-section";
import { QuoteCtaSection } from "@/components/sections/quote-cta-section";
import { JsonLd } from "@/components/json-ld";
import { ScrollReveal } from "@/components/scroll-reveal";
import { siteConfig } from "@/lib/site";
import { fetchDeals, fetchHomeSection, fetchProducts, fetchTopRated } from "@/lib/data";

export const metadata: Metadata = {
  title: "POS Machines, Barcode Scanners & Biometric Security in Sri Lanka",
  description:
    "Shop POS machines, receipt printers, barcode scanners, cash drawers, biometric attendance systems, and smart door locks with islandwide delivery, installation, and after-sales support.",
};

export default async function Home() {
  const [deals, topRated, latestProducts] = await Promise.all([
    fetchHomeSection("top-deals", 13, () => fetchDeals(13)),
    fetchHomeSection("top-rated", 12, () => fetchTopRated(12)),
    fetchHomeSection("new-arrivals", 12, () =>
      fetchProducts({ sort: "newest", limit: 12 }).then((result) => result.products),
    ),
  ]);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Hot deals",
          itemListElement: deals.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.name,
            url: `${siteConfig.url}/products/${product.slug}`,
          })),
        }}
      />
      <ScrollReveal />
      <HeroSection />
      <QuickLinksSection />
      <FeaturedCollectionsSection deals={deals} />
      <CategoryShowcaseSection />
      <ProductRowSection
        eyebrow="Customer favourites"
        title="Top rated"
        viewAllHref="/products?sort=rating"
        products={topRated}
      />
      <ProductRowSection
        id="shop"
        eyebrow="Just in"
        title="New arrivals"
        viewAllHref="/products"
        products={latestProducts}
      />
      <QuoteCtaSection />
    </main>
  );
}
