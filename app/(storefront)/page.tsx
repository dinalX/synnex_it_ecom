import { HeroSection } from "@/components/sections/hero-section";
import { TrustBandSection } from "@/components/sections/trust-band-section";
import { CategoryTilesSection } from "@/components/sections/category-tiles-section";
import { ProductGridSection } from "@/components/sections/product-grid-section";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <TrustBandSection />
      <CategoryTilesSection />
      <ProductGridSection />
    </main>
  );
}
