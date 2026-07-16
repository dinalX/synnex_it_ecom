# Admin bug-fix pass

## Context

A live-browser audit of the admin panel (all 12 pages, both the 5 already
converted to shadcn/Tailwind and the 7 still on the old hand-written CSS
system) turned up a set of concrete, low-risk bugs and gaps — dead UI,
a data-quality issue causing a live React error, a couple of one-line
display bugs, and a couple of missing-but-simple pieces of functionality
(logout has no UI entry point anywhere in the app).

This spec covers a fast, low-risk fix pass for all of it. It is
deliberately scoped apart from the larger, separately-planned shadcn
conversion of the remaining 7 old-CSS admin pages (Careers, Content,
Downloads, Settings, Products list + detail, Login, Pages) — that is a
bigger visual-redesign effort with its own spec, and none of the fixes
here depend on it or block it.

## Goals

- Fix everything the audit found that is either actively broken (dead
  buttons, a live console error, a duplicated currency string) or a real,
  user-facing gap (no way to log out) — without waiting on the larger
  visual conversion.
- Fix the SKU data-quality issue at its root (151 of 171 products have no
  SKU) rather than just papering over its symptom on the dashboard.

## Non-goals

- No visual/CSS-framework conversion of any admin page (that's the
  separate shadcn-conversion spec).
- No new admin features beyond what's listed below (e.g. no CRUD for
  Careers/Downloads/Pages, no Products-list search/pagination — both
  are real gaps the audit found, but they're being folded into the
  shadcn-conversion spec since they involve redesigning those pages'
  UI anyway).
- No unified/global admin search (orders + products + customers) — only
  fixing the existing dead search box to do what's actually possible
  today (search orders).

## Fix 1 — Dashboard search box does nothing

`app/admin/page.tsx`'s header search input (placeholder: "Search orders,
products, customers") has no form, no handler, no action. Typing and
pressing Enter does nothing.

Fix: the input is currently a bare, state-less `<label><input>` embedded
directly in `app/admin/page.tsx` (an async Server Component), so it can't
hold state or a submit handler itself. Extract it into a new
`components/admin/dashboard-search.tsx` client component — same visual
markup, plus local input state and an `onKeyDown` (Enter) handler that
does `router.push(\`/admin/orders?search=${encodeURIComponent(query)}\`)`.
`app/admin/page.tsx` renders `<DashboardSearch />` in place of the old
inline markup. Update the placeholder text to "Search orders by number,
name, or email…" so it stops promising product/customer search that
doesn't exist.

## Fix 2 — SKU data quality (151 of 171 products have no SKU)

Root cause: `prisma/seed.ts` only sets `sku` from a per-slug entry in
`prisma/curated-overrides.json` (the ~20 products that predate the
171-product catalog import). Every product added by the import has
`sku: undefined` → stored as `null`.

This isn't just a cosmetic gap — the dashboard's stock watchlist
(`app/admin/page.tsx:79`) falls back to `p.id.slice(0, 8).toUpperCase()`
as a pseudo-SKU when `sku` is null, and because product `id`s are cuids
(timestamp-prefixed, so records created in the same seed run's batch
share leading characters), that fallback actively collides across
different products — confirmed 10 collision groups, one with 17
different products sharing the same fake "SKU". This is what's causing
the "two children with the same key" React error React logs in the
console.

Fix:
- New `lib/sku.ts`: pure `generateSku(mainCategorySlug: string, sequence: number): string`, mapping the 4 main categories to short codes
  (`pos-solution` → `POS`, `barcode-solution` → `BAR`,
  `biometrics-security-solution` → `SEC`, `pc-printer-solution` → `PCP`)
  and zero-padding the sequence to 3 digits (`POS-001`). Unknown category
  slugs fall back to a generic `GEN` prefix so the function never throws.
- In `prisma/seed.ts`'s product loop: for any product without a curated
  SKU, call `generateSku(mainCategorySlug, n)` where `n` is a per-category
  counter assigned by iterating the catalog in stable (slug-sorted) order
  — so re-running the seed produces the same SKUs every time, and a
  product's SKU doesn't shift just because an unrelated product elsewhere
  in the catalog was added or removed.
- Re-running `npm run db:seed` (idempotent upsert-by-slug) backfills all
  151 existing rows in one pass — no separate one-off migration script.
- `app/admin/page.tsx:79`: change the dashboard fallback from
  `p.id.slice(0, 8).toUpperCase()` to just `p.id` (the full cuid, which
  is guaranteed unique) — defense in depth, so this class of bug can't
  recur even if a future product somehow still lacks a SKU.

## Fix 3 — Order total shows "LKR 300,000 LKR"

`app/admin/orders/[id]/page.tsx:153` renders
`{formatCurrency(order.total)} {order.currency}` — `formatCurrency`
already includes the "LKR" prefix, so the currency prints twice. Every
other money line in the same file (subtotal, discount, shipping, line
items) just calls `formatCurrency(...)` alone. Fix: drop the trailing
`{order.currency}`.

## Fix 4 — No way to log out anywhere in the app

`/api/auth/logout` (`app/api/auth/logout/route.ts`) is fully implemented
— clears both the admin and customer session cookies — but nothing in
the codebase links to it. Not the admin sidebar, not the storefront
account page. There is currently no way to end a session through the UI
at all.

Fix: add a "Log out" control to `components/sections/admin-sidebar-nav.tsx`
(bottom of the nav, below the existing items) and to the storefront's
account page (`app/(storefront)/account/page.tsx`), both as a plain
`<form action="/api/auth/logout" method="post">` — the same pattern the
admin login page already uses for its own form. The route's CSRF check
is Origin/Referer-based (`lib/api.ts::validateCSRF`), so a same-origin
form submit needs no extra token plumbing.

## Fix 5 — Login page hygiene

`app/admin/login/page.tsx` has two issues:
- `<input name="email" ... defaultValue="admin@synnex.lk" />` — the real
  admin email is hardcoded into the page source. Remove the
  `defaultValue`; the field starts empty like `password` already does.
- The page never checks whether the visitor is already authenticated —
  visiting `/admin/login` while logged in just re-shows the form. Add a
  session check at the top of the (already async) page component; if an
  admin session exists, `redirect("/admin")` before rendering the form.

## Fix 6 — Dead/misleading navigation and content

- Sidebar's "Customers" item (`components/sections/admin-sidebar-nav.tsx`)
  links to `/admin/orders` — identical to the "Orders" item right above
  it. There's no real customer-management page behind it. Remove the
  "Customers" item entirely rather than leave a fake duplicate link.
- `app/admin/content/page.tsx`'s "Settings Editor / Example managed
  fields" panel (static hardcoded values, a "Save draft" button that
  fires no request when clicked — confirmed via network inspection) is
  dead decoration that fully duplicates the real `/admin/settings` page.
  Delete the panel entirely.
- Dashboard's "All functions" link (`app/admin/page.tsx`, in the Stock
  Watchlist card header) currently points at `/admin/content` — a
  non-obvious destination from an inventory-watchlist context. Point it
  at `/admin/products` instead.

## Fix 7 — Home Sections: category name overflows its button

`app/admin/home-sections/home-section-manager.tsx`'s section-picker
`Button` list (`className="justify-between"`, no wrap/truncation
handling) lets a long section name — "Biometrics & Security Solution" —
overflow the fixed 220px sidebar column horizontally, visually breaching
into the adjacent panel. Fix: add `whitespace-normal text-left h-auto`
(and `py-2` to keep vertical padding sane for a two-line label) to that
Button's className so long names wrap onto a second line instead of
overflowing. No information is ever hidden.

## Testing

- `tests/sku.test.ts`: `generateSku` — correct code per known category,
  correct zero-padding, generic fallback for an unrecognized category
  slug, deterministic output for the same inputs. Matches the existing
  pure-function `node:test` convention (see `tests/order-status.test.ts`).

## Verification

- `npm run lint`, `npm run build`, `npm test`.
- Live browser check, logged in as admin:
  - Dashboard search box: type an order number fragment, press Enter,
    confirm redirect to `/admin/orders?search=...` with matching results.
  - Dashboard stock watchlist: confirm no "duplicate key" console error,
    confirm each row shows a real generated SKU (e.g. `POS-001`), not a
    truncated id.
  - Order detail page: confirm the Total line shows the currency once.
  - Click "Log out" in the admin sidebar: confirm redirect and that
    `/admin` now redirects to the login page (session actually cleared).
  - Visit `/admin/login` while already logged in (before logging out):
    confirm redirect straight to `/admin`.
  - View the login page's HTML source: confirm the email field has no
    prefilled value.
  - Confirm "Customers" no longer appears in the sidebar.
  - Content page: confirm the decorative settings panel is gone.
  - Dashboard: confirm "All functions" link goes to `/admin/products`.
  - Home Sections page: confirm "Biometrics & Security Solution" wraps
    onto two lines inside its button with no overflow.
  - Storefront account page: confirm a working "Log out" control exists.
