# Finish admin shadcn conversion + add content CRUD

## Context

5 of 12 admin pages (Dashboard, Orders list/detail/filters, Hero Banners,
Team, Home Sections) already run on shadcn/Tailwind. The remaining 7
(Careers, Content, Downloads, Settings, Products list + detail, Login,
Pages) are still on the old hand-written CSS system
(`admin-panel`/`management-table`/a bespoke `Modal`), a known backlog item
from an earlier planning pass in this project that was never executed.

A live audit of the admin panel also found that Careers, Downloads, and
Pages are 100% read-only today — no create/edit/delete/publish-toggle
exists for any of them, despite their nav labels implying management —
and that the Products list has no search, filter, or pagination despite
holding 171 products. Since converting a page's UI is the natural time to
also fix what's broken about it, this spec folds both gaps in rather than
treating them as separate follow-ups.

This is scoped apart from the separately-planned "admin bug-fix pass"
(dead search box, SKU generation, logout wiring, etc. —
`2026-07-16-admin-bug-fix-pass-design.md`); Fix 5 from that spec (login
page hygiene) is executed together with this spec's Login conversion
since both touch the same file.

## Goals

- Convert every remaining old-CSS admin page to the shadcn/Tailwind
  system already used elsewhere in admin, so the whole panel is visually
  and structurally consistent.
- Add real CRUD (create, edit, delete, publish toggle) for Careers,
  Downloads, and Pages, following the exact pattern already proven this
  session for Hero Banners and Home Sections (`"use server"` actions
  gated by `requireAdminAction`, a client manager component with a
  shadcn `Dialog` form, `revalidatePath` on mutation).
- Add search, category filter, and pagination to the Products list.

## Non-goals

- No changes to `app/globals.css`'s storefront rules or the
  Tailwind/PostCSS wiring itself (already set up from the earlier admin
  shadcn pass) — only page-level markup changes.
- No new shadcn component installs — `dialog`, `checkbox`, `card`,
  `table`, `badge`, `input`, `select`, `label`, `textarea`, `separator`,
  `button` already exist in `components/ui/`, which covers everything
  needed here.
- No changes to `PaymentInstruction` or `SiteSetting` — Settings page
  conversion is visual only, its `saveSettings` action is untouched.
- Careers/Downloads/Pages get no new fields — CRUD covers exactly the
  fields already in their Prisma models (see below).

## Permissions

Add `career.view`, `download.view`, `page.view` to `lib/permissions.ts`,
alongside the existing `career.manage`/`download.manage`/`page.manage`
— matching the `.view`/`.manage` split already used by Hero Banners and
Home Sections (view gates the page, manage gates mutations). Each new
key joins its existing group in `PERMISSION_GROUPS`. Existing
`.manage` grants are untouched, so no admin loses access; `.view` is
additive.

`app/admin/careers/page.tsx`, `downloads/page.tsx`, `pages/page.tsx`
change their `requireAdminPage(path, "X.manage")` call to
`requireAdminPage(path, "X.view")`. New Server Actions gate on
`"X.manage"`.

## Careers CRUD

`JobPost` (`prisma/schema.prisma`): slug, title, department, location,
type, summary, requirements, published, createdAt, updatedAt.

- A `slugify` function already exists but is private to
  `app/admin/products/actions.ts`. Extract it into a new
  `lib/slugify.ts` (single exported `slugify(text: string): string`,
  identical implementation), update `products/actions.ts` to import it
  instead of defining its own, and have careers/downloads/pages actions
  import the same shared function — avoids three more copies of the
  same logic.
- `app/admin/careers/actions.ts` (new): `createJobPost`, `updateJobPost`,
  `deleteJobPost` — each `requireAdminAction("career.manage")` first,
  validate required string fields are non-empty, slugify `title` into
  `slug` if not explicitly provided, `revalidatePath("/admin/careers")`.
- `app/admin/careers/career-manager.tsx` (new, replaces the current
  read-only markup): shadcn `Table` (title, department, location, type,
  published `Badge`, actions column), an "Add job post" `Button` opening
  a `Dialog` with the create form, per-row "Edit" opening the same
  `Dialog` pre-filled, per-row "Deactivate/Activate" `Button` calling a
  dedicated toggle (reuse the exact pattern from
  `app/admin/hero-banners/banner-manager.tsx`'s `active` toggle — a
  `Badge` + text button, not a new `Switch` component), per-row delete
  with a confirm `Dialog`.
- `app/admin/careers/page.tsx`: fetch all `JobPost` rows, pass to
  `CareerManager`.

## Downloads CRUD

`DriverDownload`: slug, title, deviceType, version, os, fileUrl, notes,
published, updatedAt. Identical shape and pattern to Careers
(`app/admin/downloads/actions.ts`, `download-manager.tsx`) — same
Table/Dialog/Badge-toggle/delete-confirm structure, fields swapped for
this model's columns (device type, OS, version, file URL as an `Input`,
notes as a `Textarea`).

## Pages CRUD

`PageContent`: slug, title, summary, body, seoTitle, seoDescription,
published, updatedAt. Same pattern again
(`app/admin/pages/actions.ts`, `page-manager.tsx`). `summary` and `body`
use `Textarea`; `seoTitle`/`seoDescription` are optional `Input`s in
their own "SEO" section of the form, visually separated with a shadcn
`Separator`.

## Settings page

Pure visual conversion of `app/admin/settings/page.tsx` +
`actions.ts`'s existing form — `Card` + `Input`/`Label`/`Textarea` in
the same 2-column grid pattern already used by the order-detail update
form. `saveSettings` action itself is untouched (already works, gated by
`requireAdminAction("settings.update")`).

## Login page

Convert `app/admin/login/page.tsx` to a centered shadcn `Card` +
`Input`/`Label`/`Button`, keeping the plain
`<form action="/api/auth/login" method="post">` (no Server Action
change — it posts to the existing API route). Combined with the
bug-fix spec's Fix 5 in the same pass since both touch this one file:
drop the hardcoded `defaultValue="admin@synnex.lk"`, and redirect to
`/admin` at the top of the page if a valid admin session already exists.

## Modal → Dialog

Swap `product-manager.tsx`'s two `<Modal>` call sites (add-product,
delete-confirm) to shadcn `Dialog` (`open`/`onOpenChange` instead of
`isOpen`/`onClose`, content wrapped in
`DialogContent`/`DialogHeader`/`DialogTitle`). Delete
`components/admin/modal.tsx` once both call sites are migrated and
nothing else imports it (confirmed today: nothing else does).

## Products list + detail

`app/admin/products/page.tsx` + `product-manager.tsx`: convert the
`management-table` rows to a shadcn `Table` (keeping the existing
`SortableList`/drag-and-drop wrapper from the product-ordering feature —
this conversion changes the row markup inside `SortableList`, not the
drag mechanism itself). Add a search `Input` (filter by name,
client-side `useMemo` filter — 171 rows is small enough that a
server round-trip isn't needed) and a category `Select` filter, plus
pagination (page size 25, consistent with `app/admin/orders/page.tsx`'s
existing pagination pattern). The buggy raw-CUID display
(`product.id.toUpperCase()`) is replaced by the real generated SKU from
the bug-fix spec's Fix 2 — this spec assumes that fix has already
landed; if not, fall back to showing nothing rather than the id.

`app/admin/products/[id]/page.tsx`: convert to `Card`-based layout and
fix the pre-existing inconsistency where this page renders without
`<AdminSidebar>`/`admin-shell` (every other admin page has it).

`components/admin/product-form.tsx` (13 fields): convert to
`Input`/`Label`/`Textarea`/`Checkbox` (published)/`Button` in a 2-column
grid, matching the Settings-page layout. The `accent` color field stays
a native `<input type="color">` (Tailwind-styled, no shadcn color-picker
primitive exists) — same try/catch-and-display-error pattern as today,
no new validation library.

## Testing

- `tests/slugify.test.ts`: covers the extracted `lib/slugify.ts`
  (lowercasing, whitespace/punctuation handling, already covered
  informally by `products/actions.ts`'s current behavior — now made
  explicit since three more call sites depend on it).
- Everything else here is DB-backed CRUD + UI, consistent with this
  project's existing convention of leaving that class of code covered
  by manual end-to-end verification rather than integration tests (see
  Home Sections / Hero Banners, which followed the same approach).

## Verification

- `npm run lint`, `npm run build`, `npm test` after the full pass.
- Log in as SuperAdmin and click through every converted page: Login,
  Settings, Careers (create/edit/publish-toggle/delete a job post),
  Downloads (same for a driver download), Pages (same for a page),
  Products (search, filter, paginate, add/edit/delete via the new
  Dialog, confirm drag-reorder still works), Content (confirm the dead
  panel removed by the bug-fix spec stays removed).
- Create a second admin with only `career.view` (no `career.manage`)
  via Team, confirm they can see the Careers list but the mutation
  actions are inaccessible/fail.
- Confirm the storefront (`/`, `/products`, `/careers`, `/downloads`)
  still renders correctly from the same underlying data after admin-side
  edits — e.g. edit a job post's title in admin, confirm it shows
  updated on the public `/careers` page.
