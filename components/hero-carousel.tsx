"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { formatCurrency } from "@/lib/api-client";

type CarouselProduct = {
  slug: string;
  name: string;
  price: number;
  compareAt: number | null;
  rating: number;
};

export type CarouselBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  theme: string;
  product: CarouselProduct | null;
};

const AUTOPLAY_MS = 5000;

export function HeroCarousel({ banners }: { banners: CarouselBanner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  if (banners.length === 0) return null;

  function goTo(index: number) {
    setActiveIndex((index + banners.length) % banners.length);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
  }

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
    >
      {banners.map((banner, index) => {
        const isActive = index === activeIndex;
        const discount =
          banner.product?.compareAt && banner.product.compareAt > banner.product.price
            ? Math.round(((banner.product.compareAt - banner.product.price) / banner.product.compareAt) * 100)
            : 0;

        return (
          <div
            key={banner.id}
            className={`hero-carousel-slide theme-${banner.theme}${isActive ? " is-active" : ""}`}
            aria-hidden={!isActive}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.imageAlt || banner.title}
              fill
              priority={index === 0}
              className="hero-carousel-image"
            />
            <div className="hero-carousel-copy">
              <h1>{banner.title}</h1>
              {banner.subtitle ? <p>{banner.subtitle}</p> : null}
              {banner.ctaLabel && banner.ctaHref ? (
                <Link href={banner.ctaHref} className="primary-action" tabIndex={isActive ? 0 : -1}>
                  {banner.ctaLabel}
                </Link>
              ) : null}
            </div>
            {banner.product ? (
              <Link
                href={`/products/${banner.product.slug}`}
                className="hero-product-card"
                tabIndex={isActive ? 0 : -1}
                aria-label={`Featured product: ${banner.product.name}`}
              >
                <span>{discount > 0 ? "Featured deal" : "Featured product"}</span>
                <strong>{banner.product.name}</strong>
                <div className="hero-product-meta">
                  {banner.product.compareAt && banner.product.compareAt > banner.product.price ? (
                    <del>{formatCurrency(banner.product.compareAt)}</del>
                  ) : null}
                  <b>{formatCurrency(banner.product.price)}</b>
                  <span className="hero-rating">
                    <Star size={12} fill="currentColor" />
                    {banner.product.rating}
                  </span>
                </div>
              </Link>
            ) : null}
          </div>
        );
      })}

      {banners.length > 1 ? (
        <>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-arrow-prev"
            aria-label="Previous slide"
            onClick={() => goTo(activeIndex - 1)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-arrow-next"
            aria-label="Next slide"
            onClick={() => goTo(activeIndex + 1)}
          >
            <ChevronRight size={20} />
          </button>
          <div className="hero-carousel-dots">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className="hero-carousel-dot"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeIndex}
                data-active={index === activeIndex}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
