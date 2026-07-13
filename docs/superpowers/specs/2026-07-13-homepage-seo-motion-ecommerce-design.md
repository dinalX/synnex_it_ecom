# Home Page: SEO, Performance, E-commerce Feel & Motion — Design

## Context

The home page (marquee → image carousel → Hot deals → category showcase → Top rated → New arrivals → quote CTA) works but lacks: structured data and social previews (SEO), efficient image loading (all 3 carousel slides download eagerly), the merchandising richness of a real store (stock signals, installments, quick view, tabbed collections), and any motion. User approved a 4-phase design; each phase ships independently, in order.

## Phase 1 — SEO + performance foundation

- **JSON-LD** via `<script type="application/ld+json">`:
  - Storefront layout: `Organization` (name, url, logo, phone, address) + `WebSite`.
  - Home page: `ItemList` of the Hot-deals products (position, name, url).
  - Product detail page: `Product` with `offers` (price, `LKR`, availability from real inventory, url), `aggregateRating` from the rating field, image, sku, brand-less.
- **Social previews**: `app/opengraph-image.tsx` using `next/og` `ImageResponse` (branded 1200×630 card — site name, tagline, brand colors; no asset file). Root metadata gains `twitter: { card: "summary_large_image" }`.
- **Home metadata**: page-level export — keyword-bearing title ("POS Machines, Barcode Scanners & Biometric Security in Sri Lanka") + description.
- **Perf**: carousel mounts `next/image` only for active + adjacent slides (others render empty until near-active); `sizes="100vw"` on carousel images; `sizes` hints on product-card images (`(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw`).

## Phase 2 — Richer product cards (`components/product-card.tsx`)

- **Stock line** from `inventory`: >10 "In stock" (green), 1–10 "Only N left" (amber), 0 "Out of stock" (muted, add-to-cart disabled).
- **Koko installment line** under price: `or 3 × {formatCurrency(round(price × 1.12 / 3))} with Koko` — display-only (Koko checkout integration is separate backlog). Pure helper `kokoInstallment(price)` in `lib/installments.ts` + unit test.
- **Quick view**: button revealed on card hover/focus → dialog with image, name, rating, price/compareAt, installment line, add-to-cart (existing `useCart`), link to product page. No fetch — card already holds the product. A11y: focus trap, Escape, `aria-modal`, backdrop click closes; reuses cart-drawer patterns.

## Phase 3 — Featured Collections + quick links

- **Quick-link strip** under hero: 3 tiles from featured parent categories (image/icon + name + "Explore →" linking to `/products?category=`).
- **Featured Collections** replaces the "Hot deals" `ProductRowSection`: tab pills — "Top Deals" (default) + the 4 main categories; left tall promo tile (biggest-discount product, full-bleed image, discount badge, CTA); product grid beside it. Server fetches ~6 products per tab upfront; client component switches tabs locally (no client fetching).

## Phase 4 — Motion pass (last; layers on final DOM)

- **Scroll reveal**: one IntersectionObserver; sections fade + rise 12px, 250ms ease-out-quart; cards in a row staggered ~40ms. Default-visible (hidden class only applied by JS to elements still below the fold at init) — content never ships blank.
- **Card hover**: 4px lift + shadow + image scale ~1.04.
- **Add-to-cart feedback**: button shows "Added ✓" ~1.2s; header cart icon pulses.
- **Carousel**: slow Ken Burns (scale 1→1.06 over ~7s) on active slide.
- All wrapped in `@media (prefers-reduced-motion: reduce)`.

## Non-goals

- No live Koko payment processing; no reviews model; no motion library; no search page changes.

## Verification (each phase)

`npm run lint && npm run build && npm test`; live browser check (Phase 1: inspect JSON-LD script tags in DOM, confirm only active carousel image loads eagerly; Phase 2: cards + quick-view incl. keyboard; Phase 3: tab switching, promo tile; Phase 4: reveals/hover/cart pulse + reduced-motion). Commit per phase.
