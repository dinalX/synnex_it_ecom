import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/hero-section";
import { ProductRowSection } from "@/components/sections/product-row-section";
import { CategoryShowcaseSection } from "@/components/sections/category-showcase-section";
import { QuoteCtaSection } from "@/components/sections/quote-cta-section";
import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site";
import { fetchDeals, fetchProducts, fetchTopRated } from "@/lib/data";

export const metadata: Metadata = {
  title: "POS Machines, Barcode Scanners & Biometric Security in Sri Lanka",
  description:
    "Shop POS machines, receipt printers, barcode scanners, cash drawers, biometric attendance systems, and smart door locks with islandwide delivery, installation, and after-sales support.",
};

export default async function Home() {
  const [deals, topRated, latest] = await Promise.all([
    fetchDeals(8),
    fetchTopRated(8),
    fetchProducts({ sort: "newest", limit: 8 }),
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
      <HeroSection />
      <ProductRowSection
        id="deals"
        eyebrow="Special offers"
        title="Hot deals"
        viewAllHref="/products"
        products={deals}
      />
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
        products={latest.products}
      />
      <QuoteCtaSection />
    </main>
  );
}
