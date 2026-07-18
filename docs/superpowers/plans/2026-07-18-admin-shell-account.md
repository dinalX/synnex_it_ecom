# Admin Shell & Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin panel a persistent sidebar (no remount on navigation), a profile dropdown (profile page, password change, dark mode, notifications, log out) replacing the bare "Log out" button, email-based forgot-password, and a real per-admin notification system fed by new orders and low stock.

**Architecture:** A new `app/admin/(panel)/` route group owns the sidebar in its `layout.tsx` so it renders once per navigation instead of once per page; every existing admin page moves into that group and drops its own sidebar wrapper. The sidebar's bottom "Log out" button becomes a `DropdownMenu` trigger. Two new Prisma models (`AdminPasswordResetToken`, `AdminNotification`) back the reset-password and notification features; both follow the existing `AdminPermission`-style relation pattern. Dark mode is a `data-admin-theme` attribute driving a second value set for the existing `--admin-*` CSS custom properties, safe to add now because the storefront no longer shares any layout chrome with `/admin` (confirmed: root `app/layout.tsx` is a bare shell, storefront has its own `app/(storefront)/layout.tsx`).

**Tech Stack:** Next.js App Router route groups, Prisma, shadcn/ui `DropdownMenu` (existing stub, needs re-theming), nodemailer for SMTP email, `node:crypto` for reset tokens.

## Global Constraints

- No changes to the storefront (`app/(storefront)/**`, `app/globals.css`) — every change here is scoped to `app/admin/**` and its supporting `lib`/`components/admin`/`components/sections` files.
- No new permission keys — the profile page and password change are self-service (gated by plain `requireAdminAction()`, no `Permission` argument), matching how e.g. settings view/update already work for the acting admin's own data.
- Schema changes applied via `npx prisma db push` (this project's existing convention — confirmed no `prisma/migrations/` directory exists).
- Forgot-password must be enumeration-safe: the response is identical whether or not the submitted email matches an admin.
- When SMTP env vars are not configured, `lib/email.ts::sendEmail` must log the email to the console and return `{ sent: false }` rather than throwing — the reset flow must stay fully testable without real credentials.
- Low-stock notifications fire once per threshold crossing (before ≥ 5, after < 5), not on every order — never spam.
- Run `npm run lint`, `npm run build`, and `npm test` after every task.

---

### Task 1: Route restructure — persistent sidebar

**Files:**
- Create: `app/admin/(panel)/layout.tsx`
- Move (via `git mv`) into `app/admin/(panel)/`: `page.tsx`, `error.tsx`, `loading.tsx`, `orders/`, `products/`, `hero-banners/`, `home-sections/`, `content/`, `careers/`, `downloads/`, `pages/`, `settings/`, `team/`
- Modify (after moving): every moved `page.tsx`, plus `error.tsx` and `loading.tsx` — strip their own sidebar wrapper

**Interfaces:**
- Consumes: `AdminSidebar` from `@/components/sections/admin-sidebar` (unchanged export, now rendered once in the layout instead of per-page).
- Produces: nothing new consumed by later tasks — later tasks edit `AdminSidebar`/`AdminSidebarNav` directly, independent of this move.

- [ ] **Step 1: Move every admin sub-route into the new group**

Run:
```bash
mkdir -p "app/admin/(panel)"
git mv app/admin/page.tsx "app/admin/(panel)/page.tsx"
git mv app/admin/error.tsx "app/admin/(panel)/error.tsx"
git mv app/admin/loading.tsx "app/admin/(panel)/loading.tsx"
git mv app/admin/orders "app/admin/(panel)/orders"
git mv app/admin/products "app/admin/(panel)/products"
git mv app/admin/hero-banners "app/admin/(panel)/hero-banners"
git mv app/admin/home-sections "app/admin/(panel)/home-sections"
git mv app/admin/content "app/admin/(panel)/content"
git mv app/admin/careers "app/admin/(panel)/careers"
git mv app/admin/downloads "app/admin/(panel)/downloads"
git mv app/admin/pages "app/admin/(panel)/pages"
git mv app/admin/settings "app/admin/(panel)/settings"
git mv app/admin/team "app/admin/(panel)/team"
```
Expected: `app/admin/` now contains only `login/`, `admin-tailwind.css`, `layout.tsx`, and the new `(panel)/` directory holding everything else. Route URLs are unchanged — Next.js route groups (`(name)`) are stripped from the URL.

- [ ] **Step 2: Create the panel layout**

Create `app/admin/(panel)/layout.tsx`:

```tsx
import { AdminSidebar } from "@/components/sections/admin-sidebar";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="admin-shell">
      <AdminSidebar />
      {children}
    </main>
  );
}
```

- [ ] **Step 3: Strip the wrapper from every moved page**

For each file below, remove the `import { AdminSidebar } from "@/components/sections/admin-sidebar";` line, then change the opening `<main className="admin-shell">` + `<AdminSidebar />` + wrapping element into just the inner section, and remove the matching closing `</main>`. The exact before/after for each file:

**`app/admin/(panel)/page.tsx`** (dashboard) — change:
```tsx
    <main className="admin-shell">
      <AdminSidebar />

      <section className="admin-main" id="dashboard">
```
to:
```tsx
    <section className="admin-main" id="dashboard">
```
and change the final two closing lines:
```tsx
      </section>
    </main>
  );
}
```
to:
```tsx
      </section>
  );
}
```

**`app/admin/(panel)/error.tsx`** — this file is `"use client"` and currently hand-rolls its own static sidebar stub instead of using `AdminSidebar` (a previously-audited inconsistency this move also fixes). Replace the whole file:

```tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <section className="admin-content-page">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Error</p>
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <p className="text-sm text-muted-foreground">An unexpected error occurred while loading this page.</p>
          {error.digest && <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>}
          <div className="flex gap-3">
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/admin">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
```

**`app/admin/(panel)/loading.tsx`** — also hand-rolls a static sidebar stub. Replace the whole file:

```tsx
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <section className="admin-content-page">
      <div className="mb-6 flex flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
```

**`app/admin/(panel)/orders/page.tsx`** — remove the `AdminSidebar` import, change:
```tsx
  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
```
to:
```tsx
  return (
    <section className="admin-content-page">
```
and remove the matching trailing `</main>` (the file currently ends `</section>\n    </main>\n  );\n}` — change to `</section>\n  );\n}`).

**`app/admin/(panel)/orders/[id]/page.tsx`** — same transform: remove the `AdminSidebar` import (line 5) and change:
```tsx
  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
```
to:
```tsx
  return (
    <section className="admin-content-page">
```
and remove the matching trailing `</main>`.

**`app/admin/(panel)/products/page.tsx`, `products/[id]/page.tsx`, `hero-banners/page.tsx`, `home-sections/page.tsx`, `content/page.tsx`, `careers/page.tsx`, `downloads/page.tsx`, `pages/page.tsx`, `settings/page.tsx`, `team/page.tsx`** — every one of these has the identical pattern (confirmed by direct inspection of each file): remove the `import { AdminSidebar } from "@/components/sections/admin-sidebar";` line, and change:
```tsx
  return (
    <main className="admin-shell">
      <AdminSidebar />
      <section className="admin-content-page">
```
to:
```tsx
  return (
    <section className="admin-content-page">
```
then remove the matching trailing `</main>` (each file currently closes `</section>\n    </main>\n  );\n}` or, for `content/page.tsx` specifically, a nested `</section>\n      </section>\n    </main>\n  );\n}` — in that one case only the `</main>` line is removed, both `</section>` closes stay).

- [ ] **Step 4: Run build to catch any missed wrapper**

Run: `npm run build`
Expected: succeeds. If any moved file still imports `AdminSidebar` without using it, or still has an unbalanced `<main>`/`</main>`, the build's JSX parser will fail with a clear syntax error naming the file — fix any such file the same way as its siblings above.

- [ ] **Step 5: Run lint and test**

Run: `npm run lint && npm test`
Expected: both succeed, no changes to existing test count/results (this task touches no logic, only markup structure).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Move admin pages into a route group so the sidebar persists across navigation"
```

---

### Task 2: Profile dropdown replacing the bare Log out button

**Files:**
- Modify: `components/ui/dropdown-menu.tsx` (re-theme off the `--admin-*` token system instead of hardcoded slate colors)
- Modify: `components/sections/admin-sidebar.tsx` (fetch + pass `name`/`email`)
- Modify: `components/sections/admin-sidebar-nav.tsx` (accept `name`/`email`, replace the bottom Log out button with the dropdown)

**Interfaces:**
- Consumes: `AdminSidebarNav`'s existing `role`/`permissions` props (unchanged).
- Produces: `AdminSidebarNav` now also accepts `name: string` and `email: string` props — Task 3 does not need these (profile page fetches its own session), but this is the shape later tasks must not break if they touch this file.

- [ ] **Step 1: Re-theme the dropdown-menu component**

The existing `components/ui/dropdown-menu.tsx` was built before the `--admin-*` token system and hardcodes `slate` colors instead of `bg-popover`/`text-popover-foreground`/`border-border`/`focus:bg-accent` like every other shadcn primitive in this admin (`card.tsx`, `dialog.tsx`, `select.tsx`). Replace the whole file:

```tsx
"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[14rem] overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
};
```

- [ ] **Step 2: Pass name/email through the sidebar wrapper**

Replace `components/sections/admin-sidebar.tsx` in full:

```tsx
import { prisma } from "@/lib/db";
import { getCurrentAdminSession } from "@/lib/auth";
import { AdminSidebarNav } from "@/components/sections/admin-sidebar-nav";

export async function AdminSidebar() {
  const session = await getCurrentAdminSession();

  let role = "Admin";
  let permissions: string[] = [];
  let name = "";
  let email = "";

  if (session?.id) {
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
      select: { role: true, name: true, email: true, permissions: { select: { key: true } } },
    });
    role = admin?.role ?? "Admin";
    permissions = admin?.permissions.map((p) => p.key) ?? [];
    name = admin?.name ?? "";
    email = admin?.email ?? "";
  }

  return <AdminSidebarNav role={role} permissions={permissions} name={name} email={email} />;
}
```

- [ ] **Step 3: Replace the Log out button with the profile dropdown**

In `components/sections/admin-sidebar-nav.tsx`, add these imports alongside the existing ones:

```ts
import { ChevronsUpDown, LogOut, User, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

(Keep the existing `LogOut` import if already present via the combined lucide-react import — merge rather than duplicate; the file currently imports `LogOut` already, so only add `ChevronsUpDown`, `User`, `Bell` to that same import statement.)

Change the function signature:

```tsx
export function AdminSidebarNav({
  role,
  permissions,
  name,
  email,
}: {
  role: string;
  permissions: string[];
  name: string;
  email: string;
}) {
```

Replace the closing `<form action="/api/auth/logout" ...>...</form>` block (the bottom of the `<aside>`) with:

```tsx
        <div className="mt-auto pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 font-semibold text-muted-foreground"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {name ? name.charAt(0).toUpperCase() : "?"}
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{name || "Admin"}</span>
                <ChevronsUpDown size={14} className="shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-[calc(250px-3rem)]">
              <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case tracking-normal">
                <span className="text-sm font-semibold text-foreground">{name || "Admin"}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                  <User size={16} />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/notifications">
                  <Bell size={16} />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/api/auth/logout" method="post" className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2">
                    <LogOut size={16} />
                    Log out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
```

Note: the dark-mode toggle item and the notification unread-count badge are added in Tasks 5 and 6 respectively, once those features exist — this task only wires the dropdown shell, Profile link, Notifications link (page doesn't exist until Task 6, so it 404s harmlessly until then — acceptable since these tasks land in the same plan run before this is shipped), and Log out.

- [ ] **Step 4: Run lint, build, test**

Run: `npm run lint && npm run build && npm test`
Expected: all succeed. (`/admin/notifications` and `/admin/profile` don't exist yet — Next.js doesn't fail the build over a `<Link>` to a not-yet-created route, it only 404s at request time, so this is fine mid-plan.)

- [ ] **Step 5: Commit**

```bash
git add components/ui/dropdown-menu.tsx components/sections/admin-sidebar.tsx components/sections/admin-sidebar-nav.tsx
git commit -m "Replace bare Log out button with a profile dropdown"
```

---

### Task 3: Profile page + change password

**Files:**
- Create: `lib/password-policy.ts`
- Test: `tests/password-policy.test.ts`
- Create: `app/admin/(panel)/profile/page.tsx`
- Create: `app/admin/(panel)/profile/profile-form.tsx`
- Create: `app/admin/(panel)/profile/actions.ts`

**Interfaces:**
- Consumes: `requireAdminAction()` from `@/lib/admin-access` (no permission arg — self-service), `verifyPassword`/`hashPassword` from `@/lib/password`.
- Produces: `validateNewPassword(next: string, confirm: string): string | null` from `@/lib/password-policy` — reused by Task 4's reset-password route.

- [ ] **Step 1: Write the failing test**

Create `tests/password-policy.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { validateNewPassword } from "@/lib/password-policy";

test("validateNewPassword rejects passwords shorter than 8 characters", () => {
  assert.equal(validateNewPassword("short1", "short1"), "Password must be at least 8 characters");
});

test("validateNewPassword rejects mismatched confirmation", () => {
  assert.equal(validateNewPassword("longenough1", "longenough2"), "Passwords do not match");
});

test("validateNewPassword accepts a valid matching password", () => {
  assert.equal(validateNewPassword("longenough1", "longenough1"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/password-policy.test.ts`
Expected: FAIL — `Cannot find module '@/lib/password-policy'`.

- [ ] **Step 3: Implement the policy module**

Create `lib/password-policy.ts`:

```ts
export function validateNewPassword(next: string, confirm: string): string | null {
  if (next.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (next !== confirm) {
    return "Passwords do not match";
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/password-policy.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Write the Server Actions**

Create `app/admin/(panel)/profile/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireAdminAction } from "@/lib/admin-access";
import { verifyPassword, hashPassword } from "@/lib/password";
import { validateNewPassword } from "@/lib/password-policy";

export async function updateProfile(formData: FormData) {
  const admin = await requireAdminAction();
  const name = ((formData.get("name") as string) || "").trim();

  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { name } });

  revalidatePath("/admin/profile");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const admin = await requireAdminAction();
  const currentPassword = (formData.get("currentPassword") as string) || "";
  const newPassword = (formData.get("newPassword") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";

  const record = await prisma.adminUser.findUnique({ where: { id: admin.id! } });
  if (!record) {
    throw new Error("Admin not found");
  }

  const verified = await verifyPassword(currentPassword, record.passwordHash);
  if (!verified.valid) {
    throw new Error("Current password is incorrect");
  }

  const policyError = validateNewPassword(newPassword, confirmPassword);
  if (policyError) {
    throw new Error(policyError);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({ where: { id: admin.id! }, data: { passwordHash } });

  return { success: true };
}
```

- [ ] **Step 6: Write the profile form**

Create `app/admin/(panel)/profile/profile-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfile, changePassword } from "./actions";

export function ProfileForm({
  initialName,
  email,
  role,
  lastLoginAt,
}: {
  initialName: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
}) {
  const router = useRouter();
  const [profilePending, setProfilePending] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function handleProfileSubmit(formData: FormData) {
    setProfilePending(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      await updateProfile(formData);
      setProfileSaved(true);
      router.refresh();
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setProfilePending(false);
    }
  }

  async function handlePasswordSubmit(formData: FormData) {
    setPasswordPending(true);
    setPasswordError(null);
    setPasswordSaved(false);
    try {
      await changePassword(formData);
      setPasswordSaved(true);
      (document.getElementById("change-password-form") as HTMLFormElement)?.reset();
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleProfileSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" name="name" required defaultValue={initialName} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={email} disabled />
              <p className="text-xs text-muted-foreground">Email is your login and can&apos;t be changed here.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <p>Role: <span className="font-medium text-foreground">{role}</span></p>
              <p>Last login: <span className="font-medium text-foreground">{lastLoginAt ?? "—"}</span></p>
            </div>
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}
            {profileSaved && !profileError && <p className="text-sm text-emerald-600">Profile updated.</p>}
            <Button type="submit" disabled={profilePending} className="w-fit">
              {profilePending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="change-password-form" action={handlePasswordSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" name="currentPassword" type="password" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" name="newPassword" type="password" required minLength={8} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" name="confirmPassword" type="password" required minLength={8} />
            </div>
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            {passwordSaved && !passwordError && <p className="text-sm text-emerald-600">Password changed.</p>}
            <Button type="submit" disabled={passwordPending} className="w-fit">
              {passwordPending ? "Saving…" : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Write the page**

Create `app/admin/(panel)/profile/page.tsx`:

```tsx
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-access";
import { ProfileForm } from "./profile-form";

export default async function AdminProfilePage() {
  const session = await requireAdminPage("/admin/profile");
  const admin = await prisma.adminUser.findUnique({ where: { id: session.id! } });

  if (!admin) {
    return null;
  }

  return (
    <section className="admin-content-page">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / profile</p>
        <h1 className="text-2xl font-bold text-foreground">Your profile</h1>
      </div>
      <ProfileForm
        initialName={admin.name}
        email={admin.email}
        role={admin.role}
        lastLoginAt={admin.lastLoginAt ? admin.lastLoginAt.toLocaleString() : null}
      />
    </section>
  );
}
```

- [ ] **Step 8: Run lint, build, test**

Run: `npm run lint && npm run build && npm test`
Expected: all succeed, including the 3 new `password-policy` tests.

- [ ] **Step 9: Commit**

```bash
git add lib/password-policy.ts tests/password-policy.test.ts "app/admin/(panel)/profile"
git commit -m "Add profile page with self-service name edit and password change"
```

---

### Task 4: Email infrastructure + forgot/reset password

**Files:**
- Modify: `package.json` (add `nodemailer`, `@types/nodemailer`)
- Modify: `.env.example`
- Create: `lib/email.ts`
- Create: `lib/reset-token.ts`
- Test: `tests/reset-token.test.ts`
- Modify: `prisma/schema.prisma` (add `AdminPasswordResetToken` + relation on `AdminUser`)
- Create: `app/api/auth/admin-forgot-password/route.ts`
- Create: `app/api/auth/admin-reset-password/route.ts`
- Create: `app/admin/forgot-password/page.tsx`
- Create: `app/admin/reset-password/page.tsx`
- Modify: `app/admin/login/page.tsx` (add "Forgot password?" link + reset-success notice)

**Interfaces:**
- Consumes: `validateNewPassword` from `@/lib/password-policy` (Task 3), `validateCSRF`/`validateBodySize`/`jsonResponse`/`errorResponse` from `@/lib/api`, `hashPassword` from `@/lib/password`, `siteConfig` from `@/lib/site`.
- Produces: `sendEmail({ to, subject, html, text }): Promise<{ sent: boolean }>` from `@/lib/email`; `generateResetToken(): { token: string; tokenHash: string }` and `hashResetToken(token: string): string` from `@/lib/reset-token` — not consumed elsewhere in this plan, but exported for symmetry with the storefront password-reset work referenced in project context.

- [ ] **Step 1: Add nodemailer**

Run: `npm install nodemailer && npm install -D @types/nodemailer`

- [ ] **Step 2: Document the new env vars**

Append to `.env.example`:

```
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="Synnex Admin <no-reply@synnex.lk>"
```

- [ ] **Step 3: Write the failing reset-token test**

Create `tests/reset-token.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { generateResetToken, hashResetToken } from "@/lib/reset-token";

test("generateResetToken returns a token whose hash matches hashResetToken", () => {
  const { token, tokenHash } = generateResetToken();
  assert.equal(hashResetToken(token), tokenHash);
});

test("generateResetToken produces a different token on each call", () => {
  const a = generateResetToken();
  const b = generateResetToken();
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.tokenHash, b.tokenHash);
});

test("hashResetToken is deterministic for the same input", () => {
  const { token } = generateResetToken();
  assert.equal(hashResetToken(token), hashResetToken(token));
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `node --import tsx --test tests/reset-token.test.ts`
Expected: FAIL — `Cannot find module '@/lib/reset-token'`.

- [ ] **Step 5: Implement the reset-token module**

Create `lib/reset-token.ts`:

```ts
import { randomBytes, createHash } from "node:crypto";

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --import tsx --test tests/reset-token.test.ts`
Expected: PASS (3/3).

- [ ] **Step 7: Add the schema model**

In `prisma/schema.prisma`, add this model after `model AdminPermission { ... }`:

```prisma
model AdminPasswordResetToken {
  id        String    @id @default(cuid())
  adminId   String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  admin AdminUser @relation("AdminPasswordResetTokens", fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([expiresAt])
}
```

Add the relation field to `model AdminUser`, alongside the existing `permissions`/`permissionsGranted` lines:

```prisma
  passwordResetTokens   AdminPasswordResetToken[] @relation("AdminPasswordResetTokens")
```

Run: `npx prisma db push`
Expected: succeeds, prints that `AdminPasswordResetToken` was created.

- [ ] **Step 8: Write the email module**

Create `lib/email.ts`:

```ts
import nodemailer from "nodemailer";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean }> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    console.log(`[email:not-configured] to=${input.to} subject="${input.subject}"\n${input.text}`);
    return { sent: false };
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transport.sendMail({
    from: EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return { sent: true };
}
```

- [ ] **Step 9: Write the forgot-password API route**

Create `app/api/auth/admin-forgot-password/route.ts`:

```ts
import { prisma } from "@/lib/db";
import { errorResponse, jsonResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { generateResetToken } from "@/lib/reset-token";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site";

const GENERIC_MESSAGE = "If that email matches an admin account, a reset link has been sent.";

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);

  const sizeCheck = validateBodySize(request);
  if (!sizeCheck.valid) return errorResponse(sizeCheck.error, 413);

  const form = await request.formData();
  const email = ((form.get("email") as string) || "").trim().toLowerCase();

  if (!email) {
    return errorResponse("Email is required", 400);
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (admin && admin.active) {
    await prisma.adminPasswordResetToken.deleteMany({ where: { adminId: admin.id, usedAt: null } });

    const { token, tokenHash } = generateResetToken();
    await prisma.adminPasswordResetToken.create({
      data: {
        adminId: admin.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${siteConfig.url}/admin/reset-password?token=${token}`;
    await sendEmail({
      to: admin.email,
      subject: "Reset your Synnex admin password",
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
      html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
    });
  }

  return jsonResponse({ message: GENERIC_MESSAGE });
}
```

- [ ] **Step 10: Write the reset-password API route**

Create `app/api/auth/admin-reset-password/route.ts`:

```ts
import { prisma } from "@/lib/db";
import { errorResponse, jsonResponse, validateBodySize, validateCSRF } from "@/lib/api";
import { hashResetToken } from "@/lib/reset-token";
import { hashPassword } from "@/lib/password";
import { validateNewPassword } from "@/lib/password-policy";

export async function POST(request: Request) {
  const csrfCheck = validateCSRF(request);
  if (!csrfCheck.valid) return errorResponse(csrfCheck.error, 403);

  const sizeCheck = validateBodySize(request);
  if (!sizeCheck.valid) return errorResponse(sizeCheck.error, 413);

  const form = await request.formData();
  const token = (form.get("token") as string) || "";
  const newPassword = (form.get("newPassword") as string) || "";
  const confirmPassword = (form.get("confirmPassword") as string) || "";

  if (!token) {
    return errorResponse("Missing reset token", 400);
  }

  const policyError = validateNewPassword(newPassword, confirmPassword);
  if (policyError) {
    return errorResponse(policyError, 400);
  }

  const tokenHash = hashResetToken(token);
  const record = await prisma.adminPasswordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return errorResponse("This reset link is invalid or has expired", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: record.adminId }, data: { passwordHash } }),
    prisma.adminPasswordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return jsonResponse({ success: true });
}
```

- [ ] **Step 11: Write the forgot-password page**

Create `app/admin/forgot-password/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/admin-forgot-password", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      setMessage(data.message || data.error || "Something went wrong");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound size={24} />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Forgot password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your admin email and we&apos;ll send you a reset link.
            </p>
          </div>
          {message ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">{message}</p>
          ) : (
            <form action={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Admin email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <Button className="w-full" type="submit" disabled={pending}>
                {pending ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          <Link href="/admin/login" className="text-center text-sm text-primary hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 12: Write the reset-password page**

Create `app/admin/reset-password/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("token", token);
    try {
      const res = await fetch("/api/auth/admin-reset-password", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      router.push("/admin/login?reset=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col gap-4 p-8 text-center">
            <p className="text-sm text-red-600">This reset link is missing its token.</p>
            <Link href="/admin/forgot-password" className="text-sm text-primary hover:underline">
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound size={24} />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
          </div>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
            </div>
            {error && (
              <p className="text-sm text-red-600">
                {error}{" "}
                <Link href="/admin/forgot-password" className="underline">
                  Request a new link
                </Link>
              </p>
            )}
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? "Saving…" : "Set new password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 13: Add the login page link and reset-success notice**

In `app/admin/login/page.tsx`, change the function signature to also read `reset`:

```tsx
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; reset?: string }>;
}) {
```

Add, right after the existing `{params.error ? (...) : null}` block:

```tsx
          {params.reset ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password updated — log in with your new password.</p>
          ) : null}
```

Add a "Forgot password?" link right after the closing `</form>` tag, before the existing "Back to storefront" link:

```tsx
          <Link href="/admin/forgot-password" className="text-center text-sm text-muted-foreground hover:underline">
            Forgot password?
          </Link>
```

- [ ] **Step 14: Run lint, build, test**

Run: `npm run lint && npm run build && npm test`
Expected: all succeed, including the 3 new `reset-token` tests.

- [ ] **Step 15: Commit**

```bash
git add package.json package-lock.json .env.example lib/email.ts lib/reset-token.ts tests/reset-token.test.ts prisma/schema.prisma app/api/auth/admin-forgot-password app/api/auth/admin-reset-password app/admin/forgot-password app/admin/reset-password app/admin/login/page.tsx
git commit -m "Add email-based forgot/reset password flow for admins"
```

---

### Task 5: Dark mode (admin only)

**Files:**
- Modify: `app/admin/admin-tailwind.css` (dark token set + custom variant)
- Modify: `app/admin/layout.tsx` (pre-hydration theme script)
- Create: `components/admin/theme-toggle.tsx`
- Modify: `components/sections/admin-sidebar-nav.tsx` (add the toggle to the dropdown)
- Modify: manager files with hardcoded light-only status colors — `app/admin/(panel)/careers/career-manager.tsx`, `downloads/download-manager.tsx`, `hero-banners/banner-manager.tsx`, `pages/page-manager.tsx`, `login/page.tsx` badge/error colors, `forgot-password/page.tsx`, `reset-password/page.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ThemeToggle` component from `@/components/admin/theme-toggle`, a `<DropdownMenuItem>`-compatible client component Task 2's dropdown already has a slot for (it renders inside the same `DropdownMenuContent` — this task inserts it between the Notifications item and the separator before Log out).

- [ ] **Step 1: Add dark tokens and the custom variant**

In `app/admin/admin-tailwind.css`, add after the `:root { ... }` block (which holds the light values):

```css
:root[data-admin-theme="dark"] {
  --admin-background: oklch(0.145 0 0);
  --admin-foreground: oklch(0.985 0 0);
  --admin-card: oklch(0.205 0 0);
  --admin-card-foreground: oklch(0.985 0 0);
  --admin-popover: oklch(0.205 0 0);
  --admin-popover-foreground: oklch(0.985 0 0);
  --admin-primary: oklch(0.922 0 0);
  --admin-primary-foreground: oklch(0.205 0 0);
  --admin-secondary: oklch(0.269 0 0);
  --admin-secondary-foreground: oklch(0.985 0 0);
  --admin-muted: oklch(0.269 0 0);
  --admin-muted-foreground: oklch(0.708 0 0);
  --admin-accent: oklch(0.269 0 0);
  --admin-accent-foreground: oklch(0.985 0 0);
  --admin-destructive: oklch(0.704 0.191 22.216);
  --admin-destructive-foreground: oklch(0.985 0 0);
  --admin-border: oklch(1 0 0 / 10%);
  --admin-input: oklch(1 0 0 / 15%);
  --admin-ring: oklch(0.556 0 0);
}

@custom-variant dark (&:where([data-admin-theme="dark"], [data-admin-theme="dark"] *));
```

- [ ] **Step 2: Inject the pre-hydration theme script**

Replace `app/admin/layout.tsx` in full:

```tsx
import "../admin-orders.css";
import "./admin-tailwind.css";

const THEME_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("adminTheme");
    if (theme === "dark") {
      document.documentElement.setAttribute("data-admin-theme", "dark");
    }
  } catch (e) {}
})();
`;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {children}
    </>
  );
}
```

- [ ] **Step 3: Write the theme toggle**

Create `components/admin/theme-toggle.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-admin-theme") === "dark");
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-admin-theme", "dark");
      localStorage.setItem("adminTheme", "dark");
    } else {
      document.documentElement.removeAttribute("data-admin-theme");
      localStorage.setItem("adminTheme", "light");
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        toggle();
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Light mode" : "Dark mode"}
    </DropdownMenuItem>
  );
}
```

`onSelect={(event) => event.preventDefault()}` is Radix's documented way to keep a `DropdownMenuItem` from closing the menu on click — needed here since toggling dark mode is a "keep looking at the menu" action, not a navigation.

- [ ] **Step 4: Wire the toggle into the dropdown**

In `components/sections/admin-sidebar-nav.tsx`, add the import:

```ts
import { ThemeToggle } from "@/components/admin/theme-toggle";
```

Insert `<ThemeToggle />` into the `DropdownMenuContent` between the Notifications item and the separator before Log out:

```tsx
              <DropdownMenuItem asChild>
                <Link href="/admin/notifications">
                  <Bell size={16} />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <ThemeToggle />
              <DropdownMenuSeparator />
```

- [ ] **Step 5: Make the panel shell follow the tokens**

In `app/admin/(panel)/layout.tsx` (created in Task 1), add token classes to the `<main>`:

```tsx
    <main className="admin-shell bg-background text-foreground">
```

- [ ] **Step 6: Add dark variants to hardcoded status colors**

Across the manager files listed below, extend every hardcoded badge/error color className with a `dark:` variant. Apply this exact mapping everywhere the left-hand class appears:

- `bg-emerald-100 text-emerald-800` → append ` dark:bg-emerald-950 dark:text-emerald-300`
- `bg-slate-100 text-slate-700` → append ` dark:bg-slate-800 dark:text-slate-300`
- `bg-red-50 text-red-600` → append ` dark:bg-red-950 dark:text-red-400`
- `bg-red-100 text-red-700` → append ` dark:bg-red-950 dark:text-red-400`

Apply this in: `app/admin/(panel)/careers/career-manager.tsx`, `app/admin/(panel)/downloads/download-manager.tsx`, `app/admin/(panel)/hero-banners/banner-manager.tsx`, `app/admin/(panel)/pages/page-manager.tsx`, `app/admin/(panel)/products/product-manager.tsx`, `components/admin/product-form.tsx`, `app/admin/login/page.tsx`, `app/admin/forgot-password/page.tsx`, `app/admin/reset-password/page.tsx`. Search each file for the four left-hand strings above (`grep -n "bg-emerald-100 text-emerald-800\|bg-slate-100 text-slate-700\|bg-red-50 text-red-600\|bg-red-100 text-red-700"`) and extend every match found — not every file necessarily contains every pattern.

- [ ] **Step 7: Run lint, build, test**

Run: `npm run lint && npm run build && npm test`
Expected: all succeed.

- [ ] **Step 8: Commit**

```bash
git add app/admin/admin-tailwind.css app/admin/layout.tsx "app/admin/(panel)/layout.tsx" components/admin/theme-toggle.tsx components/sections/admin-sidebar-nav.tsx "app/admin/(panel)/careers/career-manager.tsx" "app/admin/(panel)/downloads/download-manager.tsx" "app/admin/(panel)/hero-banners/banner-manager.tsx" "app/admin/(panel)/pages/page-manager.tsx" "app/admin/(panel)/products/product-manager.tsx" components/admin/product-form.tsx app/admin/login/page.tsx app/admin/forgot-password/page.tsx app/admin/reset-password/page.tsx
git commit -m "Add admin-only dark mode"
```

---

### Task 6: Notifications

**Files:**
- Modify: `prisma/schema.prisma` (add `AdminNotification` + relation on `AdminUser`)
- Create: `lib/notification-service.ts`
- Modify: `lib/order-service.ts` (hook `notifyAdmins` calls after the order transaction commits)
- Modify: `components/sections/admin-sidebar.tsx` (fetch unread count)
- Modify: `components/sections/admin-sidebar-nav.tsx` (unread badge on the Notifications item)
- Create: `app/admin/(panel)/notifications/page.tsx`
- Create: `app/admin/(panel)/notifications/notification-list.tsx`
- Create: `app/admin/(panel)/notifications/actions.ts`

**Interfaces:**
- Consumes: `Order`/`OrderItem`/`Product` shapes from `lib/order-service.ts`'s existing `createOrderFromCurrentCart` (unchanged signature/return type — this task only adds side-effect calls inside the function body, after the `$transaction` resolves).
- Produces: `notifyAdmins(input: { type: string; title: string; body?: string; href?: string }): Promise<void>`, `LOW_STOCK_THRESHOLD = 5`, `getUnreadCount(adminId: string): Promise<number>`, `getNotifications(adminId: string, opts?: { take?: number }): Promise<AdminNotification[]>`, `markRead(adminId: string, notificationId: string): Promise<void>`, `markAllRead(adminId: string): Promise<void>` — all from `@/lib/notification-service`.

- [ ] **Step 1: Add the schema model**

In `prisma/schema.prisma`, add after the `AdminPasswordResetToken` model:

```prisma
model AdminNotification {
  id        String    @id @default(cuid())
  adminId   String
  type      String
  title     String
  body      String?
  href      String?
  readAt    DateTime?
  createdAt DateTime  @default(now())

  admin AdminUser @relation("AdminNotifications", fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId, readAt])
  @@index([createdAt])
}
```

Add the relation field to `model AdminUser`:

```prisma
  notifications         AdminNotification[]       @relation("AdminNotifications")
```

Run: `npx prisma db push`
Expected: succeeds, prints that `AdminNotification` was created.

- [ ] **Step 2: Write the notification service**

Create `lib/notification-service.ts`:

```ts
import { prisma } from "@/lib/db";

export const LOW_STOCK_THRESHOLD = 5;

export async function notifyAdmins(input: {
  type: string;
  title: string;
  body?: string;
  href?: string;
}): Promise<void> {
  const admins = await prisma.adminUser.findMany({
    where: { active: true },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.adminNotification.createMany({
    data: admins.map((admin) => ({
      adminId: admin.id,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    })),
  });
}

export async function getUnreadCount(adminId: string): Promise<number> {
  return prisma.adminNotification.count({ where: { adminId, readAt: null } });
}

export async function getNotifications(adminId: string, opts?: { take?: number }) {
  return prisma.adminNotification.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 50,
  });
}

export async function markRead(adminId: string, notificationId: string): Promise<void> {
  await prisma.adminNotification.updateMany({
    where: { id: notificationId, adminId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(adminId: string): Promise<void> {
  await prisma.adminNotification.updateMany({
    where: { adminId, readAt: null },
    data: { readAt: new Date() },
  });
}
```

`markRead`/`markAllRead` use `updateMany` with `adminId` in the `where` clause (not `update` by bare id) specifically so one admin can never mark — or even affect the row count of — another admin's notification, even by guessing an id.

- [ ] **Step 3: Hook notification generation into order creation**

In `lib/order-service.ts`, add the import:

```ts
import { notifyAdmins, LOW_STOCK_THRESHOLD } from "@/lib/notification-service";
```

Inside `createOrderFromCurrentCart`, the `for (const [index, item] of cart.items.entries())` loop currently updates inventory and writes an `InventoryTransaction` per item. Declare a collector immediately before that loop (still inside the function, outside the `$transaction` callback is fine since it's just an array reference the callback closes over):

```ts
  const lowStockCrossings: { productId: string; productName: string; afterQty: number }[] = [];

  const order = await prisma.$transaction(async (tx) => {
```

(This declaration replaces the existing `const order = await prisma.$transaction(async (tx) => {` line — the array is declared just above it, the transaction line itself is unchanged.)

Inside the loop, in the `if (item.variantId && item.variant)` branch, after the existing `await tx.inventoryTransaction.create({...})` call for that branch, add:

```ts
        if (beforeQty >= LOW_STOCK_THRESHOLD && afterQty < LOW_STOCK_THRESHOLD) {
          lowStockCrossings.push({ productId: item.productId, productName: item.product.name, afterQty });
        }
```

In the `else` branch (plain product, no variant), after its own `await tx.inventoryTransaction.create({...})` call, add the same check:

```ts
        if (beforeQty >= LOW_STOCK_THRESHOLD && afterQty < LOW_STOCK_THRESHOLD) {
          lowStockCrossings.push({ productId: item.productId, productName: item.product.name, afterQty });
        }
```

After the `$transaction` call resolves (right after `});` that closes it, before the existing `const cookieStore = await cookies();` line), add:

```ts
  try {
    await notifyAdmins({
      type: "order.new",
      title: `New order ${order.orderNumber}`,
      body: `${order.customer} — LKR ${order.total.toLocaleString()}`,
      href: `/admin/orders/${order.id}`,
    });
    for (const crossing of lowStockCrossings) {
      await notifyAdmins({
        type: "stock.low",
        title: `Low stock: ${crossing.productName}`,
        body: `${crossing.afterQty} left`,
        href: `/admin/products/${crossing.productId}`,
      });
    }
  } catch (e) {
    console.error("Failed to send admin notifications for order", order.id, e);
  }
```

This runs after the transaction has already committed and never throws out of the function — a notification failure cannot break order creation, matching the spec's fire-and-forget requirement.

- [ ] **Step 4: Surface the unread count in the sidebar**

In `components/sections/admin-sidebar.tsx`, add the import and fetch:

```ts
import { getUnreadCount } from "@/lib/notification-service";
```

Add `unreadCount` alongside the existing `role`/`permissions`/`name`/`email` locals:

```tsx
  let unreadCount = 0;
```

Inside the `if (session?.id) { ... }` block, after the existing assignments, add:

```tsx
    unreadCount = await getUnreadCount(session.id);
```

Pass it through:

```tsx
  return <AdminSidebarNav role={role} permissions={permissions} name={name} email={email} unreadCount={unreadCount} />;
```

- [ ] **Step 5: Show the badge on the Notifications item**

In `components/sections/admin-sidebar-nav.tsx`, change the function signature (set by Task 2) to add `unreadCount`:

```tsx
export function AdminSidebarNav({
  role,
  permissions,
  name,
  email,
  unreadCount,
}: {
  role: string;
  permissions: string[];
  name: string;
  email: string;
  unreadCount: number;
}) {
```

Then change the Notifications `DropdownMenuItem` to:

```tsx
              <DropdownMenuItem asChild>
                <Link href="/admin/notifications" className="justify-between">
                  <span className="flex items-center gap-2">
                    <Bell size={16} />
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
```

- [ ] **Step 6: Write the notifications actions**

Create `app/admin/(panel)/notifications/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/admin-access";
import { markRead, markAllRead } from "@/lib/notification-service";

export async function markNotificationRead(notificationId: string) {
  const admin = await requireAdminAction();
  await markRead(admin.id!, notificationId);
  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const admin = await requireAdminAction();
  await markAllRead(admin.id!);
  revalidatePath("/admin/notifications");
  return { success: true };
}
```

- [ ] **Step 7: Write the notification list component**

Create `app/admin/(panel)/notifications/notification-list.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { markNotificationRead, markAllNotificationsRead } from "./actions";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();

  async function handleClick(notification: Notification) {
    if (!notification.readAt) {
      await markNotificationRead(notification.id);
      router.refresh();
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    router.refresh();
  }

  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        {hasUnread && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          </div>
        )}
        {notifications.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {notifications.map((notification) => {
          const row = (
            <div
              className={`flex items-start gap-3 rounded-md border border-border p-3 ${notification.readAt ? "" : "bg-accent/50"}`}
            >
              {!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              <div className="flex-1">
                <p className="font-medium text-foreground">{notification.title}</p>
                {notification.body && <p className="text-sm text-muted-foreground">{notification.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{notification.createdAt.toLocaleString()}</p>
              </div>
            </div>
          );

          return notification.href ? (
            <Link key={notification.id} href={notification.href} onClick={() => handleClick(notification)}>
              {row}
            </Link>
          ) : (
            <button key={notification.id} type="button" className="text-left" onClick={() => handleClick(notification)}>
              {row}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 8: Write the page**

Create `app/admin/(panel)/notifications/page.tsx`:

```tsx
import { requireAdminPage } from "@/lib/admin-access";
import { getNotifications } from "@/lib/notification-service";
import { NotificationList } from "./notification-list";

export default async function AdminNotificationsPage() {
  const admin = await requireAdminPage("/admin/notifications");
  const notifications = await getNotifications(admin.id!);

  return (
    <section className="admin-content-page">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin / notifications</p>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
      </div>
      <NotificationList notifications={notifications} />
    </section>
  );
}
```

- [ ] **Step 9: Run lint, build, test**

Run: `npm run lint && npm run build && npm test`
Expected: all succeed.

- [ ] **Step 10: Commit**

```bash
git add prisma/schema.prisma lib/notification-service.ts lib/order-service.ts components/sections/admin-sidebar.tsx components/sections/admin-sidebar-nav.tsx "app/admin/(panel)/notifications"
git commit -m "Add per-admin notifications for new orders and low stock"
```

---

## After all tasks: manual verification

Run through the spec's own Verification section live in the browser:

1. `npm run lint`, `npm run build`, `npm test` one final time on the accumulated branch state.
2. Switch between admin modules and confirm the sidebar doesn't remount (e.g. open React DevTools' Components panel, note the `AdminSidebarNav` fiber, navigate, confirm it isn't recreated — or simpler: scroll the sidebar nav slightly, navigate, confirm scroll position survives).
3. Confirm `/admin/login`, `/admin/forgot-password`, `/admin/reset-password` render with no sidebar; every other `/admin/*` route renders with one.
4. Profile: change name, confirm the dropdown trigger reflects it after `router.refresh()`; change password with a wrong current password (inline error), then with the correct one (succeeds); log out and log back in with the new password.
5. Forgot password: leave SMTP env unset, submit a real admin's email, confirm the generic success message and that the reset link is logged to the terminal running `npm run dev`; open that link, set a new password, confirm redirect to `/admin/login?reset=1` shows the success notice, log in with the new password. Reuse the same link a second time — confirm it's rejected.
6. Notifications: place a real storefront order end-to-end (add to cart, checkout with offline payment), then check `/admin/notifications` — confirm an `order.new` row exists and the dropdown badge count matches. Find or seed a product with inventory at 5, order enough of it to drop below 5, confirm a `stock.low` notification fires exactly once (order it again — confirm no duplicate low-stock notification since it's already below threshold).
7. Dark mode: toggle it from the dropdown, confirm the whole admin (including status badges) flips, refresh the page and confirm it persists, then visit the storefront homepage in the same browser and confirm it's unaffected either way.
