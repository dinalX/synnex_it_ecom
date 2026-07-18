# Admin shell & account

## Context

The admin panel is now fully shadcn/Tailwind, but the shell around it has
gaps a daily user feels immediately:

- Every admin page renders `<AdminSidebar />` itself inside its own
  `<main className="admin-shell">`, and `app/admin/layout.tsx` just
  returns `children` — so the sidebar remounts (visibly re-renders) on
  every module switch.
- The only account control anywhere is a bare "Log out" button at the
  sidebar bottom. There is no profile page, no way for an admin to
  change their own password, and no reset flow if they forget it.
- No notification concept exists at all.
- The admin UI is light-only.

This spec is project 1 of a 3-project sequence agreed with the user
(1: admin shell & account, 2: category management, 3: inventory
management). Decisions already made by the user: build in 1→2→3 order;
notifications are a **real** stored system with per-admin read state
(not a derived live view); password reset includes **email-based
forgot-password**, not just self-service change.

## Goals

- Sidebar persists across module navigation (no remount).
- Profile dropdown at the sidebar bottom: admin name, Profile link,
  Notifications (with unread badge), dark-mode toggle, Log out.
- `/admin/profile`: edit display name, change own password.
- Forgot-password flow on the admin login page, delivered by email.
- Stored notifications generated on new orders and low stock, with
  per-admin read/unread and a list page.
- Dark mode for the admin panel only.

## Non-goals

- No storefront changes of any kind (dark mode, layout, notifications
  are all admin-scoped).
- No customer-facing password reset (that's a separate storefront
  feature; this is AdminUser only).
- No real-time push (polling/refresh on navigation is enough for a
  small admin team).
- No notification preferences/settings UI.
- Categories and inventory work (projects 2 and 3).

## 1. Route restructure + persistent sidebar

Create route group `app/admin/(panel)/` with its own `layout.tsx`:

```tsx
// app/admin/(panel)/layout.tsx
import { AdminSidebar } from "@/components/sections/admin-sidebar";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-shell">
      <AdminSidebar />
      {children}
    </main>
  );
}
```

- Move every admin page directory into `(panel)/` **except**
  `app/admin/login/` and the new `app/admin/forgot-password/` and
  `app/admin/reset-password/` (all three render without a sidebar —
  a logged-out visitor has no admin identity for the sidebar to
  reflect). Route URLs are unchanged (route groups don't affect paths).
- Each moved page drops its own `<main className="admin-shell">` +
  `<AdminSidebar />` wrapper and renders only its content section
  (`<section className="admin-content-page">…` or `admin-main` for the
  dashboard).
- `error.tsx` and `loading.tsx` move into `(panel)/` and drop their
  hand-rolled static sidebar stubs (a previously-audited
  inconsistency): the layout now provides the real sidebar even in
  error/loading states, so the boundaries only render their content
  area.
- `app/admin/layout.tsx` (outer) keeps the CSS imports
  (`admin-orders.css`, `admin-tailwind.css`) and the theme
  pre-hydration script (see §5) so login/reset-password still get
  Tailwind styles.

## 2. Profile dropdown

`AdminSidebar` (server wrapper) already fetches role + permissions; it
additionally passes `name` and `email` into `AdminSidebarNav`. At the
sidebar bottom, the current bare "Log out" form is replaced by a
`DropdownMenu` (the existing, currently-unused
`components/ui/dropdown-menu.tsx`):

- **Trigger**: ghost button with an initial-avatar circle (first letter
  of name), the admin's name, and a chevron. Same visual family as the
  nav items.
- **Items**:
  - Header row (non-interactive): name + email.
  - "Profile" → `/admin/profile`.
  - "Notifications" → `/admin/notifications`, with a small count badge
    when unread > 0 (count fetched by the server wrapper and passed as
    a prop; it refreshes on navigation, which is acceptable — see
    non-goals).
  - "Dark mode" toggle item (see §5) — does not close the menu on
    toggle.
  - Separator, then "Log out" — a `<form action="/api/auth/logout"
    method="post">` submit item, same mechanism as today.

## 3. Profile page + change password

`app/admin/(panel)/profile/page.tsx` + `profile-form.tsx` +
`actions.ts`, following the established manager-page conventions:

- **Profile card**: display name `Input` (editable), email shown
  read-only with helper text ("Email is your login and can't be changed
  here."), role + last-login shown as read-only facts.
  `updateProfile(formData)` server action: `requireAdminAction()` (no
  special permission — self-service), trims/validates non-empty name,
  updates own row only (id from session), `revalidatePath`.
- **Change password card**: current password, new password, confirm.
  `changePassword(formData)` action: `requireAdminAction()`, verify
  current password via `lib/password.ts::verifyPassword` against own
  row, require new length ≥ 8 and new === confirm, hash via
  `hashPassword`, update own row. Errors surface inline in the form
  (same error-state pattern as the manager dialogs).
- New `lib/password-policy.ts`: `validateNewPassword(next: string,
  confirm: string): string | null` (returns the error message or null)
  — pure, unit-tested, shared by change-password and reset-password.

## 4. Forgot password via email

### Email infrastructure

- Add `nodemailer` (+ `@types/nodemailer`) to dependencies.
- New `lib/email.ts`: `sendEmail({ to, subject, html, text })` reading
  `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`EMAIL_FROM` from
  env (documented in `.env.example`). **When SMTP env is not
  configured** (any required var missing): log the would-be email
  (including the reset URL) to the server console and return
  `{ sent: false }` instead of throwing — the flow stays fully testable
  in dev without credentials, and the caller treats both outcomes as
  success (see below).

### Schema

```prisma
model AdminPasswordResetToken {
  id        String    @id @default(cuid())
  adminId   String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  admin AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([expiresAt])
}
```

### Flow

- Login page gains a "Forgot password?" link →
  `app/admin/forgot-password/page.tsx` (outside `(panel)`, no sidebar):
  a single email field posting to `POST
  /api/auth/admin-forgot-password`.
- The route: rate-limit-free but **enumeration-safe** — always responds
  with the same generic success message whether or not the email
  matches an active AdminUser. When it matches: generate 32 random
  bytes (base64url), store `sha256(token)` as `tokenHash` with
  `expiresAt = now + 1h`, invalidate (delete) any previous unused
  tokens for that admin, and send an email whose link is
  `{site.url}/admin/reset-password?token=<raw token>`.
- `app/admin/reset-password/page.tsx` (outside `(panel)`): new password
  + confirm posting (with the token) to `POST
  /api/auth/admin-reset-password`. The route hashes the presented
  token, looks up a row that is unused and unexpired, validates the new
  password via `validateNewPassword`, updates `passwordHash`, marks the
  token `usedAt`, and redirects to `/admin/login?reset=1` (login page
  shows a "password updated — log in" notice). Invalid/expired token →
  clear error with a link back to forgot-password.
- Both routes run `validateCSRF` (they're browser form posts, same as
  login) and `validateBodySize`.
- New `lib/reset-token.ts`: `generateResetToken(): { token, tokenHash }`
  and `hashResetToken(token): string` — pure sha256/base64url helpers,
  unit-tested.

## 5. Dark mode (admin only)

- `app/admin/admin-tailwind.css`: add a dark value set for every
  existing `--admin-*` token under
  `:root[data-admin-theme="dark"] { … }` (standard shadcn dark values:
  near-black background/card, light foreground, adjusted
  border/muted/accent), and register a Tailwind `dark` variant keyed to
  that attribute via `@custom-variant dark
  (&:where([data-admin-theme="dark"], [data-admin-theme="dark"] *));`
  so `dark:` utilities work in admin files.
- The outer `app/admin/layout.tsx` injects a tiny inline script (before
  paint) that reads `localStorage.adminTheme` and sets
  `data-admin-theme` on `<html>` — no flash of wrong theme. Because
  every dark override lives behind `--admin-*` tokens and the `dark:`
  variant only appears in admin-sourced files, setting the attribute on
  `<html>` cannot restyle the storefront.
- The dropdown's "Dark mode" item toggles the attribute + persists to
  localStorage (small client helper `components/admin/theme-toggle.tsx`).
- The `(panel)` layout's `<main>` gains `bg-background
  text-foreground` so the shell itself follows the tokens (the old
  `admin-shell` grid class from globals.css keeps only its layout
  duties).
- Sweep the small set of hardcoded light-only status colors in admin
  files (`bg-emerald-100 text-emerald-800`, `bg-slate-100
  text-slate-700`, `bg-red-50 text-red-600`, `bg-red-100 text-red-700`)
  and add `dark:` variants (e.g. `dark:bg-emerald-950
  dark:text-emerald-300`). This is a bounded find-and-extend pass over
  the admin manager files, not a redesign.

## 6. Notifications

### Schema

```prisma
model AdminNotification {
  id        String    @id @default(cuid())
  adminId   String
  type      String    // "order.new" | "stock.low"
  title     String
  body      String?
  href      String?
  readAt    DateTime?
  createdAt DateTime  @default(now())

  admin AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId, readAt])
  @@index([createdAt])
}
```

Fan-out on write: one row per **active** admin per event, so read state
is naturally per-admin. Team sizes here are single-digit; volume is not
a concern.

### Service

New `lib/notification-service.ts`:
- `notifyAdmins(input: { type, title, body?, href? })` — fetches active
  admin ids, `createMany` one row each. Fire-and-forget at call sites
  (`try/catch` + `console.error`; never fails the triggering request).
- `LOW_STOCK_THRESHOLD = 5` exported constant.
- `getUnreadCount(adminId)`, `getNotifications(adminId, { take })`,
  `markRead(adminId, notificationId)`, `markAllRead(adminId)` — all
  scoped by adminId so one admin can never touch another's rows.

### Generation hooks

In `lib/order-service.ts::createOrderFromCurrentCart`, after the order
transaction commits:
- `order.new`: "New order {orderNumber}" / body: customer + total /
  href `/admin/orders/{id}`.
- `stock.low`: for each line item whose post-decrement inventory fell
  **below** `LOW_STOCK_THRESHOLD` crossing the threshold with this
  order (i.e. before ≥ threshold, after < threshold — no repeat spam on
  every subsequent order): "Low stock: {product name} ({n} left)" /
  href `/admin/products/{id}`.

### UI

- Dropdown "Notifications" item shows unread count (from the server
  wrapper, refreshed per navigation).
- `app/admin/(panel)/notifications/page.tsx` + `notification-list.tsx`
  + `actions.ts`: list (newest first, take 50) with unread rows
  visually distinct (background tint + dot), each row linking to its
  `href` and marking itself read on click (server action), "Mark all
  read" button, empty state. No delete (YAGNI).

## Schema changes summary

Two new models (`AdminPasswordResetToken`, `AdminNotification`) + two
new relation fields on `AdminUser`. Applied with `prisma db push` (the
project's existing convention — no migrations directory).

## Testing

Pure-function `node:test` files, matching project convention:
- `tests/password-policy.test.ts` — length rule, mismatch rule, happy
  path.
- `tests/reset-token.test.ts` — token/hash round trip, hash is
  deterministic, token is unique per call.
Everything else (DB CRUD, email, UI) is covered by the manual
verification pass below, per existing convention.

## Verification

`npm run lint`, `npm run build`, `npm test`, then live in the browser:
- Switch between admin modules: sidebar does not remount (no flash;
  verify via React DevTools or by observing scroll position of the nav
  persisting).
- Login and reset-password pages render **without** a sidebar.
- Profile: change name → reflected in dropdown trigger after refresh;
  change password with wrong current → inline error; with correct →
  succeeds, re-login with new password works.
- Forgot password: submit a real admin email with SMTP unconfigured →
  generic success shown, reset URL logged to server console; open it,
  set a valid new password, log in with it. Re-using the same link →
  clear error.
- Notifications: place a storefront order → each admin gets an
  `order.new` row; order a product with inventory at the threshold
  boundary → `stock.low` fires once; unread badge counts match; mark
  read/all-read work; rows link through to order/product.
- Dark mode: toggle → whole admin flips including badges; refresh →
  persists; storefront pages remain pixel-identical in both states.
