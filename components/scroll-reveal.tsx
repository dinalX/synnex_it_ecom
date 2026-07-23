"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR =
  ".quick-links, .product-section, .quote-cta";

/**
 * Progressive scroll-reveal for home sections. Content is visible by
 * default — sections still below the fold when JS runs get hidden and
 * revealed on approach, so no-JS/headless visitors always see everything.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.05 },
    );

    for (const section of sections) {
      if (section.getBoundingClientRect().top > window.innerHeight) {
        section.classList.add("reveal-pending");
        observer.observe(section);
      }
    }

    return () => {
      observer.disconnect();
      for (const section of sections) {
        section.classList.remove("reveal-pending");
      }
    };
  }, []);

  return null;
}
