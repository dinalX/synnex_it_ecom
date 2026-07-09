# Synnex IT Solution — E-Commerce Platform

Modern Next.js e-commerce rebuild for [synnex.lk](https://synnex.lk), a Sri Lankan POS hardware, barcode, biometric security, and IT equipment supplier.

## Tech Stack

- **Framework:** Next.js 16.2.6 (Turbopack)
- **Language:** TypeScript
- **Styling:** Custom CSS with CSS variables (no Tailwind)
- **Database:** SQLite via Prisma ORM
- **Icons:** Lucide React

## Project Structure

```
synnex-web-nextjs/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage (composes sections)
│   ├── globals.css               # Global styles & CSS variables
│   ├── robots.ts                 # Robots.txt generator
│   ├── sitemap.ts                # Sitemap generator
│   ├── admin/                    # Admin dashboard
│   │   ├── page.tsx              # Dashboard overview
│   │   ├── careers/page.tsx      # Manage career posts
│   │   ├── content/page.tsx      # Content management
│   │   ├── downloads/page.tsx    # Driver download management
│   │   ├── login/page.tsx        # Admin login
│   │   ├── orders/page.tsx       # Order management
│   │   ├── pages/page.tsx        # Page content management
│   │   ├── products/page.tsx     # Product management
│   │   └── settings/page.tsx     # Site settings
│   ├── api/                      # API routes
│   │   ├── admin/settings/       # Site settings API
│   │   ├── auth/login/           # Customer login
│   │   ├── auth/logout/          # Logout
│   │   ├── facebook/capi/        # Facebook CAPI endpoint
│   │   ├── orders/               # Cart-backed storefront order creation
│   │   └── orders/offline/       # Compatibility shim for legacy offline posts
│   ├── careers/page.tsx          # Careers listing
│   ├── checkout/
│   │   ├── page.tsx              # Cart-backed manual-payment checkout
│   │   └── thank-you/page.tsx    # Order confirmation + payment proof submission
│   ├── downloads/page.tsx        # Software driver downloads
│   ├── login/page.tsx            # Customer login
│   ├── products/[slug]/page.tsx  # Product detail page
│   └── services/[slug]/page.tsx  # Service detail pages
├── components/
│   ├── ui/                       # shadcn/ui stubs (unused)
│   ├── sections/                 # Page-specific section components
│   │   ├── hero-section.tsx      # Homepage hero
│   │   ├── category-tiles-section.tsx  # Category browsing tiles
│   │   ├── trust-band-section.tsx      # Store benefits strip
│   │   ├── collections-section.tsx     # Category collections
│   │   ├── product-grid-section.tsx    # Product catalog grid
│   │   ├── checkout-form.tsx           # Checkout form + panel
│   │   ├── admin-sidebar.tsx           # Admin navigation sidebar
│   │   ├── job-card.tsx                # Job listing card + list
│   │   └── download-card.tsx           # Driver download card + list
│   ├── use-hover-dropdown.ts     # Shared hover dropdown hook
│   ├── nav-dropdown.tsx          # Reusable nav dropdown + content
│   ├── category-pill.tsx         # Category pill with subcategory dropdown
│   ├── header-actions.tsx        # Header icon buttons
│   ├── mobile-menu.tsx           # Mobile navigation panel
│   ├── product-categories.tsx    # 2nd nav bar (category pills)
│   ├── site-header.tsx           # Main site header
│   ├── site-footer.tsx           # Site footer
│   ├── product-card.tsx          # Product card component
│   ├── cart-drawer.tsx           # Shopping cart drawer
│   ├── cart-provider.tsx         # Cart state provider
│   ├── add-product-button.tsx    # Add to cart button
│   └── analytics-scripts.tsx     # Google Tag / Facebook Pixel
├── lib/
│   ├── catalog.ts                # Product & category data
│   ├── content.ts                # Career posts & driver downloads
│   ├── admin-data.ts             # Admin dashboard mock data
│   ├── site.ts                   # Site configuration
│   ├── auth.ts                   # Authentication utilities
│   ├── db.ts                     # Prisma client singleton
│   ├── tracking.ts               # Analytics tracking helpers
│   └── utils.ts                  # Utility functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeder
└── public/
    └── products/                 # Product images (SVG)
```

## Product Categories

The store organizes products into 4 main categories matching synnex.lk:

1. **POS Solution** — POS Machines, Handheld POS, POS Printers, Cash Drawers, Cash Counting Machines, Customer Displays, Mobile Data Collectors, POS Paper Rolls, Restaurant Pagers
2. **Barcode Solution** — Barcode Scanners, Barcode Label Printers, Barcode Label Rolls, Thermal Transfer Ribbons
3. **Biometrics & Security Solution** — Smart Door Locks, Door Access Control, Wireless IP Cameras, Time Attendance Fingerprint Systems, Safe Lockers
4. **PC & Printer Solution** — All-in-One PCs, Monitors, Keyboards & Mice, A4 Printers, Card Printers, Handheld Printers, Network Solutions, UPS & Power Supplies

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Set a strong auth secret before running the app

# Generate Prisma client & push schema
npm run db:push

# Seed database with products
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite database path (default: `file:./dev.db`) |
| `AUTH_SECRET` | Required. Long random secret used for signed auth sessions |
| `ADMIN_EMAIL` | Required. Admin login email |
| `ADMIN_PASSWORD` | Required. Admin login password |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used for metadata and redirects |
| `OPENROUTER_API_KEY` | Optional. OpenRouter API key for the local coding adapter |
| `OPENROUTER_MODEL` | Model slug to use, such as your chosen OpenRouter model |
| `OPENROUTER_SITE_URL` | Referer header sent to OpenRouter |
| `OPENROUTER_APP_NAME` | App title sent to OpenRouter |
| `NEXT_PUBLIC_GTAG_ID` | Optional. Google tag ID for storefront analytics |
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Optional. Facebook Pixel ID |
| `FACEBOOK_CAPI_PIXEL_ID` | Optional. Meta CAPI Pixel ID |
| `FACEBOOK_CAPI_ACCESS_TOKEN` | Optional. Meta CAPI access token |

### Database Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed with product data (48 products, 4 categories)
npm run db:reset       # Reset DB and re-seed
npm test               # Shared validation/filter regression tests
npm run lint           # ESLint gate
npm run build          # Production build + typecheck
npm run openrouter:chat -- "Review the checkout flow and point out bugs"
```

### OpenRouter Adapter

The repo includes a small OpenRouter helper for local use. Set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in `.env`, then run:

```bash
npm run openrouter:chat -- "Explain the architecture of this repo"
```

Use the exact model slug you want from OpenRouter. The default in `.env.example` is the OpenRouter latest alias, but you can swap it for your preferred model.

## Component Architecture

### Header
```
SiteHeader
├── NavDropdown (Products) → ProductsDropdown
├── NavDropdown (Support) → SupportDropdown
├── HeaderActions (downloads, careers, login, cart)
├── MobileMenu (hamburger panel)
└── ProductCategories (2nd nav bar)
    └── CategoryPill (×4, with hover dropdowns)
```

### Shared Hooks
- `useHoverDropdown()` — Manages single-open dropdown state with 150ms close delay

### Styling
- Custom CSS with CSS variables (`--ink`, `--muted`, `--line`, `--paper`, `--white`, `--green`, `--blue`, `--amber`, `--orange`, `--shadow`)
- BEM-like class naming convention
- Responsive breakpoints: 980px, 640px
- No Tailwind — pure custom CSS

## Manual Test Checklist

### Storefront

- Add a product to cart from `/products` and confirm the cart drawer updates.
- Open `/checkout` and confirm cart items, subtotal, and manual payment options render from the live cart.
- Submit a guest checkout and confirm redirect to `/checkout/thank-you?orderId=...`.
- On the thank-you page, confirm order number, total, payment status, and manual payment instructions render.
- Submit a payment proof URL and confirm the success state appears after redirect.

### Admin

- Access `/admin` while logged out and confirm redirect to `/admin/login`.
- Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then confirm `/admin/orders` and `/admin/products` render.
- Open an order detail page and verify status, payment review, and fulfillment updates accept only supported values.
- Review a submitted payment proof and confirm the order payment status reflects the review decision.
- Rename a product without editing its slug and confirm the public `/products/[slug]` URL remains unchanged.

### Release Gates

- Run `npm test`.
- Run `npm run lint`.
- Run `npm run build`.

## License

Private — Synnex IT Solution (Pvt) Ltd
