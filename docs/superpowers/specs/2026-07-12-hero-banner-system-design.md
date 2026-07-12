# Hero Banner System — Design

## Context

The user shared a screenshot of simplytek.lk (a Sri Lankan gadget retailer) as a visual reference and asked for "this kind of a look" on Synnex's homepage. Live inspection of simplytek.lk found a much larger set of homepage features than a single hero tweak: a marquee announcement bar, an auto-rotating multi-slide hero carousel, a 3-tile quick-link strip, a tabbed "Featured Collections" section with rich product cards (color swatches, quick-view, installment/cashback lines), category tiles + brand marquee, and several sections tied to business capabilities Synnex doesn't have (loyalty coins, gift vouchers, bundles, pre-orders, a reviews model). The user confirmed Koko BNPL is real for Synnex (installment only, no cashback, priced as `(price * 1.12) / 3` per month) but it is not wired into checkout in this codebase yet — that number is a display-only estimate for now, not a live payment integration.

Given the scope, the work was decomposed into 4 independent sub-projects:

- **A. Hero banner system** (this spec) — foundational: lets an admin manage rotating marketing slides instead of the current single data-driven hero.
- **B. Product card upgrades** — Koko installment line, quick-view overlay, stock-count text, clearer sale badge. Reusable across every section that renders a `ProductCard`.
- **C. Featured Collections section** — replaces the current plain "Hot deals" row with a tabbed (category-filtered) layout + a big vertical promo tile. Depends on B for card styling.
- **D. 3-tile quick-link strip** — smallest piece, sits below the hero; likely reuses A's banner infrastructure or a few hardcoded links.

This spec covers **A only**. B, C, D get their own specs once A ships.

## Goals

- Replace the current single-product hero (`components/sections/hero-section.tsx`, shipped this session) with an admin-manageable, auto-rotating carousel of marketing banners.
- Each banner can optionally link to a real product, reusing today's price-card overlay treatment; or be pure marketing copy (image + headline + CTA) with no product tie-in — matching simplytek.lk's mix of promo-only and product-tied slides.
- Add a scrolling marquee announcement bar above the site header (static content, not admin-managed — see Non-goals).
- Keep the "more ongoing discounts" mini strip shipped last turn, now living below the carousel instead of below a single hero card.
- Never leave the homepage without a hero if zero banners are configured (fresh installs, or an admin deactivating everything).

## Non-goals

- The marquee bar's message list is **not** admin-editable in this pass — it's a small static array of trust copy (reusing existing trust-band language). Admin-editable marquee content can be a fast follow if wanted, but isn't blocking.
- No live Koko/Mintpay checkout integration. The `(price * 1.12) / 3` installment number is a pure display calculation, built in sub-project B, not here.
- No color-swatch variants, no quick-view modal, no tabbed collections — those are B/C/D.
- No drag-and-drop reordering in admin — banners are ordered by a plain numeric `sortOrder` field, edited like any other form field.

## Data model

New model in `prisma/schema.prisma`:

```prisma
model HeroBanner {
  id          String   @id @default(cuid())
  title       String
  subtitle    String?
  imageUrl    String
  imageAlt    String?
  ctaLabel    String?
  ctaHref     String?
  productId   String?
  theme       String   @default("light") // "light" | "dark" — controls text-over-image contrast
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product?   @relation(fields: [productId], references: [id], onDelete: SetNull)
  createdBy   AdminUser? @relation(fields: [createdById], references: [id], onDelete: SetNull)

  @@index([active])
  @@index([sortOrder])
}
```

`Product` gains a back-relation `heroBanners HeroBanner[]`; `AdminUser` gains `createdHeroBanners HeroBanner[]`. `theme` is a plain string validated by a small guard list (`lib/hero-banner-theme.ts`, `["light", "dark"] as const`), matching the project's existing string-enum convention (see `lib/order-status.ts`).

## Permissions

Add two keys to the existing catalog in `lib/permissions.ts`: `"hero-banner.view"`, `"hero-banner.manage"`. Gated the same way every other admin resource is: `requireAdminPage("/admin/hero-banners", "hero-banner.view")` on the page, `requireAdminAction("hero-banner.manage")` on the create/update/delete/reorder actions.

## Admin UI

`app/admin/hero-banners/page.tsx` + `banner-manager.tsx` + `actions.ts`, following the exact pattern of `app/admin/products/` (already shadcn-converted):

- Table: thumbnail, title, linked product (if any), active toggle, sort order, edit/delete actions.
- Create/edit via a shadcn `Dialog` form: title, subtitle (textarea), image upload (reuses `app/api/admin/uploads/route.ts` + `lib/uploads.ts`'s existing image-sniffing/size-cap logic — same component pattern as `product-form.tsx`'s image field), CTA label + href, optional product `Select` (searchable-enough for the current product count; a plain `<select>` of published products), theme `Select` (light/dark), active `Checkbox`, sort order `Input type="number"`.
- Delete requires confirmation (`variant="destructive"`, matching the products page).
- Add a "Hero Banners" nav item to `AdminSidebar`, visible only with `hero-banner.view`.

## Storefront

`lib/data.ts`: add `fetchActiveHeroBanners()` — `prisma.heroBanner.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, include: { product: { include: { images: ... } } } })`.

`components/sections/hero-section.tsx` (existing file, modified) becomes a server component that fetches banners (via the new function) and deals (existing `fetchDeals(5)` call, unchanged), then renders:

```tsx
<HeroCarousel banners={banners} />
{/* existing hero-deals-strip logic, now a sibling section below the carousel, not a child of a single-card layout */}
```

If `banners.length === 0`, render the current single-featured-deal card as a fallback (today's `hero-visual`/`hero-product-card` markup, unchanged) instead of the carousel — this guarantees fresh installs (or an admin who deactivates every banner) never see an empty hero.

New `components/hero-carousel.tsx` (`"use client"`):
- Props: `banners: HeroBannerWithProduct[]`.
- State: `activeIndex`, `isPaused` (true on `mouseenter`/`focusin`, false on `mouseleave`/`focusout`).
- `useEffect` interval (5000ms) advances `activeIndex` when `!isPaused` and `banners.length > 1`; cleared on unmount/pause change. Checks `window.matchMedia("(prefers-reduced-motion: reduce)")` and skips autoplay entirely if set (arrows/dots still work).
- Prev/next buttons (`aria-label="Previous slide"/"Next slide"`), dot indicators (`aria-label="Go to slide N"`, `aria-current` on the active dot), and the whole region gets `role="region"` + `aria-roledescription="carousel"` + `aria-label="Featured promotions"`, individual slides get `aria-hidden` when inactive so screen readers don't announce off-screen slides.
- Keyboard: left/right arrow keys move to prev/next when focus is within the carousel (arrows themselves are naturally tabbable buttons; add a keydown handler on the carousel region for arrow-key nav as an enhancement).
- Each slide: full-bleed `imageUrl` background (via `next/image` `fill`), `theme === "dark"` applies a light-text/scrim treatment (reuses a variant of today's hero gradient), title/subtitle, CTA button linking to `ctaHref`. If `productId` is set, overlay today's `.hero-product-card` mini price panel (name, price, compareAt strikethrough, discount badge, rating) using the already-included `product` relation — this reuses the exact markup/CSS shipped last turn, just fed from a banner's linked product instead of the single top deal.

New `components/marquee-bar.tsx` — a small static component, a short hardcoded array of trust strings (e.g. "100% Genuine Products", "Islandwide Delivery", "6-Month+ Warranty on Hardware", "WhatsApp Support"), rendered as a CSS-animated horizontal scroll (`@keyframes marquee`, `animation: marquee 30s linear infinite`, paused on hover, duplicated content for seamless looping). Added to `app/(storefront)/layout.tsx` above `<SiteHeader />`.

## Seeding

`prisma/seed.ts`: add 2-3 sample `HeroBanner` rows (reusing already-localized product images where a `productId` link makes sense, plus one pure-marketing slide with no product) so the carousel is never empty on a fresh `db seed` run.

## CSS

New rules in `app/globals.css`: `.hero-carousel`, `.hero-carousel-slide` (+ active/inactive visibility via opacity/transform crossfade, not display:none, so transitions animate), `.hero-carousel-arrow` (prev/next, reusing `.icon-button`-style treatment already in the file), `.hero-carousel-dots`/`.hero-carousel-dot`, `.marquee-bar`/`.marquee-track`/`@keyframes marquee`. Mobile breakpoints: shorter slide min-height (matching today's `.hero-visual` 430px/320px steps), smaller title font, marquee font-size reduced.

## Testing

`tests/hero-banner-theme.test.ts` — pure guard-function test (`isHeroBannerTheme`), same shape as `tests/order-status.test.ts`. No DB/integration tests, consistent with project convention.

## Verification

1. `npm run lint`, `npm run build`, `npm test`.
2. In the browser: log in as admin, create 2-3 banners (one with a linked product, one pure marketing), confirm they appear on the homepage carousel in `sortOrder`.
3. Confirm autoplay rotates slides (~5s), pauses on hover/focus, arrows and dots work, left/right arrow keys move slides when the carousel has focus.
4. Emulate `prefers-reduced-motion: reduce` and confirm autoplay stops but manual nav still works.
5. Resize to mobile (375px) and tablet (768px): confirm carousel and marquee remain readable, no overflow.
6. Deactivate all banners and confirm the homepage falls back to today's single-featured-deal hero instead of an empty section.
7. Confirm the "more ongoing discounts" strip still renders below the carousel exactly as it did last turn.
