# Synnex Commerce — Agent Guide

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Build + typecheck |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Prisma schema to SQLite |
| `npm run db:seed` | Seed 48 products, 4 categories |
| `npm run db:reset` | Force reset + reseed |

Setup order: `npm install` → `cp .env.example .env` → set `AUTH_SECRET` → `npm run db:push` → `npm run db:seed`.

No `test`, `typecheck`, or `format` scripts exist. `postinstall` auto-runs `prisma generate`.

## Architecture gotchas

- **Middleware is broken.** `proxy.ts` at root has `config.matcher` but is not named `middleware.ts` — Next.js ignores it. Admin API routes duplicate `requireAdmin()` inline. Admin page Server Components (`app/admin/*/page.tsx`) have **zero auth checks** — they render data to anyone who knows the URL.
- **Client auth calls silently fail.** `lib/api-client.ts:16` omits `credentials: 'include'` — cookies are never sent. Server Actions + `app/api/*/route.ts` are the only working mutation paths.
- **Dead code (safe to delete):** `lib/catalog.ts` (175 lines), `lib/admin-data.ts` (60 lines). Not imported by any active file.
- **Two mutation patterns coexist:** Server Actions (`app/admin/*/actions.ts`) and REST API routes (`app/api/*/route.ts`). Both are used; prefer Server Actions for admin mutations.

## Auth & security pitfalls

- Admin login compares against `process.env.ADMIN_EMAIL`/`ADMIN_PASSWORD` (plaintext env vars), not the `AdminUser` DB table. Customer auth uses scrypt via `lib/password.ts`.
- Session tokens are base64-encoded + HMAC-SHA256 signed — **not encrypted**. Token contents (email, name, role) are trivially readable. TTL is hardcoded 8 hours. No revocation mechanism.
- No CSRF protection, no rate limiting, no request body size limits on any endpoint.
- Cart session IDs use `Math.random()` — predictable.

## Known bugs to avoid

- `app/api/products/route.ts:13,22` — `where.OR` is overwritten when search + category params both provided. Second assignment replaces the first.
- `app/api/pages/[slug]/route.ts:6` — dynamic `[slug]` param is ignored; handler reads `slug` from query string instead.
- `app/api/orders/route.ts:21` — unauthenticated requests get `where = {}` and see **all orders**.
- `app/admin/products/actions.ts:99` — `updateProduct` regenerates `slug` from `name` every call, breaking existing links on rename.
- `lib/data.ts:19` — `contains` on SQLite does full table scan. `mode: "insensitive"` is silently ignored by SQLite driver.
- `app/admin/products/actions.ts` and `app/admin/orders/page.tsx` — `ensureAdmin()` is copy-pasted across every action file. No shared helper.
- Admin order status fields accept any string (no enum validation) — `app/admin/orders/[id]/actions.ts:29-31`.

## Styling rules

- Pure CSS in `app/globals.css` (~3000 lines). **Never use Tailwind.**
- Variables: `--ink`, `--muted`, `--line`, `--paper`, `--white`, `--green`, `--blue`, `--amber`, `--orange`, `--shadow`
- Breakpoints: 980px, 640px. BEM-like naming. PostCSS config is empty.
- Inline `style={{}}` is used in admin pages (existing pattern, but avoid adding more).

## Database context

- SQLite + Prisma at `prisma/schema.prisma` — 16 models. No FTS index. No `@@index([email])` on Customer.
- `npm run db:seed` populates products for 4 categories: POS Solution, Barcode, Biometrics, PC & Printer.

## Cookies

| Name | TTL | Purpose |
|------|-----|---------|
| `synnex_user_session` | 8h | Customer auth |
| `synnex_admin_session` | 8h | Admin auth |
| `cart_session` | 30d | Cart (set by API, not client code) |
