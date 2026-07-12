"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselProduct = {
  slug: string;
};

export type CarouselBanner = {
  id: string;
  title: string;
  imageUrl: string;
  imageAlt: string | null;
  ctaHref: string | null;
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
        const href = banner.ctaHref || (banner.product ? `/products/${banner.product.slug}` : null);
        const alt = banner.imageAlt || banner.title;

        return (
          <div
            key={banner.id}
            className={`hero-carousel-slide${isActive ? " is-active" : ""}`}
            aria-hidden={!isActive}
          >
            {href ? (
              <Link
                href={href}
                className="hero-carousel-image-link"
                tabIndex={isActive ? 0 : -1}
                aria-label={banner.title}
              >
                <Image src={banner.imageUrl} alt={alt} fill priority={index === 0} className="hero-carousel-image" />
              </Link>
            ) : (
              <Image src={banner.imageUrl} alt={alt} fill priority={index === 0} className="hero-carousel-image" />
            )}
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
