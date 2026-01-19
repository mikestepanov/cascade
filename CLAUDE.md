# CLAUDE.md - Nixelo Project Guide

@RULES.md

---

## Project Overview

**Nixelo** is a collaborative project management platform combining document management (Confluence-like) with issue tracking (Jira-like). Features real-time collaboration, presence indicators, and live updates.

**Key Features:** Real-time docs with BlockNote, Kanban boards, sprint planning, custom workflows, RBAC, calendar events, REST API, Google Calendar sync, multi-provider auth, email notifications, Text AI (chat, search), Voice AI (meeting bot).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, TanStack Router, Tailwind CSS 3, BlockNote |
| Backend | Convex (serverless + real-time DB), @convex-dev/auth |
| Tools | pnpm, Biome 2.3.5, TypeScript 5.7 |

## Codebase Structure

```
nixelo/
├── src/
│   ├── routes/           # TanStack Router file-based routes
│   ├── components/       # React components (ui/, AI/)
│   ├── lib/utils.ts      # cn() utility
│   └── config/routes.ts  # ROUTES object - always use this!
├── convex/               # Backend functions, schema.ts
├── emails/               # React Email templates
├── bot-service/          # Voice AI meeting bot
└── docs/                 # Feature documentation
```

## Database Schema (Core Tables)

- **documents**: title, isPublic, createdBy, projectId
- **projects**: name, key, members[], workflowStates[]
- **issues**: key (PROJ-123), title, status, priority, assigneeId, sprintId
- **sprints**: name, goal, startDate, endDate, status
- **calendarEvents**: title, startTime, endTime, attendeeIds[], isRequired

## Routing

**IMPORTANT:** Always use `ROUTES` from `@/config/routes.ts`. Never hardcode paths.

```typescript
import { ROUTES } from "@/config/routes";

ROUTES.dashboard(slug)              // "/:slug/dashboard"
ROUTES.projects.board(slug, key)    // "/:slug/projects/:key/board"
ROUTES.issues.detail(slug, key)     // "/:slug/issues/:key"
```

## UI Components

Use components from `src/components/ui/` instead of raw HTML:

`Button`, `Flex`, `Typography`, `Card`, `Input`, `Dialog`, `Tooltip`, `Badge`, `Avatar`, `LoadingSpinner`, `EmptyState`, `DropdownMenu`

## Convex Patterns

```typescript
// Query
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    // Check permissions, return data
  },
});

// Mutation
export const update = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    // Validate, update, log activity
  },
});
```

**Auth:** Always use `getAuthUserId(ctx)`, check `if (!userId)`, throw for unauthorized.

**RBAC:** Roles are admin > editor > viewer. Use `convex/rbac.ts` utilities.

## Scripts

```bash
pnpm dev              # Start frontend + backend
pnpm run check        # Typecheck + lint + tests
pnpm run biome        # Lint with auto-fix
pnpm run typecheck    # TypeScript check
pnpm e2e:ui           # E2E tests (interactive)
```

## Deployment

- **Backend:** `pnpm convex deploy`
- **Frontend:** Vercel with `npx convex deploy --cmd 'pnpm run build'`
- **Dashboard:** https://dashboard.convex.dev/d/peaceful-salmon-964

## Key Patterns

- **Real-time:** ProseMirror Sync for docs, Convex Presence for users
- **Queries:** Always use indexes (`.withIndex()`), reactive with `useQuery`
- **Errors:** Use `showError(error, "Context")`, `ErrorBoundary` components

## Resources

- [Convex Best Practices](./docs/CONVEX_BEST_PRACTICES.md)
- [Testing Guide](./docs/testing/README.md)
- [Pagination Patterns](./docs/PAGINATION_PATTERNS.md)
- [Email System](./docs/email/README.md)
- [AI Features](./docs/ai/README.md)

---

**Convex Deployment:** peaceful-salmon-964 | **Node:** 18+ | **Package Manager:** pnpm
