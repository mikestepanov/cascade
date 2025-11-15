# CLAUDE.md - AI Assistant Guide for Cascade

This document provides comprehensive guidance for AI assistants working on the Cascade codebase. It covers the project structure, development conventions, and key patterns to follow.

## Project Overview

**Cascade** is a collaborative project management platform that combines document management (Confluence-like) with issue tracking (Jira-like). It features real-time collaboration, presence indicators, and live updates.

**Key Features:**
- Real-time collaborative document editing with BlockNote
- Kanban boards with drag-and-drop issue management
- Sprint planning and tracking
- Custom workflow states
- Activity logging and comments
- Document-to-project linking
- Full-text search capabilities
- Live presence indicators

## Tech Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 3
- **Editor:** BlockNote (ProseMirror-based)
- **State Management:** Convex React hooks (reactive queries)
- **Notifications:** Sonner (toast notifications)
- **Analytics:** PostHog (product analytics & session replay)

### Backend
- **Platform:** Convex (serverless backend with real-time database)
- **Authentication:** @convex-dev/auth (Password + Anonymous providers)
- **Real-time Features:**
  - @convex-dev/presence (user presence tracking)
  - @convex-dev/prosemirror-sync (collaborative editing)
- **HTTP API:** Convex HTTP router

### Development Tools
- **Package Manager:** pnpm (preferred) or npm
- **Linting:** ESLint 9 with TypeScript support
- **Type Checking:** TypeScript 5.7
- **Formatting:** Prettier 3.5
- **Version Control:** Git

## Codebase Structure

```
cascade/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── Sidebar.tsx          # Document navigation sidebar
│   │   ├── DocumentEditor.tsx   # Collaborative document editor
│   │   ├── ProjectSidebar.tsx   # Project navigation
│   │   ├── ProjectBoard.tsx     # Project kanban board container
│   │   ├── KanbanBoard.tsx      # Drag-and-drop kanban board
│   │   ├── IssueCard.tsx        # Individual issue card
│   │   ├── CreateIssueModal.tsx # Issue creation modal
│   │   ├── SprintManager.tsx    # Sprint management UI
│   │   └── PresenceIndicator.tsx # User presence display
│   ├── lib/                     # Utility functions
│   │   └── utils.ts             # cn() for className merging
│   ├── App.tsx                  # Main app component with routing logic
│   ├── SignInForm.tsx           # Authentication form
│   ├── SignOutButton.tsx        # Sign out component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles and Tailwind imports
│
├── convex/                       # Backend Convex functions
│   ├── _generated/              # Auto-generated types and API
│   ├── schema.ts                # Database schema definition
│   ├── auth.ts                  # Authentication configuration
│   ├── documents.ts             # Document CRUD operations
│   ├── projects.ts              # Project management functions
│   ├── issues.ts                # Issue tracking operations
│   ├── sprints.ts               # Sprint management
│   ├── presence.ts              # User presence tracking
│   ├── prosemirror.ts           # Collaborative editing sync
│   ├── http.ts                  # HTTP API endpoints
│   ├── router.ts                # HTTP route configuration
│   ├── auth.config.ts           # Auth provider configuration
│   └── convex.config.ts         # Convex app configuration
│
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration (base)
├── tsconfig.app.json             # Frontend TypeScript config
├── tsconfig.node.json            # Node/build TypeScript config
├── vite.config.ts                # Vite build configuration
├── tailwind.config.js            # Tailwind CSS customization
├── eslint.config.js              # ESLint configuration
├── postcss.config.cjs            # PostCSS configuration
├── components.json               # Shadcn component configuration
└── setup.mjs                     # Convex Auth setup script
```

## Database Schema

### Core Tables

**documents**
- Stores collaborative documents
- Fields: title, isPublic, createdBy, projectId (optional)
- Indexes: by_creator, by_public, by_created_at, by_project
- Search index on title

**projects**
- Project definitions with custom workflows
- Fields: name, key (e.g., "PROJ"), description, members[], workflowStates[], boardType
- Indexes: by_creator, by_key, by_public
- Search index on name

**issues**
- Individual tasks/bugs/stories/epics
- Fields: key (e.g., "PROJ-123"), title, description, type, status, priority, assigneeId, reporterId, sprintId, epicId, linkedDocuments[], order
- Indexes: by_project, by_assignee, by_status, by_sprint, by_epic, by_project_status
- Search index on title

**sprints**
- Sprint planning and tracking
- Fields: name, goal, startDate, endDate, status (future/active/completed)
- Indexes: by_project, by_status

**issueComments**
- Threaded comments on issues
- Fields: issueId, authorId, content, createdAt, updatedAt
- Indexes: by_issue, by_author

**issueActivity**
- Audit log of all issue changes
- Fields: issueId, userId, action, field, oldValue, newValue
- Indexes: by_issue, by_user

**issueLinks**
- Relationships between issues
- Types: blocks, relates, duplicates
- Indexes: by_from_issue, by_to_issue

## Key Conventions

### Code Style

1. **TypeScript Patterns:**
   - Use strict type checking (enabled in tsconfig)
   - Prefer explicit types for function parameters
   - Use Convex's `v` validators for runtime type safety
   - Use generated types from `convex/_generated/dataModel`

2. **React Patterns:**
   - Functional components with hooks
   - Use `useQuery` for reactive Convex queries
   - Use `useMutation` for Convex mutations
   - State management via React hooks (useState, useEffect)
   - Authenticated/Unauthenticated wrappers from convex/react

3. **Styling:**
   - Tailwind CSS utility classes
   - Use `cn()` utility from `@/lib/utils` for conditional classes
   - Custom theme colors: primary, secondary, accent (see tailwind.config.js)
   - Responsive design with mobile-first approach

4. **Naming Conventions:**
   - Components: PascalCase (e.g., `DocumentEditor.tsx`)
   - Files: camelCase for utilities, PascalCase for components
   - Convex functions: camelCase (e.g., `createDocument`)
   - Database IDs: Use Convex's `Id<"tableName">` type
   - CSS classes: Tailwind utilities, kebab-case for custom classes

### Convex Backend Patterns

1. **Query Pattern:**
```typescript
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    // Check authentication
    // Check permissions
    // Return data
  },
});
```

2. **Mutation Pattern:**
```typescript
export const update = mutation({
  args: { id: v.id("documents"), title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    // Validate authentication
    // Validate permissions
    // Update database
    // Log activity (for issues)
  },
});
```

3. **Authentication:**
   - Always use `getAuthUserId(ctx)` to get current user
   - Check `if (!userId)` to enforce authentication
   - Throw errors for unauthorized access

4. **Access Control:**
   - Public/private documents based on `isPublic` flag
   - Project members array for team access
   - Owner-only operations for deletes and certain updates
   - Filter query results based on user permissions

5. **Activity Logging:**
   - Log all issue changes to `issueActivity` table
   - Track field-level changes (oldValue → newValue)
   - Record actions: "created", "updated", "commented", "assigned"

### Frontend Patterns

1. **Component Structure:**
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ComponentName({ prop }: { prop: Type }) {
  const data = useQuery(api.module.queryName, { args });
  const mutate = useMutation(api.module.mutationName);

  // Component logic

  return (
    <div className="tailwind classes">
      {/* JSX */}
    </div>
  );
}
```

2. **State Management:**
   - Use `useState` for local UI state
   - Use Convex `useQuery` for server state (automatic reactivity)
   - Pass state handlers down as props
   - Avoid prop drilling with composition

3. **Error Handling:**
   - **Error Boundaries:** App uses React Error Boundaries to prevent crashes
   - Use try/catch with Convex mutations
   - Display errors with Sonner toast notifications
   - Show loading states during async operations
   - Handle null/undefined from queries gracefully

   **Error Boundary Usage:**
   ```typescript
   import { ErrorBoundary } from "@/components/ErrorBoundary";
   import { SectionErrorFallback } from "@/components/SectionErrorFallback";

   // Wrap sections that might error
   <ErrorBoundary
     fallback={<SectionErrorFallback title="Section Error" />}
     onError={(error, errorInfo) => console.error(error)}
   >
     <YourComponent />
   </ErrorBoundary>
   ```

   **Error Boundary Locations:**
   - App-level: Wraps entire application (App.tsx:17)
   - Sidebar: Prevents sidebar errors from crashing app (App.tsx:45)
   - Main content: Isolates editor/board errors (App.tsx:117)

   **Custom Error Fallbacks:**
   - Use `SectionErrorFallback` for consistent error UI
   - Provide custom fallback for specialized sections
   - Include retry functionality when appropriate

## Development Workflows

### Setup & Installation

```bash
# Clone repository
git clone <repository-url>
cd cascade

# Install dependencies (use pnpm)
pnpm install

# Optional: Set up environment variables
# Create .env.local for PostHog analytics
echo "VITE_PUBLIC_POSTHOG_KEY=your_key" > .env.local
echo "VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com" >> .env.local

# Start development server (runs frontend + backend in parallel)
pnpm run dev
# OR run separately:
pnpm run dev:frontend  # Starts Vite on http://localhost:5173
pnpm run dev:backend   # Starts Convex dev server
```

### Available Scripts

```bash
pnpm run dev          # Start both frontend and backend
pnpm run dev:frontend # Start only Vite dev server
pnpm run dev:backend  # Start only Convex dev server
pnpm run build        # Build for production
pnpm run preview      # Preview production build
pnpm run lint         # Run ESLint
pnpm run typecheck    # Run TypeScript type checking
pnpm run check        # Run both typecheck and lint
```

### Making Changes

1. **Adding a new feature:**
   - Define schema changes in `convex/schema.ts` if needed
   - Create/update Convex functions in appropriate module
   - Create/update React components
   - Test locally with `pnpm run dev`
   - Run `pnpm run check` before committing

2. **Modifying the database:**
   - Update schema in `convex/schema.ts`
   - Add indexes for query performance
   - Add search indexes for full-text search
   - Convex handles migrations automatically

3. **Adding new dependencies:**
   - Use `pnpm add <package>` for runtime dependencies
   - Use `pnpm add -D <package>` for dev dependencies
   - Keep pnpm-lock.yaml in version control

### Code Quality

1. **Before Committing:**
```bash
pnpm run typecheck  # Ensure no TypeScript errors
pnpm run lint       # Check for linting issues
# OR use combined check
pnpm run check      # Run both
```

2. **ESLint Configuration:**
   - Uses TypeScript ESLint with recommended rules
   - React hooks rules enabled
   - Relaxed `any` rules for easier development
   - Unused variables warning (ignore with `_` prefix)

3. **TypeScript Configuration:**
   - Strict mode enabled
   - Path alias `@/*` → `./src/*`
   - Separate configs for app, node, and convex code

## Deployment

### Convex Backend Deployment

```bash
# Deploy Convex backend to production
pnpm convex deploy
```

Required environment variable for CI/CD:
- `CONVEX_DEPLOY_KEY` - Get from Convex dashboard → Settings → Deploy Keys

### Frontend Deployment (Vercel Recommended)

1. **Build Command:**
```bash
npx convex deploy --cmd 'pnpm run build'
```

2. **Output Directory:** `dist`

3. **Environment Variables:**
   - `CONVEX_DEPLOY_KEY` (required for production)
   - `VITE_PUBLIC_POSTHOG_KEY` (optional, for analytics)
   - `VITE_PUBLIC_POSTHOG_HOST` (optional, for analytics)

4. **Framework Preset:** Vite

### Convex Deployment Details

- Deployment name: `peaceful-salmon-964`
- Dashboard: https://dashboard.convex.dev/d/peaceful-salmon-964
- Convex handles scaling, hosting, and database automatically
- No separate database setup required

## Important Patterns & Gotchas

### Real-time Collaboration

1. **Document Editing:**
   - Uses ProseMirror Sync for collaborative editing
   - Presence indicators show active users
   - Changes sync automatically through Convex

2. **Presence Tracking:**
   - Configured in `convex/presence.ts`
   - Shows who's viewing/editing documents
   - Updates in real-time via Convex Presence

3. **Reactive Queries:**
   - Convex queries are reactive - they auto-update
   - No need for manual refetching
   - Use `useQuery` for live data

### Performance Considerations

1. **Database Queries:**
   - Always use indexes for queries (defined in schema)
   - Use `.withIndex()` for filtered queries
   - Use `.withSearchIndex()` for search
   - Order results with `.order("desc")` or `.order("asc")`

2. **Data Fetching:**
   - Use Promise.all() for parallel fetches
   - Denormalize when showing related data (e.g., creator names)
   - Filter results in query when possible

3. **Component Optimization:**
   - React 19's automatic optimizations handle most cases
   - Avoid unnecessary re-renders with proper state placement
   - Use loading states for better UX

### Security Patterns

1. **Authentication:**
   - Check `userId` in every mutation/query
   - Use `getAuthUserId(ctx)` for current user
   - Throw errors for unauthenticated access

2. **Authorization:**
   - Validate ownership before updates/deletes
   - Check project membership for team features
   - Filter queries based on user permissions
   - Never trust client-side data

3. **Data Validation:**
   - Use Convex validators (`v.string()`, `v.id()`, etc.)
   - Runtime validation happens automatically
   - TypeScript provides compile-time safety

### Common Tasks

**Adding a new Convex function:**
```typescript
// In convex/yourModule.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const yourFunction = mutation({
  args: {
    field: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Your logic here
    return await ctx.db.insert("table", { ...args });
  },
});
```

**Adding a new React component:**
```typescript
// In src/components/YourComponent.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function YourComponent({ id }: { id: Id<"table"> }) {
  const data = useQuery(api.module.yourQuery, { id });
  const update = useMutation(api.module.yourMutation);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4">
      {/* Your component JSX */}
    </div>
  );
}
```

**Adding a new database table:**
```typescript
// In convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  // ... existing tables

  yourTable: defineTable({
    field1: v.string(),
    field2: v.number(),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .searchIndex("search_field", {
      searchField: "field1",
      filterFields: ["userId"],
    }),
};
```

## Testing

The project uses **Vitest** with **React Testing Library** for frontend testing.

### Setup

Testing infrastructure is already configured:
- **Vitest 4** - Fast unit test runner
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom matchers for DOM assertions
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment for tests

### Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage

# Run tests once (used in CI)
pnpm test run
```

### Test File Location

- Place test files next to the code they test
- Use `.test.ts` or `.test.tsx` extension
- Example: `src/lib/utils.test.ts` tests `src/lib/utils.ts`

### Example Component Test

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

describe("YourComponent", () => {
  it("should render correctly", () => {
    render(<YourComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Testing Convex Functions

Convex functions require a different testing approach. See `convex/README.testing.md` for:
- Setting up `convex-test` package
- Testing queries and mutations
- Mocking authentication
- Testing permissions and access control

### Best Practices

1. **Mock Convex hooks** - Use `vi.mock("convex/react")` to mock useQuery/useMutation
2. **Test user interactions** - Use `@testing-library/user-event` for realistic interactions
3. **Test accessibility** - Query by role, label, text (not test IDs)
4. **Keep tests focused** - One concept per test
5. **Use descriptive test names** - Describe what should happen
6. **Clean up** - Automatic cleanup is configured in `src/test/setup.ts`

## Analytics

PostHog integration provides:
- User behavior tracking
- Session recordings
- Feature usage metrics
- Performance monitoring

Analytics are opt-in via environment variables and privacy-focused.

## Chef Integration

The project includes Chef (Convex's development platform) integration:
- Enables screenshots during development
- Only active in development mode
- Safe to remove if not using Chef

## Resources

- [Convex Documentation](https://docs.convex.dev/)
- [React 19 Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [BlockNote Editor](https://www.blocknotejs.org/)
- [PostHog Docs](https://posthog.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

## Development Best Practices

1. **Always run type checking and linting before pushing code**
2. **Use the provided path alias `@/` for imports from src/**
3. **Follow the existing patterns for queries, mutations, and components**
4. **Add indexes to schema for all query patterns**
5. **Log activities for audit trails on important entities**
6. **Check permissions in every backend function**
7. **Use TypeScript types from generated files**
8. **Test real-time features with multiple browser windows**
9. **Keep components focused and composable**
10. **Document complex logic with comments**

## Questions or Issues?

- Check the [Convex Discord](https://convex.dev/community) for backend questions
- Review existing code for patterns and examples
- The codebase is well-structured - similar patterns repeat throughout

---

**Last Updated:** 2025-11-15
**Convex Deployment:** peaceful-salmon-964
**Node Version:** 18+
**Package Manager:** pnpm (preferred)
