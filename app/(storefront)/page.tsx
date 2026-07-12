import { HeroSection } from "@/components/sections/hero-section";
import { ProductRowSection } from "@/components/sections/product-row-section";
import { CategoryShowcaseSection } from "@/components/sections/category-showcase-section";
import { QuoteCtaSection } from "@/components/sections/quote-cta-section";
import { fetchDeals, fetchProducts, fetchTopRated } from "@/lib/data";

export default async function Home() {
  const [deals, topRated, latest] = await Promise.all([
    fetchDeals(8),
    fetchTopRated(8),
    fetchProducts({ sort: "newest", limit: 8 }),
  ]);

  return (
    <main>
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
