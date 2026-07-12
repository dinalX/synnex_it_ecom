import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { formatCurrency } from "@/lib/api-client";
import { fetchActiveHeroBanners, fetchDeals, fetchTopRated } from "@/lib/data";
import { HeroCarousel } from "@/components/hero-carousel";

export async function HeroSection() {
  const [banners, deals, topRated] = await Promise.all([
    fetchActiveHeroBanners(),
    fetchDeals(5),
    fetchTopRated(1),
  ]);

  const featured = deals[0] ?? topRated[0] ?? null;
  const moreDeals = deals[0] ? deals.slice(1, 5) : [];
  const discount =
    featured?.compareAt && featured.compareAt > featured.price
      ? Math.round(((featured.compareAt - featured.price) / featured.compareAt) * 100)
      : 0;

  return (
    <div className="hero-shell">
      {banners.length > 0 ? (
        <>
          {/* The carousel is pure imagery with no visible heading, but the
              page still needs exactly one real <h1> for SEO/screen readers. */}
          <h1 className="sr-only">
            POS, barcode, biometric, and IT hardware that keeps business moving.
          </h1>
          <HeroCarousel
            banners={banners.map((banner) => ({
              id: banner.id,
              title: banner.title,
              imageUrl: banner.imageUrl,
              imageAlt: banner.imageAlt,
              ctaHref: banner.ctaHref,
              product: banner.product ? { slug: banner.product.slug } : null,
            }))}
          />
        </>
      ) : (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Sri Lanka POS &amp; business hardware store</p>
            <h1>POS, barcode, biometric, and IT hardware that keeps business moving.</h1>
            <p>
              POS machines, receipt printers, barcode scanners, cash drawers, attendance
              systems, and smart locks — with islandwide delivery, local installation, and
              after-sales support.
            </p>
            <div className="hero-actions">
              <Link href="/products" className="primary-action">
                Shop all products
                <ArrowRight size={18} />
              </Link>
              <Link href="/products?category=pos-solution" className="secondary-action">
                Explore POS solutions
              </Link>
            </div>
          </div>

          {featured ? (
            <Link
              href={`/products/${featured.slug}`}
              className="hero-visual"
              aria-label={`Featured product: ${featured.name}`}
            >
              {discount > 0 ? <span className="hero-deal-badge">-{discount}%</span> : null}
              <Image src={featured.image} alt={featured.name} priority width={980} height={920} />
              <div className="hero-product-card">
                <span>{discount > 0 ? "Featured deal" : "Featured product"}</span>
                <strong>{featured.name}</strong>
                <div className="hero-product-meta">
                  {featured.compareAt && featured.compareAt > featured.price ? (
                    <del>{formatCurrency(featured.compareAt)}</del>
                  ) : null}
                  <b>{formatCurrency(featured.price)}</b>
                  <span className="hero-rating">
                    <Star size={12} fill="currentColor" />
                    {featured.rating}
                  </span>
                </div>
              </div>
            </Link>
          ) : null}
        </section>
      )}

      {moreDeals.length > 0 ? (
        <div className="hero-deals-strip" aria-label="More ongoing discounts">
          {moreDeals.map((product) => {
            const pct =
              product.compareAt && product.compareAt > product.price
                ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
                : 0;
            return (
              <Link href={`/products/${product.slug}`} className="hero-deal-card" key={product.id}>
                <span className="hero-deal-thumb">
                  <Image src={product.image} alt={product.name} width={64} height={64} />
                  {pct > 0 ? <span className="hero-deal-pct">-{pct}%</span> : null}
                </span>
                <span className="hero-deal-info">
                  <strong>{product.name}</strong>
                  <span className="hero-deal-price">
                    <b>{formatCurrency(product.price)}</b>
                    {product.compareAt && product.compareAt > product.price ? (
                      <del>{formatCurrency(product.compareAt)}</del>
                    ) : null}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
