# Product Ordering: Admin List Reorder + Curated Home Sections — Design

## Context

Admin panel audit (this session) found `Product` has no manual ordering field at all — every other orderable model (`ProductCategory`, `ProductImage`, `ProductVariant`, `HeroBanner`, `BlogCategory`, `BlogMedia`) has a `sortOrder`, but `Product` doesn't. Consequences: the admin Products list is hardcoded `orderBy: createdAt desc`, and every homepage merchandising section (Hot Deals, Top Rated, New Arrivals, Featured Collections category tabs) is 100% algorithmic (discount %, rating, date) with no way to hand-pick what shows.

User confirmed two things they want:
1. **Home sections**: hand-pick which products appear in a section *and their order*, overriding the automatic sort.
2. **Admin Products list**: drag-and-drop reordering (not just a numeric field).

## Goals

- Admin can drag-reorder the Products list; the new order is the list's default sort going forward.
- Admin can curate the product set + order for each home-page merchandising slot (Top Deals, Top Rated, New Arrivals, and each Featured Collections category tab) via one new admin page.
- Sections with no curation keep working exactly as today (automatic fallback) — day-one behavior is unchanged until an admin actually curates something, matching the precedent set by Hero Banners (empty banners → today's single-deal hero, not a blank section).

## Non-goals

- No changes to the storefront's own `/products` listing sort options (still user-facing sort-by-price/rating/name, unrelated to this).
- No pagination rework for the admin Products list (stays `take: 100`); dnd-kit's keyboard reordering (Space to pick up, arrow keys to move, Space to drop) keeps it usable at that scale without adding a second feature.

## Schema

```prisma
model Product {
  ...
  sortOrder Int @default(0)
  ...
  homeSectionItems HomeSectionItem[]

  @@index([sortOrder])
}

model HomeSectionItem {
  id        String   @id @default(cuid())
  section   String   // "top-deals" | "top-rated" | "new-arrivals" | <category-slug>
  productId String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([section, productId])
  @@index([section])
  @@index([sortOrder])
}
```

New products get `sortOrder` = current max + 1 on create (lands at the end, not tied at 0 with everything else).

## Permissions

Two new keys, same shape as every other resource: `home-section.view`, `home-section.manage`. Reordering the Products list itself is gated by the existing `product.update` (it's just editing product data, not a new resource).

## Admin — Products list drag-and-drop

`app/admin/products/product-manager.tsx` (stays on its existing custom-CSS system — this is a feature add, not the shadcn-conversion backlog item): each row gets a drag handle (`GripVertical` icon). Wrapped in `@dnd-kit/core`'s `DndContext` + `@dnd-kit/sortable`'s `SortableContext`/`useSortable`, matching the standard dnd-kit vertical-list recipe. On drop, optimistic local reorder + a server action `reorderProducts(orderedIds: string[])` that bulk-updates `sortOrder` (0, 1, 2, …) in a transaction. `app/admin/products/page.tsx`'s query changes from `orderBy: createdAt desc` to `orderBy: sortOrder asc`.

A small shared `components/admin/sortable-list.tsx` wraps the dnd-kit boilerplate (context + keyboard/pointer sensors + `arrayMove`) so the Home Sections page (below) reuses it rather than duplicating the drag setup.

## Admin — Home Sections page (`/admin/home-sections`)

New page, gated by `home-section.view`/`home-section.manage`, added to the sidebar (icon: `LayoutList`). One section-picker (the 3 fixed slugs + one entry per main category, labelled to match the Featured Collections tab names) plus, per section: a search-and-add box (name/SKU search over published products) and a drag-sortable list of currently-curated items with a remove button. Actions: `addToHomeSection(section, productId)`, `removeFromHomeSection(itemId)`, `reorderHomeSection(section, orderedItemIds)` — all in `app/admin/home-sections/actions.ts`, all gated by `requireAdminAction("home-section.manage")`.

## Storefront — curated-with-fallback fetch

New `lib/data.ts` helper:

```ts
export async function fetchHomeSection(
  section: string,
  limit: number,
  fallback: () => Promise<Product[]>,
): Promise<Product[]> {
  const curated = await prisma.homeSectionItem.findMany({
    where: { section },
    orderBy: { sortOrder: "asc" },
    take: limit,
    include: { product: { include: { categoryRef: true, images: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (curated.length === 0) return fallback();
  return curated.map((item) => item.product);
}
```

`app/(storefront)/page.tsx` and `components/sections/featured-collections-section.tsx` call this instead of calling `fetchDeals`/`fetchTopRated`/`fetchProducts` directly, passing the existing call as the `fallback`. Section keys: `"top-deals"`, `"top-rated"`, `"new-arrivals"`, and the category's own slug for each Featured Collections tab.

## New dependency

`@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2` — accessible drag-and-drop (keyboard support included), nothing comparable already in the project. Raw HTML5 drag-and-drop was considered and rejected: poor screen-reader/keyboard support, which conflicts with the accessibility bar this project has held all session (focus traps, skip links, `prefers-reduced-motion`, etc).

## Testing

`tests/home-section-fallback.test.ts` — can't hit the DB in this project's test convention, so this is a pure-logic test of the fallback *decision*: given curated items vs. empty, confirm which path a small extracted helper picks. (If the logic can't be meaningfully isolated from the Prisma call, skip a dedicated unit test and rely on the manual verification below — consistent with this project's "don't test DB-shaped code" convention.)

## Verification

1. `npm run lint && npm run build && npm test`.
2. Admin: drag-reorder a few products in `/admin/products`, reload, confirm the new order persisted in the admin list (storefront `/products` sort is unaffected — see Non-goals).
3. Admin: on `/admin/home-sections`, add 2-3 products to "Top Deals", reorder them, save; reload the home page and confirm that exact set/order renders in the Top Deals tab. Remove all curated items from a section and confirm it silently falls back to today's automatic behavior.
4. Confirm a brand-new admin (no `home-section.*` permissions) cannot reach `/admin/home-sections` (redirect to `?error=forbidden`), matching the existing PBAC test pattern from Hero Banners.
5. Keyboard-only pass: Tab to a drag handle, Space to pick up, Arrow keys to move, Space to drop — confirm it works without a mouse.
