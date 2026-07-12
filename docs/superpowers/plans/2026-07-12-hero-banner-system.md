# Hero Banner System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Synnex's single-product homepage hero with an admin-manageable, auto-rotating banner carousel (plus a marquee announcement bar), while keeping the existing "more ongoing discounts" strip working underneath it.

**Architecture:** A new `HeroBanner` Prisma model holds admin-authored slides (image, copy, optional linked product, sort order, active flag). A new admin page at `/admin/hero-banners` provides CRUD, reusing the existing image-upload endpoint and the shadcn Dialog/Table pattern already used by `/admin/team`. The storefront's `HeroSection` fetches active banners and renders a new client `HeroCarousel` component (autoplay/arrows/dots/keyboard/reduced-motion); if zero banners exist, it falls back to today's single-featured-deal hero markup so the homepage is never empty. A new static `MarqueeBar` sits above the site header.

**Tech Stack:** Next.js 16 App Router, Prisma + SQLite (`prisma db push`, no migration files in this repo), React 19 Server/Client Components, existing shadcn/ui components (`Table`, `Dialog`, `Card`, `Button`, `Input`, `Label`, `Textarea`, `Select`, `Checkbox`, `Badge`), hand-written CSS in `app/globals.css` (no Tailwind on the storefront), `node --test` for pure-function tests.

## Global Constraints

- This repo has **no migration files** — schema changes are applied with `npm run db:push` (wraps `prisma db push`), not `prisma migrate dev`.
- Storefront pages/components use hand-written CSS classes in `app/globals.css`; **no Tailwind classes** on anything under `app/(storefront)/` or `components/sections/*`, `components/hero-carousel.tsx`, `components/marquee-bar.tsx`. Tailwind is fine only inside `app/admin/**` and `components/ui/**`.
- Every admin mutation goes through `requireAdminAction(permission)` from `lib/admin-access.ts`; every admin page through `requireAdminPage(redirectTo, permission)`. Never hand-roll a session check.
- String-enum-style fields (e.g. `theme`) are validated by a small `["a","b"] as const` + type-guard module, matching `lib/order-status.ts` and `lib/permissions.ts` — never a native Prisma `enum`.
- `tests/permissions.test.ts` asserts `PERMISSION_GROUPS` covers every key in `PERMISSIONS` with no leftovers (`grouped.length === PERMISSIONS.length`) — any new permission key added to `PERMISSIONS` **must** also be added to exactly one `PERMISSION_GROUPS` entry or that existing test fails.
- Money is `Int` (LKR, no decimals); IDs are `String @id @default(cuid())`; FK columns get `@@index([...])`.
- Run `npm run lint && npm run build && npm test` after every task before committing. Commit messages end with the `Co-Authored-By: Claude <noreply@anthropic.com>` trailer.

---

### Task 1: `HeroBanner` schema + relations

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma model `HeroBanner` with fields `id, title, subtitle, imageUrl, imageAlt, ctaLabel, ctaHref, productId, theme, active, sortOrder, createdById, createdAt, updatedAt` and relations `product: Product?`, `createdBy: AdminUser?`. `Product` gains `heroBanners HeroBanner[]`. `AdminUser` gains `createdHeroBanners HeroBanner[]`.

- [ ] **Step 1: Add the back-relation on `Product`**

In `prisma/schema.prisma`, inside `model Product { ... }`, add a new relation line right after `wishlistItems WishlistItem[]` (around line 35):

```prisma
  wishlistItems WishlistItem[]
  inventoryTransactions InventoryTransaction[]
  heroBanners HeroBanner[]
```

- [ ] **Step 2: Add the back-relation on `AdminUser`**

In `model AdminUser { ... }`, add a new relation line right after `paymentGatewayConfigs PaymentGatewayConfig[]` (around line 362):

```prisma
  paymentGatewayConfigs PaymentGatewayConfig[]
  createdHeroBanners    HeroBanner[]
```

- [ ] **Step 3: Add the `HeroBanner` model**

Append this model at the end of `prisma/schema.prisma` (after the `SiteSetting` model):

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
  theme       String   @default("light")
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdById String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product   Product?   @relation(fields: [productId], references: [id], onDelete: SetNull)
  createdBy AdminUser? @relation(fields: [createdById], references: [id], onDelete: SetNull)

  @@index([active])
  @@index([sortOrder])
  @@index([productId])
}
```

- [ ] **Step 4: Push the schema and regenerate the client**

Run: `npm run db:push`
Expected: `Your database is now in sync with your Prisma schema.` (or similar success output), no errors.

Run: `npm run db:generate`
Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 5: Verify with a full build**

Run: `npm run build`
Expected: build succeeds (this exercises the new Prisma types across the whole app's typecheck).

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "$(cat <<'EOF'
Add HeroBanner model for the admin-managed homepage carousel

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `theme` guard module + test

**Files:**
- Create: `lib/hero-banner-theme.ts`
- Test: `tests/hero-banner-theme.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces: `HERO_BANNER_THEMES: readonly ["light", "dark"]`, `type HeroBannerTheme`, `isHeroBannerTheme(value: string): value is HeroBannerTheme` — consumed by Task 6's `actions.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/hero-banner-theme.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { HERO_BANNER_THEMES, isHeroBannerTheme } from "@/lib/hero-banner-theme";

test("hero banner theme guard accepts only cataloged themes", () => {
  assert.equal(isHeroBannerTheme("light"), true);
  assert.equal(isHeroBannerTheme("dark"), true);
  assert.equal(isHeroBannerTheme("neon"), false);
  assert.equal(isHeroBannerTheme(""), false);
});

test("theme catalog has exactly the two supported values", () => {
  assert.deepEqual(HERO_BANNER_THEMES, ["light", "dark"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/hero-banner-theme.test.ts`
Expected: FAIL — cannot find module `@/lib/hero-banner-theme`.

- [ ] **Step 3: Write the implementation**

Create `lib/hero-banner-theme.ts`:

```ts
export const HERO_BANNER_THEMES = ["light", "dark"] as const;

export type HeroBannerTheme = (typeof HERO_BANNER_THEMES)[number];

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value as T[number]);
}

export function isHeroBannerTheme(value: string): value is HeroBannerTheme {
  return includesValue(HERO_BANNER_THEMES, value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/hero-banner-theme.test.ts`
Expected: both tests PASS.

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npm test`
Expected: all tests pass, including the two new ones.

- [ ] **Step 6: Commit**

```bash
git add lib/hero-banner-theme.ts tests/hero-banner-theme.test.ts
git commit -m "$(cat <<'EOF'
Add hero banner theme guard module

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Permission keys

**Files:**
- Modify: `lib/permissions.ts`

**Interfaces:**
- Produces: two new `Permission` values `"hero-banner.view"`, `"hero-banner.manage"`, gated the same way as every other resource via `requireAdminPage`/`requireAdminAction` — consumed by Task 6.

- [ ] **Step 1: Add the two permission keys**

In `lib/permissions.ts`, modify the `PERMISSIONS` array:

```ts
export const PERMISSIONS = [
  "product.view",
  "product.create",
  "product.update",
  "product.delete",
  "category.view",
  "category.create",
  "category.update",
  "category.delete",
  "order.view",
  "order.update",
  "order.paymentUpload.review",
  "settings.view",
  "settings.update",
  "career.manage",
  "download.manage",
  "page.manage",
  "payment-gateway.view",
  "payment-gateway.update",
  "admin.manage",
  "hero-banner.view",
  "hero-banner.manage",
] as const;
```

- [ ] **Step 2: Add a matching `PERMISSION_GROUPS` entry**

In the same file, add a new group so the existing coverage test still passes:

```ts
export const PERMISSION_GROUPS: { label: string; keys: Permission[] }[] = [
  { label: "Products", keys: ["product.view", "product.create", "product.update", "product.delete"] },
  { label: "Categories", keys: ["category.view", "category.create", "category.update", "category.delete"] },
  { label: "Orders", keys: ["order.view", "order.update", "order.paymentUpload.review"] },
  { label: "Settings", keys: ["settings.view", "settings.update"] },
  { label: "Content", keys: ["career.manage", "download.manage", "page.manage"] },
  { label: "Payment gateways", keys: ["payment-gateway.view", "payment-gateway.update"] },
  { label: "Hero banners", keys: ["hero-banner.view", "hero-banner.manage"] },
  { label: "Team", keys: ["admin.manage"] },
];
```

- [ ] **Step 3: Run the existing permissions test to confirm coverage**

Run: `npx tsx --test tests/permissions.test.ts`
Expected: both existing tests PASS (`isPermission` accepts the new keys implicitly since they're just array membership; the group-coverage test passes because every key now belongs to exactly one group).

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/permissions.ts
git commit -m "$(cat <<'EOF'
Add hero-banner.view/manage permission keys

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Seed sample banners

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `HeroBanner` model from Task 1.
- Produces: 2-3 `HeroBanner` rows on a fresh database, so the carousel is never empty out of the box.

- [ ] **Step 1: Add the seeding block**

In `prisma/seed.ts`, insert this block immediately after the admin-bootstrap block ends (right before the `// ─── Seed Site Settings ──` comment, around line 1091):

```ts
  // ─── Seed Hero Banners (rotating homepage carousel) ────────────────────────

  const existingBannerCount = await prisma.heroBanner.count();
  if (existingBannerCount === 0) {
    const bootstrapAdmin = await prisma.adminUser.findFirst({ where: { role: "SuperAdmin" } });
    const bannerProducts = await prisma.product.findMany({
      where: { published: true },
      orderBy: { rating: "desc" },
      take: 2,
    });

    const banners: Array<{
      title: string;
      subtitle: string;
      imageUrl: string;
      imageAlt: string;
      ctaLabel: string;
      ctaHref: string;
      productId: string | null;
      theme: string;
      sortOrder: number;
    }> = [];

    if (bannerProducts[0]) {
      banners.push({
        title: "Deal of the week",
        subtitle: bannerProducts[0].shortDescription || bannerProducts[0].description.slice(0, 120),
        imageUrl: bannerProducts[0].image,
        imageAlt: bannerProducts[0].name,
        ctaLabel: "Shop this deal",
        ctaHref: `/products/${bannerProducts[0].slug}`,
        productId: bannerProducts[0].id,
        theme: "light",
        sortOrder: 0,
      });
    }

    banners.push({
      title: "Islandwide Delivery, Always Genuine",
      subtitle: "Free setup guidance and after-sales support on every POS system we sell.",
      imageUrl: "/products/cash-register.svg",
      imageAlt: "Synnex POS hardware",
      ctaLabel: "Browse catalog",
      ctaHref: "/products",
      productId: null,
      theme: "dark",
      sortOrder: 1,
    });

    if (bannerProducts[1]) {
      banners.push({
        title: "Top rated by our customers",
        subtitle: bannerProducts[1].shortDescription || bannerProducts[1].description.slice(0, 120),
        imageUrl: bannerProducts[1].image,
        imageAlt: bannerProducts[1].name,
        ctaLabel: "Shop this deal",
        ctaHref: `/products/${bannerProducts[1].slug}`,
        productId: bannerProducts[1].id,
        theme: "light",
        sortOrder: 2,
      });
    }

    for (const banner of banners) {
      await prisma.heroBanner.create({
        data: { ...banner, createdById: bootstrapAdmin?.id ?? null },
      });
    }
    console.log(`   Hero banners seeded: ${banners.length}`);
  }
```

- [ ] **Step 2: Run the seed and check the log**

Run: `npm run db:seed`
Expected: output includes a line like `   Hero banners seeded: 3` (or `2` if the catalog somehow has fewer than 2 published products).

- [ ] **Step 3: Verify idempotency (re-running doesn't duplicate)**

Run: `npm run db:seed` again.
Expected: the "Hero banners seeded" line does **not** appear this time (the `existingBannerCount === 0` guard skips it), confirming reseeding is safe.

- [ ] **Step 4: Full build check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "$(cat <<'EOF'
Seed sample hero banners so the carousel isn't empty by default

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `fetchActiveHeroBanners()` data helper

**Files:**
- Modify: `lib/data.ts`

**Interfaces:**
- Consumes: `HeroBanner` model (Task 1).
- Produces: `fetchActiveHeroBanners(): Promise<(HeroBanner & { product: Product | null })[]>` — consumed by Task 8's `hero-section.tsx`.

- [ ] **Step 1: Add the function**

In `lib/data.ts`, add this after the `fetchTopRated` function (after line 89):

```ts
export async function fetchActiveHeroBanners() {
  return prisma.heroBanner.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { product: true },
  });
}
```

- [ ] **Step 2: Verify with a build**

Run: `npm run build`
Expected: build succeeds (confirms the Prisma include shape typechecks).

- [ ] **Step 3: Commit**

```bash
git add lib/data.ts
git commit -m "$(cat <<'EOF'
Add fetchActiveHeroBanners data helper

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Admin CRUD for hero banners

**Files:**
- Create: `app/admin/hero-banners/actions.ts`
- Create: `app/admin/hero-banners/page.tsx`
- Create: `app/admin/hero-banners/banner-manager.tsx`
- Modify: `app/api/admin/uploads/route.ts`
- Modify: `components/sections/admin-sidebar-nav.tsx`

**Interfaces:**
- Consumes: `requireAdminAction`/`requireAdminPage` (`lib/admin-access.ts`), `isHeroBannerTheme` (Task 2), `"hero-banner.view"`/`"hero-banner.manage"` (Task 3), `prisma.heroBanner` (Task 1).
- Produces: server actions `createHeroBanner(formData)`, `updateHeroBanner(id, formData)`, `deleteHeroBanner(id)`, `toggleHeroBannerActive(id, active)`, each returning `{ success: true }` or throwing `Error`. Admin page reachable at `/admin/hero-banners`.

- [ ] **Step 1: Extend the upload endpoint's permission check**

In `app/api/admin/uploads/route.ts`, the upload button in the new banner form needs to work for admins who only hold `hero-banner.manage` (not `product.*`). Replace:

```ts
  const admin =
    (await requireAdminApi("product.create")) ?? (await requireAdminApi("product.update"));
```

with:

```ts
  const admin =
    (await requireAdminApi("product.create")) ??
    (await requireAdminApi("product.update")) ??
    (await requireAdminApi("hero-banner.manage"));
```

- [ ] **Step 2: Write the server actions**

Create `app/admin/hero-banners/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { isHeroBannerTheme } from "@/lib/hero-banner-theme";

function readBannerFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const subtitle = ((formData.get("subtitle") as string) || "").trim();
  const imageUrl = ((formData.get("imageUrl") as string) || "").trim();
  const imageAlt = ((formData.get("imageAlt") as string) || "").trim();
  const ctaLabel = ((formData.get("ctaLabel") as string) || "").trim();
  const ctaHref = ((formData.get("ctaHref") as string) || "").trim();
  const productIdRaw = ((formData.get("productId") as string) || "").trim();
  const themeRaw = ((formData.get("theme") as string) || "light").trim();
  const active = formData.get("active") === "on";
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10);

  if (!title || !imageUrl) {
    throw new Error("Title and image are required");
  }

  return {
    title,
    subtitle: subtitle || null,
    imageUrl,
    imageAlt: imageAlt || null,
    ctaLabel: ctaLabel || null,
    ctaHref: ctaHref || null,
    productId: productIdRaw && productIdRaw !== "none" ? productIdRaw : null,
    theme: isHeroBannerTheme(themeRaw) ? themeRaw : "light",
    active,
    sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
  };
}

export async function createHeroBanner(formData: FormData) {
  const admin = await requireAdminAction("hero-banner.manage");
  const data = readBannerFields(formData);

  await prisma.heroBanner.create({
    data: { ...data, createdById: admin.id },
  });

  revalidatePath("/admin/hero-banners");
  revalidatePath("/");
  return { success: true };
}

export async function updateHeroBanner(id: string, formData: FormData) {
  await requireAdminAction("hero-banner.manage");
  const data = readBannerFields(formData);

  await prisma.heroBanner.update({ where: { id }, data });

  revalidatePath("/admin/hero-banners");
  revalidatePath("/");
  return { success: true };
}

export async function deleteHeroBanner(id: string) {
  await requireAdminAction("hero-banner.manage");
  await prisma.heroBanner.delete({ where: { id } });

  revalidatePath("/admin/hero-banners");
  revalidatePath("/");
  return { success: true };
}

export async function toggleHeroBannerActive(id: string, active: boolean) {
  await requireAdminAction("hero-banner.manage");
  await prisma.heroBanner.update({ where: { id }, data: { active } });

  revalidatePath("/admin/hero-banners");
  revalidatePath("/");
  return { success: true };
}
```

- [ ] **Step 3: Write the page**

Create `app/admin/hero-banners/page.tsx`:

```tsx
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { BannerManager } from "./banner-manager";

export default async function AdminHeroBannersPage() {
  await requireAdminPage("/admin/hero-banners", "hero-banner.view");

  const [banners, products] = await Promise.all([
    prisma.heroBanner.findMany({
      orderBy: { sortOrder: "asc" },
      include: { product: { select: { id: true, name: true } } },
    }),
    prisma.product.findMany({
      where: { published: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <BannerManager banners={banners} products={products} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Write the manager component**

Create `app/admin/hero-banners/banner-manager.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  toggleHeroBannerActive,
} from "./actions";

type BannerProduct = { id: string; name: string };

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  productId: string | null;
  theme: string;
  active: boolean;
  sortOrder: number;
  product: BannerProduct | null;
};

export function BannerManager({
  banners,
  products,
}: {
  banners: Banner[];
  products: BannerProduct[];
}) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditingBanner(null);
    setImageUrl("");
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setImageUrl(banner.imageUrl);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }
      setImageUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("imageUrl", imageUrl);
    try {
      if (!imageUrl) {
        throw new Error("Please upload an image first");
      }
      if (editingBanner) {
        await updateHeroBanner(editingBanner.id, formData);
      } else {
        await createHeroBanner(formData);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save banner");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteHeroBanner(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete banner");
    }
  }

  async function handleToggleActive(banner: Banner) {
    try {
      await toggleHeroBannerActive(banner.id, !banner.active);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / hero banners</p>
          <h1 className="text-2xl font-bold text-foreground">Homepage carousel</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{banners.length} banners</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Linked product</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <div className="relative h-12 w-20 overflow-hidden rounded-md bg-muted">
                      <Image src={banner.imageUrl} alt={banner.imageAlt || banner.title} fill className="object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{banner.product?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{banner.sortOrder}</TableCell>
                  <TableCell>
                    <Badge className={banner.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                      {banner.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(banner)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(banner)}>
                        {banner.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(banner)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No banners yet — the homepage falls back to the top deal.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit banner" : "Add banner"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-title">Title</Label>
              <Input id="banner-title" name="title" required defaultValue={editingBanner?.title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-subtitle">Subtitle</Label>
              <Textarea id="banner-subtitle" name="subtitle" rows={2} defaultValue={editingBanner?.subtitle ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-image">Image</Label>
              <Input
                id="banner-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              {isUploading ? <p className="text-sm text-muted-foreground">Uploading…</p> : null}
              {imageUrl ? (
                <div className="relative h-24 w-40 overflow-hidden rounded-md bg-muted">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-image-alt">Image alt text</Label>
              <Input id="banner-image-alt" name="imageAlt" defaultValue={editingBanner?.imageAlt ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-cta-label">CTA label</Label>
              <Input id="banner-cta-label" name="ctaLabel" placeholder="Shop now" defaultValue={editingBanner?.ctaLabel ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-cta-href">CTA link</Label>
              <Input id="banner-cta-href" name="ctaHref" placeholder="/products" defaultValue={editingBanner?.ctaHref ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-product">Linked product (optional)</Label>
              <Select name="productId" defaultValue={editingBanner?.productId ?? "none"}>
                <SelectTrigger id="banner-product" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-theme">Text theme</Label>
              <Select name="theme" defaultValue={editingBanner?.theme ?? "light"}>
                <SelectTrigger id="banner-theme" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light background</SelectItem>
                  <SelectItem value="dark">Dark background</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="banner-sort-order">Sort order</Label>
              <Input id="banner-sort-order" name="sortOrder" type="number" defaultValue={editingBanner?.sortOrder ?? 0} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="active" defaultChecked={editingBanner?.active ?? true} />
              Active
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>{editingBanner ? "Save changes" : "Create banner"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete banner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This can&apos;t be undone.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 5: Add the sidebar nav entry**

In `components/sections/admin-sidebar-nav.tsx`, add `GalleryHorizontal` to the lucide-react import list (alongside `Gauge`, `Package`, etc.) and add a nav entry right after the `Products` entry:

```ts
import {
  BriefcaseBusiness,
  ClipboardList,
  Database,
  Download,
  FileText,
  GalleryHorizontal,
  Gauge,
  Package,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";
```

```ts
const navItems: { label: string; icon: typeof Gauge; href: string; permission?: Permission }[] = [
  { label: "Overview", icon: Gauge, href: "/admin" },
  { label: "Orders", icon: ClipboardList, href: "/admin/orders", permission: "order.view" },
  { label: "Products", icon: Package, href: "/admin/products", permission: "product.view" },
  { label: "Hero Banners", icon: GalleryHorizontal, href: "/admin/hero-banners", permission: "hero-banner.view" },
  { label: "Customers", icon: Users, href: "/admin/orders" },
  { label: "Content", icon: FileText, href: "/admin/content" },
  { label: "Careers", icon: BriefcaseBusiness, href: "/admin/careers", permission: "career.manage" },
  { label: "Downloads", icon: Download, href: "/admin/downloads", permission: "download.manage" },
  { label: "Pages", icon: Database, href: "/admin/pages", permission: "page.manage" },
  { label: "Settings", icon: Settings, href: "/admin/settings", permission: "settings.view" },
  { label: "Team", icon: UsersRound, href: "/admin/team", permission: "admin.manage" },
];
```

- [ ] **Step 6: Verify with lint + build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 7: Manual verification**

Start the dev server, log in to `/admin/login` as the bootstrap SuperAdmin, visit `/admin/hero-banners`:
- Confirm the 3 seeded banners appear in the table.
- Click "Add banner", upload an image, fill in title + CTA, save — confirm it appears in the table.
- Click "Edit" on a banner, change its title, save — confirm the change persists.
- Click "Deactivate" — confirm the badge flips to "Inactive".
- Click the trash icon, confirm the delete dialog, delete — confirm the row disappears.

- [ ] **Step 8: Commit**

```bash
git add app/admin/hero-banners app/api/admin/uploads/route.ts components/sections/admin-sidebar-nav.tsx
git commit -m "$(cat <<'EOF'
Add admin CRUD for hero banners

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Marquee announcement bar

**Files:**
- Create: `components/marquee-bar.tsx`
- Modify: `app/(storefront)/layout.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `<MarqueeBar />` — a self-contained, static component with no props.

- [ ] **Step 1: Write the component**

Create `components/marquee-bar.tsx`:

```tsx
const MARQUEE_MESSAGES = [
  "100% Genuine Products",
  "Islandwide Delivery — Colombo & Outstation",
  "1-Year Warranty on Most Hardware",
  "WhatsApp Support for Setup & After-Sales",
];

export function MarqueeBar() {
  return (
    <div className="marquee-bar" aria-label="Store highlights">
      <div className="marquee-track">
        {[...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES].map((message, index) => (
          <span key={index}>{message}</span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the storefront layout**

In `app/(storefront)/layout.tsx`, add the import and render it above `<SiteHeader />`:

```tsx
import { CartProvider } from "@/components/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarqueeBar } from "@/components/marquee-bar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <MarqueeBar />
      <SiteHeader />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
    </CartProvider>
  );
}
```

- [ ] **Step 3: Add the CSS**

In `app/globals.css`, insert this block immediately before the `.hero {` rule at line 504 (right after the `.sub-pill.active { ... }` block):

```css
.marquee-bar {
  overflow: hidden;
  background: var(--ink);
  color: var(--white);
  padding: 8px 0;
}

.marquee-bar:hover .marquee-track {
  animation-play-state: paused;
}

.marquee-track {
  display: flex;
  width: max-content;
  gap: 48px;
  animation: marquee 30s linear infinite;
}

.marquee-track span {
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding-right: 48px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.marquee-track span:last-child {
  border-right: 0;
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
}

@media (max-width: 640px) {
  .marquee-track span {
    font-size: 0.7rem;
  }
}
```

- [ ] **Step 4: Verify with lint + build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 5: Manual verification**

Load the homepage in the browser:
- Confirm the marquee scrolls continuously above the header.
- Hover over it — confirm it pauses.
- Emulate `prefers-reduced-motion: reduce` (e.g. via `resize_window` colorScheme isn't it — use the browser's OS-level emulation or `javascript_tool` to check `matchMedia`) and confirm the animation stops.
- Resize to 375px — confirm text shrinks and still fits without wrapping oddly.

- [ ] **Step 6: Commit**

```bash
git add components/marquee-bar.tsx app/\(storefront\)/layout.tsx app/globals.css
git commit -m "$(cat <<'EOF'
Add scrolling marquee announcement bar above the header

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `HeroCarousel` component + rewire `HeroSection`

**Files:**
- Create: `components/hero-carousel.tsx`
- Modify: `components/sections/hero-section.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `fetchActiveHeroBanners` (Task 5), `fetchDeals`/`fetchTopRated` (existing), `formatCurrency` (existing `lib/api-client.ts`).
- Produces: `<HeroCarousel banners={CarouselBanner[]} />` client component; `HeroSection` server component unchanged in export shape (`export async function HeroSection()`), so `app/(storefront)/page.tsx` needs no changes.

- [ ] **Step 1: Write the carousel component**

Create `components/hero-carousel.tsx`:

```tsx
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
```

- [ ] **Step 2: Rewire `hero-section.tsx`**

Replace the full contents of `components/sections/hero-section.tsx` with:

```tsx
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
        <HeroCarousel
          banners={banners.map((banner) => ({
            id: banner.id,
            title: banner.title,
            subtitle: banner.subtitle,
            imageUrl: banner.imageUrl,
            imageAlt: banner.imageAlt,
            ctaLabel: banner.ctaLabel,
            ctaHref: banner.ctaHref,
            theme: banner.theme,
            product: banner.product
              ? {
                  slug: banner.product.slug,
                  name: banner.product.name,
                  price: banner.product.price,
                  compareAt: banner.product.compareAt,
                  rating: banner.product.rating,
                }
              : null,
          }))}
        />
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
```

- [ ] **Step 3: Simplify the `.hero-deals-strip` rule (no longer a grid item)**

The strip now sits inside a plain `.hero-shell` block (not the `.hero` grid), so the `grid-column`/`min-width` declarations added in an earlier session are dead weight. In `app/globals.css`, find:

```css
.hero-deals-strip {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
  min-width: 0;
}
```

Replace with:

```css
.hero-deals-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 0 clamp(18px, 4vw, 56px) 24px;
}
```

- [ ] **Step 4: Add the carousel CSS**

In `app/globals.css`, insert this block immediately after the `.hero-rating { ... }` rule (right before the `/* Category Tiles */` comment):

```css
.hero-carousel {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 180px);
}

.hero-carousel-slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: clamp(24px, 4vw, 56px) clamp(18px, 4vw, 56px) clamp(24px, 4vw, 48px);
  opacity: 0;
  visibility: hidden;
  transition: opacity 500ms ease, visibility 0s linear 500ms;
  pointer-events: none;
}

.hero-carousel-slide.is-active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 500ms ease;
}

.hero-carousel-image {
  object-fit: cover;
  z-index: -1;
}

.hero-carousel-slide.theme-dark {
  color: var(--white);
}

.hero-carousel-slide.theme-dark::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(120deg, rgba(10, 15, 25, 0.72) 0%, rgba(10, 15, 25, 0.35) 65%, rgba(10, 15, 25, 0.1) 100%);
}

.hero-carousel-slide.theme-light::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.55) 60%, rgba(255, 255, 255, 0.15) 100%);
}

.hero-carousel-copy {
  max-width: 660px;
  position: relative;
}

.hero-carousel-copy h1 {
  margin: 0;
  font-size: clamp(2.2rem, 5vw, 4.2rem);
  line-height: 1;
  letter-spacing: -0.01em;
}

.hero-carousel-copy p {
  max-width: 590px;
  margin: 20px 0 28px;
  font-size: 1.02rem;
  line-height: 1.7;
}

.theme-dark .hero-carousel-copy p {
  color: rgba(255, 255, 255, 0.85);
}

.theme-light .hero-carousel-copy p {
  color: #4d5a6e;
}

.hero-carousel-arrow {
  position: absolute;
  top: 50%;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.35);
  color: var(--white);
  transform: translateY(-50%);
  transition: background 150ms ease;
}

.hero-carousel-arrow:hover {
  background: rgba(17, 24, 39, 0.55);
}

.hero-carousel-arrow-prev {
  left: 18px;
}

.hero-carousel-arrow-next {
  right: 18px;
}

.hero-carousel-dots {
  position: absolute;
  bottom: 22px;
  left: 50%;
  z-index: 3;
  display: flex;
  gap: 8px;
  transform: translateX(-50%);
}

.hero-carousel-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.5);
  transition: background 150ms ease, transform 150ms ease;
}

.hero-carousel-dot[data-active="true"] {
  background: var(--white);
  transform: scale(1.25);
}

.theme-light .hero-carousel-dot {
  background: rgba(17, 24, 39, 0.25);
}

.theme-light .hero-carousel-dot[data-active="true"] {
  background: var(--ink);
}

@media (max-width: 980px) {
  .hero-carousel {
    min-height: 620px;
  }

  .hero-carousel-slide {
    align-items: flex-end;
    padding-bottom: 200px;
  }
}

@media (max-width: 640px) {
  .hero-carousel {
    min-height: 560px;
  }

  .hero-carousel-copy h1 {
    font-size: 2rem;
  }

  .hero-carousel-slide .hero-product-card {
    width: calc(100% - 36px);
  }
}
```

- [ ] **Step 5: Verify with lint + build + test**

Run: `npm run lint && npm run build && npm test`
Expected: all succeed with no errors.

- [ ] **Step 6: Manual verification — desktop**

Start the dev server, load the homepage:
- Confirm the carousel shows the 3 seeded banners, crossfading automatically every ~5 seconds.
- Hover over the carousel — confirm autoplay pauses; move away — confirm it resumes.
- Click the prev/next arrows — confirm they move slides and autoplay doesn't fight the manual click.
- Click a dot — confirm it jumps to that slide.
- Tab into the carousel and press ArrowLeft/ArrowRight — confirm slides change.
- Confirm the "more ongoing discounts" strip still renders below the carousel with 4 mini cards.
- Confirm a banner with a linked product shows the price/discount/rating card bottom-right, matching the pre-carousel visual treatment.

- [ ] **Step 7: Manual verification — reduced motion + empty state + mobile**

- Emulate `prefers-reduced-motion: reduce` (via the browser devtools rendering panel or OS setting) and reload — confirm autoplay does not start but arrows/dots still work.
- In `/admin/hero-banners`, deactivate all 3 banners, reload the homepage — confirm it falls back to the single-featured-deal hero (today's pre-carousel markup) instead of an empty section. Reactivate them afterward.
- Resize to 375px width — confirm the carousel text and product card don't overlap and remain readable; adjust the `@media (max-width: 640px)` rule from Step 4 if anything overlaps.

- [ ] **Step 8: Commit**

```bash
git add components/hero-carousel.tsx components/sections/hero-section.tsx app/globals.css
git commit -m "$(cat <<'EOF'
Replace single-product hero with an admin-managed banner carousel

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Final end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full gate run**

Run: `npm run lint && npm run build && npm test`
Expected: all pass.

- [ ] **Step 2: Full homepage walkthrough**

In the browser: load `/`, confirm top-to-bottom: marquee bar → carousel (autoplay/arrows/dots working) → deals strip → trust band → hot deals row → category showcase → top rated → new arrivals → quote CTA, with no console errors (`read_console_messages`) and no layout overflow (`document.documentElement.scrollWidth` matches viewport width, modulo the known pre-existing off-canvas cart-drawer artifact).

- [ ] **Step 3: Admin walkthrough**

Log in to `/admin`, confirm "Hero Banners" appears in the sidebar only for admins with `hero-banner.view`. Create an admin with no permissions via `/admin/team` and confirm they cannot see or reach `/admin/hero-banners` (redirected with `?error=forbidden`).

- [ ] **Step 4: Mobile + tablet pass**

Resize to 375px and 768px, re-check the carousel, marquee, and deals strip for overflow or overlap.

- [ ] **Step 5: Final commit if any fixes were needed**

If Steps 2-4 required tweaks, commit them:

```bash
git add -A
git commit -m "$(cat <<'EOF'
Fix issues found in hero banner carousel end-to-end verification

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
