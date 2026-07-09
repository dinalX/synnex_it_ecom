---
name: admin-section-builder
description: Build or refactor admin dashboard and management sections for Synnex Commerce while preserving the existing CSS system, server-side auth, and mutation patterns.
compatibility: opencode
metadata:
  audience: agents
  workflow: admin-ui
---

## Use this skill when

- Adding a new admin page or panel.
- Editing order, product, category, content, or settings management flows.
- Wiring UI to Server Actions or admin API routes.

## Rules

- Keep using the repo's custom CSS and existing admin class naming.
- Do not introduce Tailwind.
- Keep auth checks on the server side, not only in the UI.
- Prefer Server Actions for admin mutations unless an API route is already the clear path.
- Revalidate affected pages after mutation.

## Implementation notes

- Reuse `AdminSidebar` and the existing panel layout patterns.
- Preserve the current database and slug behavior unless the task explicitly changes it.
- Validate inputs before sending them to Prisma.
- Avoid broad refactors when a targeted change will do.
