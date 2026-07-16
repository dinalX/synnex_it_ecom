# Admin shadcn conversion + content CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the last 7 old-CSS admin pages (Careers, Content, Downloads, Settings, Products list + detail, Login, Pages) to the shadcn/Tailwind system already used elsewhere in admin, add real create/edit/delete/publish-toggle for Careers, Downloads, and Pages (currently 100% read-only), and add search/category-filter to the Products list.

**Architecture:** Every content-management page follows the exact pattern already proven this session for Hero Banners and Home Sections: a server-component `page.tsx` fetches rows and renders a `"use client"` manager component; the manager renders a shadcn `Table` or Card-row list plus a shadcn `Dialog` form for create/edit; a co-located `actions.ts` exposes `"use server"` functions gated by `requireAdminAction(permission)`, each calling `revalidatePath(...)`.

**Tech Stack:** Next.js App Router Server Components + Server Actions, Prisma, shadcn/ui (`components/ui/*` — all components needed already exist, no new installs), Tailwind.

## Global Constraints

- No new shadcn component installs — `dialog`, `checkbox`, `card`, `table`, `badge`, `input`, `select`, `label`, `textarea`, `separator`, `button` already exist in `components/ui/`.
- No changes to `app/globals.css` storefront rules or the Tailwind/PostCSS wiring itself.
- No changes to `PaymentInstruction` or `SiteSetting` schema; `saveSettings` in `app/admin/settings/actions.ts` is untouched — Settings page conversion is visual only.
- Careers/Downloads/Pages CRUD covers exactly the fields already in their Prisma models (`JobPost`, `DriverDownload`, `PageContent`) — no new fields.
- Permission keys: add `career.view`, `download.view`, `page.view` alongside the existing `career.manage`/`download.manage`/`page.manage`. Pages gate on `.view`; mutating Server Actions gate on `.manage`. Existing `.manage` grants are untouched — `.view` is additive, no admin loses access.
- Run `npm run lint` and `npm run build` after every task; keep `npm test` green (16+ existing tests must continue passing).
- `slugify` currently lives as a private function inside `app/admin/products/actions.ts` — Task 1 extracts it to `lib/slugify.ts` so Careers/Downloads/Pages can reuse it instead of copy-pasting it three more times.
- **Design refinement (products list, Task 7):** the existing drag-and-drop reorder (`SortableList` + `reorderProducts`) assumes the *entire* product array is present and sets `sortOrder` to each item's array index. True numbered pagination would corrupt this (page 2's index-0 would collide with page 1's index-0). Resolution: search/category filtering is client-side over the full fetched array (171 rows is small enough — no server round-trip, no true pagination). When no filter is active, the list is fully draggable exactly as today. When a filter is active, the filtered subset renders read-only (no drag handles) with a note explaining why — reordering a filtered subset is undefined behavior, so it's disabled rather than guessed at.
- **Design refinement (products list, Task 7):** `SortableList` renders each row as a plain `<div>` (it's shared with Home Sections, which is not a literal table), so product rows use the same Card + bordered-div-row visual pattern already shipped in `app/admin/home-sections/home-section-manager.tsx`, not a literal shadcn `<Table>` — this keeps one row-rendering function usable both inside `SortableList` (unfiltered) and in a plain `.map()` (filtered), and requires zero changes to the shared `SortableList` component.

---

### Task 1: Shared slugify module + view permissions

**Files:**
- Create: `lib/slugify.ts`
- Create: `tests/slugify.test.ts`
- Modify: `app/admin/products/actions.ts:8-18` (remove local `slugify`, import shared one)
- Modify: `lib/permissions.ts`
- Modify: `components/sections/admin-sidebar-nav.tsx:33-35`

**Interfaces:**
- Produces: `slugify(text: string): string` from `@/lib/slugify`, used by Tasks 2, 3, 4.
- Produces: permission keys `"career.view"`, `"download.view"`, `"page.view"` (in `Permission` type), used by Tasks 2, 3, 4's `page.tsx` rewrites.

- [ ] **Step 1: Write the failing test**

Create `tests/slugify.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { slugify } from "@/lib/slugify";

test("slugify lowercases and hyphenates whitespace", () => {
  assert.equal(slugify("Warehouse Assistant"), "warehouse-assistant");
});

test("slugify strips punctuation", () => {
  assert.equal(slugify("Sales Executive - POS Solutions!"), "sales-executive-pos-solutions");
});

test("slugify collapses repeated hyphens and trims leading/trailing ones", () => {
  assert.equal(slugify("  --Multiple   Spaces--  "), "multiple-spaces");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/slugify.test.ts`
Expected: FAIL — `Cannot find module '@/lib/slugify'` (file doesn't exist yet).

- [ ] **Step 3: Create the shared module**

Create `lib/slugify.ts` — identical implementation to the function currently private in `app/admin/products/actions.ts`:

```ts
export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/slugify.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Update `app/admin/products/actions.ts` to use the shared function**

In `app/admin/products/actions.ts`, replace lines 8-18 (the local `function slugify(text: string) { ... }` block) with:

```ts
import { slugify } from "@/lib/slugify";
```

Place this import alongside the existing imports at the top of the file (after `import { isPrismaUniqueError } from "@/lib/order-service";`), and delete the old local function definition entirely.

- [ ] **Step 6: Add the three new permission keys**

In `lib/permissions.ts`, change:

```ts
  "career.manage",
  "download.manage",
  "page.manage",
```

to:

```ts
  "career.view",
  "career.manage",
  "download.view",
  "download.manage",
  "page.view",
  "page.manage",
```

And change the `"Content"` entry in `PERMISSION_GROUPS`:

```ts
  { label: "Content", keys: ["career.manage", "download.manage", "page.manage"] },
```

to:

```ts
  { label: "Content", keys: ["career.view", "career.manage", "download.view", "download.manage", "page.view", "page.manage"] },
```

- [ ] **Step 7: Update sidebar nav gating**

In `components/sections/admin-sidebar-nav.tsx`, change lines 33-35 from:

```ts
  { label: "Careers", icon: BriefcaseBusiness, href: "/admin/careers", permission: "career.manage" },
  { label: "Downloads", icon: Download, href: "/admin/downloads", permission: "download.manage" },
  { label: "Pages", icon: Database, href: "/admin/pages", permission: "page.manage" },
```

to:

```ts
  { label: "Careers", icon: BriefcaseBusiness, href: "/admin/careers", permission: "career.view" },
  { label: "Downloads", icon: Download, href: "/admin/downloads", permission: "download.view" },
  { label: "Pages", icon: Database, href: "/admin/pages", permission: "page.view" },
```

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the existing `tests/permissions.test.ts` (its `grouped.length === PERMISSIONS.length` assertion must still hold — it will, since every new key was added to both places in Step 6).

- [ ] **Step 9: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 10: Commit**

```bash
git add lib/slugify.ts tests/slugify.test.ts app/admin/products/actions.ts lib/permissions.ts components/sections/admin-sidebar-nav.tsx
git commit -m "Extract shared slugify helper and add career/download/page view permissions"
```

---

### Task 2: Careers CRUD

**Files:**
- Create: `app/admin/careers/actions.ts`
- Create: `app/admin/careers/career-manager.tsx`
- Modify: `app/admin/careers/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `slugify` from `@/lib/slugify` (Task 1), permission key `"career.view"` (Task 1) for the page gate, `"career.manage"` (pre-existing) for actions.
- Produces: `createJobPost(formData)`, `updateJobPost(id, formData)`, `deleteJobPost(id)`, `toggleJobPostPublished(id, published)` from `./actions` — not consumed by any other task.

- [ ] **Step 1: Write the Server Actions**

Create `app/admin/careers/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { isPrismaUniqueError } from "@/lib/order-service";
import { slugify } from "@/lib/slugify";

function readJobPostFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const department = ((formData.get("department") as string) || "").trim();
  const location = ((formData.get("location") as string) || "").trim();
  const type = ((formData.get("type") as string) || "").trim();
  const summary = ((formData.get("summary") as string) || "").trim();
  const requirements = ((formData.get("requirements") as string) || "").trim();
  const published = formData.get("published") === "on";

  if (!title || !department || !location || !type || !summary || !requirements) {
    throw new Error("All fields are required");
  }

  return { title, department, location, type, summary, requirements, published };
}

export async function createJobPost(formData: FormData) {
  await requireAdminAction("career.manage");
  const data = readJobPostFields(formData);

  try {
    await prisma.jobPost.create({
      data: { ...data, slug: slugify(data.title) },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A job post with this title already exists");
    }
    throw e;
  }

  revalidatePath("/admin/careers");
  revalidatePath("/careers");
  return { success: true };
}

export async function updateJobPost(id: string, formData: FormData) {
  await requireAdminAction("career.manage");
  const data = readJobPostFields(formData);

  await prisma.jobPost.update({ where: { id }, data });

  revalidatePath("/admin/careers");
  revalidatePath("/careers");
  return { success: true };
}

export async function deleteJobPost(id: string) {
  await requireAdminAction("career.manage");
  await prisma.jobPost.delete({ where: { id } });

  revalidatePath("/admin/careers");
  revalidatePath("/careers");
  return { success: true };
}

export async function toggleJobPostPublished(id: string, published: boolean) {
  await requireAdminAction("career.manage");
  await prisma.jobPost.update({ where: { id }, data: { published } });

  revalidatePath("/admin/careers");
  revalidatePath("/careers");
  return { success: true };
}
```

- [ ] **Step 2: Write the manager component**

Create `app/admin/careers/career-manager.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  createJobPost,
  updateJobPost,
  deleteJobPost,
  toggleJobPostPublished,
} from "./actions";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

type JobPost = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  summary: string;
  requirements: string;
  published: boolean;
};

export function CareerManager({ jobs }: { jobs: JobPost[] }) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditingJob(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(job: JobPost) {
    setEditingJob(job);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      if (editingJob) {
        await updateJobPost(editingJob.id, formData);
      } else {
        await createJobPost(formData);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save job post");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteJobPost(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete job post");
    }
  }

  async function handleTogglePublished(job: JobPost) {
    try {
      await toggleJobPostPublished(job.id, !job.published);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / careers</p>
          <h1 className="text-2xl font-bold text-foreground">Career posts</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add job post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{jobs.length} job posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.department}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{job.type}</TableCell>
                  <TableCell>
                    <Badge className={job.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                      {job.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(job)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleTogglePublished(job)}>
                        {job.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(job)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No career posts yet.
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
            <DialogTitle>{editingJob ? "Edit job post" : "Add job post"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-title">Title</Label>
              <Input id="job-title" name="title" required defaultValue={editingJob?.title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-department">Department</Label>
              <Input id="job-department" name="department" required defaultValue={editingJob?.department} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-location">Location</Label>
              <Input id="job-location" name="location" required defaultValue={editingJob?.location} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-type">Type</Label>
              <Select name="type" defaultValue={editingJob?.type ?? JOB_TYPES[0]}>
                <SelectTrigger id="job-type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-summary">Summary</Label>
              <Textarea id="job-summary" name="summary" required defaultValue={editingJob?.summary} rows={2} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-requirements">Requirements</Label>
              <Textarea id="job-requirements" name="requirements" required defaultValue={editingJob?.requirements} rows={4} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="published" defaultChecked={editingJob?.published ?? true} />
              Published
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>{editingJob ? "Save changes" : "Create job post"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete job post</DialogTitle>
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

- [ ] **Step 3: Rewrite the page**

Replace `app/admin/careers/page.tsx` entirely with:

```tsx
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { CareerManager } from "./career-manager";

export default async function AdminCareersPage() {
  await requireAdminPage("/admin/careers", "career.view");
  const jobs = await prisma.jobPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <CareerManager jobs={jobs} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/careers/
git commit -m "Add real CRUD for career posts, convert to shadcn"
```

---

### Task 3: Downloads CRUD

**Files:**
- Create: `app/admin/downloads/actions.ts`
- Create: `app/admin/downloads/download-manager.tsx`
- Modify: `app/admin/downloads/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `slugify` from `@/lib/slugify` (Task 1), permission key `"download.view"` (Task 1) for the page gate, `"download.manage"` (pre-existing) for actions.
- Produces: `createDriverDownload(formData)`, `updateDriverDownload(id, formData)`, `deleteDriverDownload(id)`, `toggleDriverDownloadPublished(id, published)` from `./actions` — not consumed by any other task.

- [ ] **Step 1: Write the Server Actions**

Create `app/admin/downloads/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { isPrismaUniqueError } from "@/lib/order-service";
import { slugify } from "@/lib/slugify";

function readDownloadFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const deviceType = ((formData.get("deviceType") as string) || "").trim();
  const version = ((formData.get("version") as string) || "").trim();
  const os = ((formData.get("os") as string) || "").trim();
  const fileUrl = ((formData.get("fileUrl") as string) || "").trim();
  const notes = ((formData.get("notes") as string) || "").trim();
  const published = formData.get("published") === "on";

  if (!title || !deviceType || !version || !os || !fileUrl) {
    throw new Error("Title, device type, version, OS, and file URL are required");
  }

  return { title, deviceType, version, os, fileUrl, notes, published };
}

export async function createDriverDownload(formData: FormData) {
  await requireAdminAction("download.manage");
  const data = readDownloadFields(formData);

  try {
    await prisma.driverDownload.create({
      data: { ...data, slug: slugify(data.title) },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A download with this title already exists");
    }
    throw e;
  }

  revalidatePath("/admin/downloads");
  revalidatePath("/downloads");
  return { success: true };
}

export async function updateDriverDownload(id: string, formData: FormData) {
  await requireAdminAction("download.manage");
  const data = readDownloadFields(formData);

  await prisma.driverDownload.update({ where: { id }, data });

  revalidatePath("/admin/downloads");
  revalidatePath("/downloads");
  return { success: true };
}

export async function deleteDriverDownload(id: string) {
  await requireAdminAction("download.manage");
  await prisma.driverDownload.delete({ where: { id } });

  revalidatePath("/admin/downloads");
  revalidatePath("/downloads");
  return { success: true };
}

export async function toggleDriverDownloadPublished(id: string, published: boolean) {
  await requireAdminAction("download.manage");
  await prisma.driverDownload.update({ where: { id }, data: { published } });

  revalidatePath("/admin/downloads");
  revalidatePath("/downloads");
  return { success: true };
}
```

- [ ] **Step 2: Write the manager component**

Create `app/admin/downloads/download-manager.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  createDriverDownload,
  updateDriverDownload,
  deleteDriverDownload,
  toggleDriverDownloadPublished,
} from "./actions";

type DriverDownload = {
  id: string;
  title: string;
  deviceType: string;
  version: string;
  os: string;
  fileUrl: string;
  notes: string;
  published: boolean;
};

export function DownloadManager({ downloads }: { downloads: DriverDownload[] }) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState<DriverDownload | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriverDownload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditingDownload(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(download: DriverDownload) {
    setEditingDownload(download);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      if (editingDownload) {
        await updateDriverDownload(editingDownload.id, formData);
      } else {
        await createDriverDownload(formData);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save download");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDriverDownload(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete download");
    }
  }

  async function handleTogglePublished(download: DriverDownload) {
    try {
      await toggleDriverDownloadPublished(download.id, !download.published);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / downloads</p>
          <h1 className="text-2xl font-bold text-foreground">Driver downloads</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add download
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{downloads.length} downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Device type</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {downloads.map((download) => (
                <TableRow key={download.id}>
                  <TableCell className="font-medium">{download.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{download.deviceType}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{download.os}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">v{download.version}</TableCell>
                  <TableCell>
                    <Badge className={download.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                      {download.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(download)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleTogglePublished(download)}>
                        {download.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(download)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {downloads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No downloads yet.
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
            <DialogTitle>{editingDownload ? "Edit download" : "Add download"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-title">Title</Label>
              <Input id="download-title" name="title" required defaultValue={editingDownload?.title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-device-type">Device type</Label>
              <Input id="download-device-type" name="deviceType" required defaultValue={editingDownload?.deviceType} placeholder="e.g. POS Printer" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-os">Operating system</Label>
              <Input id="download-os" name="os" required defaultValue={editingDownload?.os} placeholder="e.g. Windows 10/11" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-version">Version</Label>
              <Input id="download-version" name="version" required defaultValue={editingDownload?.version} placeholder="e.g. 3.0.0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-file-url">File URL</Label>
              <Input id="download-file-url" name="fileUrl" required defaultValue={editingDownload?.fileUrl} placeholder="https://... or /downloads/file.exe" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-notes">Notes</Label>
              <Textarea id="download-notes" name="notes" defaultValue={editingDownload?.notes} rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="published" defaultChecked={editingDownload?.published ?? true} />
              Published
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>{editingDownload ? "Save changes" : "Create download"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete download</DialogTitle>
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

- [ ] **Step 3: Rewrite the page**

Replace `app/admin/downloads/page.tsx` entirely with:

```tsx
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { DownloadManager } from "./download-manager";

export default async function AdminDownloadsPage() {
  await requireAdminPage("/admin/downloads", "download.view");
  const downloads = await prisma.driverDownload.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <DownloadManager downloads={downloads} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/downloads/
git commit -m "Add real CRUD for driver downloads, convert to shadcn"
```

---

### Task 4: Pages CRUD

**Files:**
- Create: `app/admin/pages/actions.ts`
- Create: `app/admin/pages/page-manager.tsx`
- Modify: `app/admin/pages/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `slugify` from `@/lib/slugify` (Task 1), permission key `"page.view"` (Task 1) for the page gate, `"page.manage"` (pre-existing) for actions.
- Produces: `createPageContent(formData)`, `updatePageContent(id, formData)`, `deletePageContent(id)`, `togglePageContentPublished(id, published)` from `./actions` — not consumed by any other task.

- [ ] **Step 1: Write the Server Actions**

Create `app/admin/pages/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { isPrismaUniqueError } from "@/lib/order-service";
import { slugify } from "@/lib/slugify";

function readPageContentFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const summary = ((formData.get("summary") as string) || "").trim();
  const body = ((formData.get("body") as string) || "").trim();
  const seoTitle = ((formData.get("seoTitle") as string) || "").trim();
  const seoDescription = ((formData.get("seoDescription") as string) || "").trim();
  const published = formData.get("published") === "on";

  if (!title || !summary || !body) {
    throw new Error("Title, summary, and body are required");
  }

  return {
    title,
    summary,
    body,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    published,
  };
}

export async function createPageContent(formData: FormData) {
  await requireAdminAction("page.manage");
  const data = readPageContentFields(formData);

  try {
    await prisma.pageContent.create({
      data: { ...data, slug: slugify(data.title) },
    });
  } catch (e: unknown) {
    if (isPrismaUniqueError(e)) {
      throw new Error("A page with this title already exists");
    }
    throw e;
  }

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function updatePageContent(id: string, formData: FormData) {
  await requireAdminAction("page.manage");
  const data = readPageContentFields(formData);

  await prisma.pageContent.update({ where: { id }, data });

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function deletePageContent(id: string) {
  await requireAdminAction("page.manage");
  await prisma.pageContent.delete({ where: { id } });

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function togglePageContentPublished(id: string, published: boolean) {
  await requireAdminAction("page.manage");
  await prisma.pageContent.update({ where: { id }, data: { published } });

  revalidatePath("/admin/pages");
  return { success: true };
}
```

- [ ] **Step 2: Write the manager component**

Create `app/admin/pages/page-manager.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  createPageContent,
  updatePageContent,
  deletePageContent,
  togglePageContentPublished,
} from "./actions";

type PageContent = {
  id: string;
  title: string;
  summary: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  updatedAt: Date;
};

export function PageManager({ pages }: { pages: PageContent[] }) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setEditingPage(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEdit(page: PageContent) {
    setEditingPage(page);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      if (editingPage) {
        await updatePageContent(editingPage.id, formData);
      } else {
        await createPageContent(formData);
      }
      setIsFormOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save page");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletePageContent(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete page");
    }
  }

  async function handleTogglePublished(page: PageContent) {
    try {
      await togglePageContentPublished(page.id, !page.published);
      router.refresh();
    } catch {
      // no-op; row simply won't update if this fails
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / pages</p>
          <h1 className="text-2xl font-bold text-foreground">Pages and SEO</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add page
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{pages.length} pages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{page.summary}</TableCell>
                  <TableCell>
                    <Badge className={page.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                      {page.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {page.updatedAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(page)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleTogglePublished(page)}>
                        {page.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(page)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No pages yet.
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
            <DialogTitle>{editingPage ? "Edit page" : "Add page"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-title">Title</Label>
              <Input id="page-title" name="title" required defaultValue={editingPage?.title} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-summary">Summary</Label>
              <Textarea id="page-summary" name="summary" required defaultValue={editingPage?.summary} rows={2} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-body">Body</Label>
              <Textarea id="page-body" name="body" required defaultValue={editingPage?.body} rows={6} />
            </div>
            <Separator />
            <p className="text-sm font-semibold text-muted-foreground">SEO (optional)</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-seo-title">SEO title</Label>
              <Input id="page-seo-title" name="seoTitle" defaultValue={editingPage?.seoTitle ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="page-seo-description">SEO description</Label>
              <Textarea id="page-seo-description" name="seoDescription" defaultValue={editingPage?.seoDescription ?? ""} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="published" defaultChecked={editingPage?.published ?? true} />
              Published
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>{editingPage ? "Save changes" : "Create page"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
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

- [ ] **Step 3: Rewrite the page**

Replace `app/admin/pages/page.tsx` entirely with:

```tsx
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { PageManager } from "./page-manager";

export default async function AdminPagesPage() {
  await requireAdminPage("/admin/pages", "page.view");
  const pages = await prisma.pageContent.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <PageManager pages={pages} />
      </section>
    </main>
  );
}
```

Note: this drops the old hardcoded placeholder-pages fallback (`const pages = ["Home", "POS Solution", ...]`) — with real CRUD now in place, an empty state should say "no pages yet, click Add" rather than show fake cards for pages that don't exist as real `PageContent` rows.

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/pages/
git commit -m "Add real CRUD for page content, convert to shadcn"
```

---

### Task 5: Settings page conversion

**Files:**
- Modify: `app/admin/settings/page.tsx` (full rewrite — visual only, `actions.ts` untouched)

**Interfaces:**
- Consumes: `saveSettings` from `./actions` (unchanged signature).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Rewrite the page**

Replace `app/admin/settings/page.tsx` entirely with:

```tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { saveSettings } from "./actions";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

async function getCurrentSettings() {
  const keys = [
    "siteTitle",
    "googleTagId",
    "gtmContainerId",
    "facebookPixelId",
    "metaCapiPixelId",
    "metaCapiAccessTokenEnc",
    "adminEmail",
    "offlinePaymentNotes",
  ];
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  const capiTokenSaved = Boolean(map.metaCapiAccessTokenEnc);
  delete map.metaCapiAccessTokenEnc;
  return { map, capiTokenSaved };
}

export default async function AdminSettingsPage() {
  await requireAdminPage("/admin/settings", "settings.view");
  const { map: settings, capiTokenSaved } = await getCurrentSettings();

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / settings</p>
            <h1 className="text-2xl font-bold text-foreground">Store settings</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">Dashboard</Link>
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Tracking, payments, and site content</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSettings} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="siteTitle">Site title</Label>
                <Input
                  id="siteTitle"
                  name="siteTitle"
                  defaultValue={settings.siteTitle || "Synnex IT Solution - POS Hardware Sri Lanka"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="googleTagId">Google Tag ID</Label>
                <Input id="googleTagId" name="googleTagId" placeholder="G-XXXXXXXXXX" defaultValue={settings.googleTagId || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gtmContainerId">Google Tag Manager container ID</Label>
                <Input id="gtmContainerId" name="gtmContainerId" placeholder="GTM-XXXXXXX" defaultValue={settings.gtmContainerId || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                <Input id="facebookPixelId" name="facebookPixelId" placeholder="1234567890" defaultValue={settings.facebookPixelId || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="metaCapiPixelId">Meta Conversions API pixel ID</Label>
                <Input id="metaCapiPixelId" name="metaCapiPixelId" placeholder="1234567890" defaultValue={settings.metaCapiPixelId || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="metaCapiAccessToken">Meta Conversions API access token</Label>
                <Input
                  id="metaCapiAccessToken"
                  name="metaCapiAccessToken"
                  type="password"
                  autoComplete="off"
                  placeholder={capiTokenSaved ? "Token saved — enter a new value to replace it" : "EAAB..."}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="adminEmail">Admin email</Label>
                <Input id="adminEmail" name="adminEmail" type="email" defaultValue={settings.adminEmail || "admin@synnex.lk"} />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="offlinePaymentNotes">Offline payment notes</Label>
                <Textarea id="offlinePaymentNotes" name="offlinePaymentNotes" defaultValue={settings.offlinePaymentNotes || ""} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Save settings</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/settings/page.tsx
git commit -m "Convert settings page to shadcn"
```

---

### Task 6: Login page conversion + hygiene fixes

**Files:**
- Modify: `app/admin/login/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getCurrentAdminSession` from `@/lib/auth` (pre-existing, no signature change).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Rewrite the page**

Replace `app/admin/login/page.tsx` entirely with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentAdminSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Login to manage Synnex admin functions.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/admin";

  const session = await getCurrentAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck size={24} />
            </span>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin login</p>
            <h1 className="text-2xl font-bold text-foreground">Manage Synnex</h1>
            <p className="text-sm text-muted-foreground">
              Admin access is required for products, orders, content, careers, downloads, and settings.
            </p>
          </div>
          {params.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">Invalid admin credentials.</p>
          ) : null}
          <form action="/api/auth/login" method="post" className="flex flex-col gap-4">
            <input type="hidden" name="role" value="admin" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Admin email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Admin password" required />
            </div>
            <Button className="w-full" type="submit">Login</Button>
          </form>
          <Link href="/" className="text-center text-sm text-primary hover:underline">
            Back to storefront
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
```

Note what changed beyond the shadcn conversion: the email field no longer has `defaultValue="admin@synnex.lk"` (was hardcoded into page source), and an already-authenticated admin visiting this page is redirected straight to `/admin` instead of seeing the form again.

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/login/page.tsx
git commit -m "Convert login page to shadcn, remove hardcoded email, redirect if already authenticated"
```

---

### Task 7: Products list conversion (search/filter + Modal→Dialog)

**Files:**
- Modify: `app/admin/products/page.tsx` (remove the 100-row cap)
- Modify: `app/admin/products/product-manager.tsx` (full rewrite)
- Delete: `components/admin/modal.tsx`

**Interfaces:**
- Consumes: `SortableList` from `@/components/admin/sortable-list` (unchanged, from the earlier product-ordering feature), `deleteProduct`/`reorderProducts` from `./actions` (unchanged).
- Produces: nothing consumed by later tasks. (Task 8 touches different files — `products/[id]/page.tsx` and `product-form.tsx` — with no overlap here.)

- [ ] **Step 1: Remove the row cap**

In `app/admin/products/page.tsx`, change:

```ts
  const products = await prisma.product.findMany({
    take: 100,
    orderBy: { sortOrder: "asc" },
  });
```

to:

```ts
  const products = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
  });
```

(This silently truncated the list to the first 100 of 171 products — the last 71 were completely invisible in admin. Removing `take: 100` fixes that; 171 rows fetched at once is not a performance concern for this dataset size.)

- [ ] **Step 2: Rewrite the product manager**

Replace `app/admin/products/product-manager.tsx` entirely with:

```tsx
"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/product-form";
import { SortableList } from "@/components/admin/sortable-list";
import { deleteProduct, reorderProducts } from "./actions";
import { formatCurrency } from "@/lib/api-client";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  sku: string | null;
}

interface ProductManagerProps {
  products: Product[];
}

const ALL_CATEGORIES = "all";

export function ProductManager({ products }: ProductManagerProps) {
  const [items, setItems] = useState(products);
  const [prevProducts, setPrevProducts] = useState(products);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);

  // Re-sync local (optimistic) order when the server sends a fresh products
  // list — adjusting state during render per React's recommended pattern.
  if (products !== prevProducts) {
    setPrevProducts(products);
    setItems(products);
  }

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((p) => p.category))).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((p) => {
      const matchesSearch = !query || p.name.toLowerCase().includes(query);
      const matchesCategory = category === ALL_CATEGORIES || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  const isFiltered = search.trim() !== "" || category !== ALL_CATEGORIES;

  const handleDelete = async () => {
    if (!isDeleteOpen) return;
    try {
      await deleteProduct(isDeleteOpen.id);
      setIsDeleteOpen(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete product");
    }
  };

  async function handleReorder(orderedIds: string[]) {
    const byId = new Map(items.map((item) => [item.id, item]));
    setItems(orderedIds.map((id) => byId.get(id)!));
    try {
      await reorderProducts(orderedIds);
    } catch {
      setItems(products);
    }
  }

  function renderRow(product: Product) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            {product.category} · {product.sku ?? "No SKU"}
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{formatCurrency(product.price)}</span>
        <span className="text-sm text-muted-foreground">{product.inventory} in stock</span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/products/${product.id}`}>Edit</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen({ id: product.id, name: product.name })}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / products</p>
          <h1 className="text-2xl font-bold text-foreground">Product management</h1>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus size={16} /> Add product
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{filtered.length} of {items.length} products</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isFiltered ? (
            <>
              <p className="text-xs text-muted-foreground">
                Drag-to-reorder is disabled while filtering — clear the search and category filters to reorder.
              </p>
              {filtered.map((product) => (
                <div key={product.id}>{renderRow(product)}</div>
              ))}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No products match this filter.</p>
              )}
            </>
          ) : (
            <SortableList
              dndContextId="admin-products-list"
              items={items}
              onReorder={handleReorder}
              renderItem={renderRow}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm onSuccess={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{isDeleteOpen?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

Note: if the "admin bug-fix pass" spec's Fix 2 (SKU generation) has not yet landed, most products' `sku` will be `null` and every row will show "No SKU" — this is expected and matches the fallback stated in that spec; it is not a regression introduced here.

- [ ] **Step 3: Delete the now-unused Modal component**

Run: `rm components/admin/modal.tsx`

Confirm nothing else imports it:

Run: `grep -rl "components/admin/modal" app components`
Expected: no output (empty) — `product-manager.tsx` was the only consumer and no longer imports it after Step 2's rewrite.

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/products/page.tsx app/admin/products/product-manager.tsx
git rm components/admin/modal.tsx
git commit -m "Convert products list to shadcn, add search/category filter, remove Modal component"
```

---

### Task 8: Product detail page + product form conversion

**Files:**
- Modify: `app/admin/products/[id]/page.tsx` (full rewrite)
- Modify: `components/admin/product-form.tsx` (full rewrite)

**Interfaces:**
- Consumes: `createProduct`/`updateProduct` from `@/app/admin/products/actions` (unchanged signatures — both already accept `FormData`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Rewrite the detail page**

Replace `app/admin/products/[id]/page.tsx` entirely with:

```tsx
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { AdminSidebar } from "@/components/sections/admin-sidebar";
import { requireAdminPage } from "@/lib/admin-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("/admin/products", "product.view");
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    notFound();
  }

  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / products / {id}</p>
            <h1 className="text-2xl font-bold text-foreground">Edit product</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/products">Back to list</Link>
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              initialData={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                category: product.category,
                price: product.price,
                compareAt: product.compareAt ?? undefined,
                inventory: product.inventory,
                sku: product.sku ?? undefined,
                image: product.image,
                accent: product.accent,
                description: product.description,
                shortDescription: product.shortDescription ?? undefined,
                specs: product.specs,
                published: product.published,
              }}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
```

Note: this also fixes the pre-existing inconsistency where this page rendered without `<AdminSidebar>`/`admin-shell` — every other admin page has it, this one didn't.

- [ ] **Step 2: Rewrite the product form**

Replace `components/admin/product-form.tsx` entirely with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface ProductFormProps {
  initialData?: {
    id?: string;
    name: string;
    slug?: string;
    category: string;
    price: number;
    compareAt?: number;
    inventory: number;
    sku?: string;
    image: string;
    accent: string;
    description: string;
    shortDescription?: string;
    specs: string;
    published: boolean;
  };
  onSuccess?: () => void;
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(initialData?.image || "");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (initialData?.id) {
        await updateProduct(initialData.id, formData);
      } else {
        await createProduct(formData);
      }
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (e: any) {
      setError(e.message || "An error occurred while saving the product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 md:col-span-2">{error}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-name">Name</Label>
        <Input id="product-name" name="name" required defaultValue={initialData?.name} placeholder="e.g. POS Thermal Printer" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-slug">Slug</Label>
        <Input id="product-slug" name="slug" defaultValue={initialData?.slug} placeholder="Optional — leave blank to keep current slug" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-category">Category</Label>
        <Input id="product-category" name="category" required defaultValue={initialData?.category} placeholder="e.g. POS Solution" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-price">Price (LKR)</Label>
        <Input id="product-price" name="price" type="number" required defaultValue={initialData?.price} placeholder="0" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-compare-at">Compare at price (LKR)</Label>
        <Input id="product-compare-at" name="compareAt" type="number" defaultValue={initialData?.compareAt} placeholder="Optional" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-inventory">Inventory</Label>
        <Input id="product-inventory" name="inventory" type="number" required defaultValue={initialData?.inventory} placeholder="0" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-sku">SKU</Label>
        <Input id="product-sku" name="sku" defaultValue={initialData?.sku} placeholder="Optional" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-accent">Accent color</Label>
        <input
          id="product-accent"
          name="accent"
          type="color"
          defaultValue={initialData?.accent || "#1f8a70"}
          className="h-9 w-full rounded-md border border-input"
        />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="product-image">Image</Label>
        <Input
          id="product-image"
          name="image"
          required
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="/uploads/products/photo.jpg"
        />
        <div className="flex items-center gap-3">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={handleImageUpload} disabled={isUploading} />
          {isUploading ? <span className="text-sm text-muted-foreground">Uploading…</span> : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="product-short-description">Short description</Label>
        <Textarea id="product-short-description" name="shortDescription" defaultValue={initialData?.shortDescription} placeholder="Brief product summary (shown on product cards)" rows={2} />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea id="product-description" name="description" required defaultValue={initialData?.description} placeholder="Product description..." />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="product-specs">Specifications (Markdown or plain text)</Label>
        <Textarea id="product-specs" name="specs" required defaultValue={initialData?.specs} placeholder={"Weight: 1.2kg\nDimensions: 10x10x10cm"} />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
        <Checkbox name="published" defaultChecked={initialData?.published ?? true} />
        Published to store
      </label>

      <div className="md:col-span-2">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : initialData?.id ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
```

The `accent` color field stays a native `<input type="color">` (Tailwind-styled) since no shadcn color-picker primitive exists — same as before, just restyled.

- [ ] **Step 3: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/products/[id]/page.tsx components/admin/product-form.tsx
git commit -m "Convert product detail page and form to shadcn, fix missing sidebar"
```

---

## After all tasks: manual verification

Once every task above is committed and reviewed clean, perform the full manual verification pass from the spec (`docs/superpowers/specs/2026-07-16-admin-shadcn-conversion-design.md`'s Verification section) before considering this plan done:

1. `npm run lint`, `npm run build`, `npm test` one final time on the accumulated branch state.
2. Log in as SuperAdmin and click through every converted page: Login, Settings, Careers (create/edit/publish-toggle/delete a job post), Downloads (same), Pages (same), Products (search, category filter, add/edit/delete via the new Dialog, confirm drag-reorder still works when unfiltered).
3. Create a second admin with only `career.view` (no `career.manage`) via Team, confirm they can see the Careers list but mutation actions fail/are inaccessible.
4. Confirm the storefront (`/`, `/products`, `/careers`, `/downloads`) still renders correctly from the same data after an admin-side edit (e.g. edit a job post's title in admin, confirm it shows updated on the public `/careers` page).
