---
name: synnex-commerce
description: Core project knowledge for the Synnex Commerce e-commerce platform. Covers architecture, conventions, known bugs, and codebase structure. Use this for any task in this repo.
compatibility: opencode
metadata:
  audience: agents
  workflow: repo-orientation
---

## What to know

- Next.js App Router app with Prisma + SQLite.
- Styling is pure CSS in `app/globals.css`; do not use Tailwind.
- Prefer Server Actions for admin mutations when practical.
- Admin auth is not uniformly enforced in server components; check routes carefully.

## Commands

- `npm run dev` starts the app.
- `npm run build` runs build + typecheck.
- `npm run lint` runs ESLint.
- `npm run db:push` pushes the Prisma schema.
- `npm run db:seed` seeds products and categories.
- `npm run db:reset` force resets and reseeds.

## Architecture gotchas

- `proxy.ts` is not `middleware.ts`, so Next.js will ignore it.
- Client auth helpers must send credentials.
- Some admin page server components render data without auth checks.
- Two mutation patterns coexist: Server Actions and REST API routes.

## Security and data concerns

- Admin login uses env credentials.
- Session tokens are signed, not encrypted.
- No CSRF protection, rate limiting, or request body size limits are broadly enforced.
- Cart session IDs are predictable if generated with `Math.random()`.

## Known bugs to watch

- Product search/category filtering can overwrite `where.OR` in `app/api/products/route.ts`.
- `app/api/pages/[slug]/route.ts` must read the dynamic route param.
- `app/api/orders/route.ts` must not leak all orders to unauthenticated users.
- Renaming products can change slugs and break links.
- SQLite `contains` searches do full scans.

## Working style

- Preserve the repo's existing CSS and component structure.
- Keep edits scoped and verify the concrete flow you changed.
- When in doubt, inspect the app route, API route, and Prisma schema together.
