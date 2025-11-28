# CLAUDE.md - AI Assistant Guide for Nixelo

This document provides comprehensive guidance for AI assistants working on the Nixelo codebase. It covers the project structure, development conventions, and key patterns to follow.

## Project Overview

**Nixelo** is a collaborative project management platform that combines document management (Confluence-like) with issue tracking (Jira-like). It features real-time collaboration, presence indicators, and live updates.

**Key Features:**
- Real-time collaborative document editing with BlockNote
- Kanban boards with drag-and-drop issue management
- Sprint planning and tracking
- Custom workflow states
- Activity logging and comments
- Document-to-project linking
- Full-text search capabilities
- Live presence indicators
- Analytics dashboard with charts and metrics
- Role-based access control (RBAC)
- Team velocity tracking and burndown charts
- Calendar events with attendance tracking (required meetings)
- REST API with API key management
- Google Calendar integration (OAuth, bi-directional sync)
- Pumble webhook integration (team chat notifications)
- **Multi-provider authentication** (Email/Password, Google OAuth, Anonymous)
- **User invitation system** (Admin-controlled, email-based invites with expiration)
- **User management dashboard** (Admin view of all users and invitations)
- **Email notifications** (Multi-provider, user preferences, React Email templates)
- **Text AI** (AI chat, semantic search, suggestions, duplicate detection)
- **Voice AI** (Meeting bot, transcription, AI summarization)

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
- **Authentication:** @convex-dev/auth (Password, Google OAuth, Anonymous providers)
- **Real-time Features:**
  - @convex-dev/presence (user presence tracking)
  - @convex-dev/prosemirror-sync (collaborative editing)
- **HTTP API:** Convex HTTP router
- **User Management:** Invitation system with admin controls

### Development Tools
- **Package Manager:** pnpm (preferred) or npm
- **Linting & Formatting:** Biome 2.3.5 (replaces ESLint + Prettier)
  - Comprehensive linting rules (a11y, security, performance, complexity)
  - Fast formatting with built-in rules
  - Import organization
  - Test file overrides (relaxed rules for tests)
- **Type Checking:** TypeScript 5.7
- **Version Control:** Git

## Codebase Structure

```
nixelo/
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
│   │   ├── PresenceIndicator.tsx # User presence display
│   │   └── AI/                  # AI components (chat, suggestions)
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
│   ├── convex.config.ts         # Convex app configuration
│   ├── ai/                      # Text AI backend (chat, search, suggestions)
│   └── email/                   # Email notification system
│
├── emails/                       # React Email templates
│   ├── _components/             # Shared email components
│   ├── MentionEmail.tsx         # @mention notification
│   ├── AssignmentEmail.tsx      # Assignment notification
│   └── CommentEmail.tsx         # Comment notification
│
├── bot-service/                  # Voice AI - Meeting bot service
│   └── src/                     # Bot implementation
│
├── docs/                         # Feature documentation
│   ├── email/                   # Email system docs
│   │   ├── README.md            # Overview & architecture
│   │   └── SETUP.md             # Provider setup guide
│   └── ai/                      # AI features docs
│       ├── README.md            # AI overview
│       ├── text/                # Text AI (chat, search)
│       │   ├── README.md
│       │   └── SETUP.md
│       └── voice/               # Voice AI (meeting bot)
│           ├── README.md
│           ├── SETUP.md
│           └── ARCHITECTURE.md
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

**calendarEvents**
- Calendar events and meetings
- Fields: title, description, startTime, endTime, eventType (meeting/deadline/other), organizerId, attendeeIds[], isRequired
- Indexes: by_organizer, by_start_time, by_required
- Feature: Attendance tracking for required meetings

**meetingAttendance**
- Attendance records for required meetings
- Fields: eventId, userId, status (present/tardy/absent), markedBy, markedAt, notes
- Indexes: by_event, by_user, by_event_user
- Admin-only: Only event organizers can mark attendance

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
cd nixelo

# Install dependencies (use pnpm)
pnpm install

# Optional: Set up environment variables
# Create .env.local for PostHog analytics
echo "VITE_PUBLIC_POSTHOG_KEY=your_key" > .env.local
echo "VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com" >> .env.local

# Start development server (runs frontend + backend in parallel)
pnpm run dev
# OR run separately:
pnpm run dev:frontend  # Starts Vite on http://localhost:5555
pnpm run dev:backend   # Starts Convex dev server
```

### Available Scripts

```bash
pnpm run dev          # Start both frontend and backend
pnpm run dev:frontend # Start only Vite dev server
pnpm run dev:backend  # Start only Convex dev server
pnpm run build        # Build for production
pnpm run preview      # Preview production build
pnpm run lint         # Run Biome linting (with auto-fix)
pnpm run lint:check   # Run Biome linting (check only)
pnpm run format       # Run Biome formatting (with auto-fix)
pnpm run format:check # Run Biome formatting (check only)
pnpm run typecheck    # Run TypeScript type checking
pnpm run check        # Run typecheck, lint check, and all tests
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
pnpm run lint       # Run Biome linting and auto-fix issues
# OR use combined check
pnpm run check      # Run typecheck, lint check, and all tests
```

2. **Biome Configuration (`biome.json`):**
   - Comprehensive linting rules across multiple categories:
     - **Accessibility (a11y)**: ARIA attributes, keyboard navigation, semantic HTML
     - **Security**: Dangerous patterns, innerHTML usage, eval prevention
     - **Performance**: Accumulating spreads, delete operator warnings
     - **Complexity**: Cognitive complexity, useless code detection
     - **Correctness**: React hooks, unused variables, type safety
     - **Style**: Consistent code style, modern JS patterns
   - **Import Organization**: Automatic import sorting and cleanup
   - **Formatter**: Consistent code formatting (replaces Prettier)
   - **Test Overrides**: Relaxed rules for test files (*.test.ts, *.spec.tsx)
   - **Generated Files**: Disabled linting for `convex/_generated/**`

3. **TypeScript Configuration:**
   - Strict mode enabled
   - Path alias `@/*` → `./src/*`
   - Separate configs for app, node, and convex code

4. **Code Patterns to Follow:**
   - Use centralized error handling: `showError(error, "Context")` and `showSuccess("Message")`
   - Use `LoadingSpinner` component instead of custom spinners
   - Extract complex components into smaller, focused modules
   - Keep components under 200 lines when possible
   - Use accessibility attributes (aria-label, role, etc.)

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

2. **Authorization & RBAC (Role-Based Access Control):**
   - **Roles:** admin, editor, viewer
   - **Hierarchy:** viewer < editor < admin
   - **Project creator:** Always has admin role
   - **Permission checks:** Use RBAC utilities from `convex/rbac.ts`

   **RBAC Utilities:**
   ```typescript
   import { assertMinimumRole, getUserRole, canEditProject } from "./rbac";

   // In a mutation/query
   await assertMinimumRole(ctx, projectId, userId, "editor"); // Throws if insufficient
   const role = await getUserRole(ctx, projectId, userId); // Returns role or null
   const canEdit = await canEditProject(ctx, projectId, userId); // Boolean
   ```

   **Role Permissions:**
   - **Viewer:** Read-only access, can comment
   - **Editor:** Can create/edit/delete issues, sprints, documents
   - **Admin:** Full control - manage settings, members, workflow, delete project

   **Database Tables:**
   - `projectMembers`: Maps users to projects with roles
   - Fields: projectId, userId, role, addedBy, addedAt
   - Indexed by project, user, and project+user combination

   **Member Management:**
   - Use `addMember` mutation with role parameter
   - Use `updateMemberRole` to change roles (admin only)
   - Use `removeMember` to remove members (admin only)
   - Project creator's role cannot be changed

3. **Data Validation:**
   - Use Convex validators (`v.string()`, `v.id()`, etc.)
   - Runtime validation happens automatically
   - TypeScript provides compile-time safety

### Analytics & Metrics

The project includes a comprehensive analytics dashboard for tracking project and team performance.

**Available Analytics:**
- **Project Overview:** Total issues, unassigned count, team velocity
- **Issue Distribution:** By status, type, priority, and assignee
- **Sprint Burndown:** Track sprint progress with ideal vs. actual burndown
- **Team Velocity:** Historical velocity across completed sprints
- **Recent Activity:** Timeline of project activity and changes

**Analytics Queries** (`convex/analytics.ts`):
```typescript
// Get project analytics overview
const analytics = useQuery(api.analytics.getProjectAnalytics, { projectId });

// Get sprint burndown data
const burndown = useQuery(api.analytics.getSprintBurndown, { sprintId });

// Get team velocity history
const velocity = useQuery(api.analytics.getTeamVelocity, { projectId });

// Get recent activity
const activity = useQuery(api.analytics.getRecentActivity, { projectId, limit: 10 });
```

**Accessing the Dashboard:**
- Navigate to a project
- Click the "📊 Analytics" tab
- View charts, metrics, and team performance

**Metrics Calculated:**
- **Story Points:** Uses `estimatedHours` field as story points
- **Completion:** Issues in "done" category workflow states
- **Velocity:** Average points completed per sprint
- **Burndown:** Ideal vs. actual progress over sprint duration

### Email Notifications

Multi-provider email notification system with user preferences.

**Features:**
- Provider rotation (Resend, SendPulse, Mailgun, SendGrid)
- React Email templates for consistent branding
- User notification preferences
- Automatic triggers on mentions, assignments, comments

**Documentation:** See [docs/email/](./docs/email/) for full documentation.

**Quick Usage:**
```typescript
import { sendEmail } from "./email";

await sendEmail({
  to: "user@example.com",
  subject: "Notification",
  html: "<p>Hello!</p>",
});
```

### AI Features

Nixelo includes two AI systems:

#### Text AI (Project Assistant)

Intelligent text-based assistance for project management.

**Features:**
- AI Chat - Ask questions about projects in natural language
- Semantic Search - Find issues by meaning using vector embeddings
- Duplicate Detection - Prevent duplicate issues before creation
- AI Suggestions - Generate descriptions, priority, labels

**Documentation:** See [docs/ai/text/](./docs/ai/text/) for full documentation.

**Quick Usage:**
```typescript
// Semantic search
const results = await searchSimilarIssues({
  query: "login button not working",
  projectId,
});

// AI suggestions
const description = await suggestIssueDescription({
  title: "Add dark mode",
  type: "task",
  projectId,
});
```

#### Voice AI (Meeting Bot)

Automated meeting recording, transcription, and summarization.

**Features:**
- Automatic meeting joining (Google Meet, Zoom planned)
- Multi-provider transcription (Whisper, Google, Azure, etc.)
- AI summarization with Claude
- Action item extraction

**Documentation:** See [docs/ai/voice/](./docs/ai/voice/) for full documentation.

**Quick Usage:**
```typescript
// Schedule a recording
await scheduleRecording({
  eventId: "calendar-event-id",
  meetingUrl: "https://meet.google.com/xxx-yyyy-zzz",
  platform: "google_meet",
});
```

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

Nixelo uses a comprehensive testing strategy with three layers.

**Full documentation:** [docs/testing/](./docs/testing/)

### Testing Stack

| Layer | Framework | Location | Purpose |
|-------|-----------|----------|---------|
| **Unit Tests** | Vitest + React Testing Library | `src/**/*.test.ts(x)` | Component & utility testing |
| **Backend Tests** | Vitest + convex-test | `convex/**/*.test.ts` | Convex function testing |
| **E2E Tests** | Playwright | `e2e/**/*.spec.ts` | Full user flow testing |

### Quick Commands

```bash
# Unit tests
pnpm test              # Watch mode
pnpm test:ui           # Interactive UI
pnpm test:coverage     # Coverage report

# Backend tests (requires: npx convex dev)
pnpm test:convex       # Run backend tests
pnpm test:convex:ui    # Interactive UI

# E2E tests
pnpm e2e               # Headless
pnpm e2e:ui            # Interactive UI (recommended)
pnpm e2e:headed        # Visible browser
pnpm e2e:debug         # Debug mode

# All checks (CI)
pnpm run check         # Typecheck + lint + all tests
```

### Selector Strategy

We use accessible selectors following Playwright best practices:

```typescript
// Preferred (accessible selectors)
page.getByRole("button", { name: /submit/i })
page.getByLabel("Email")
page.getByPlaceholder("Enter email")
page.getByText("Sign in")

// Last resort (test IDs)
page.getByTestId("complex-widget")
```

### AI-Assisted Testing (MCP)

Playwright MCP Server is configured at `.claude/mcp.json` for AI-assisted testing with Claude Code.

### Detailed Documentation

- [Testing Overview](./docs/testing/README.md) - Quick start, commands, architecture
- [E2E Testing](./docs/testing/e2e.md) - Playwright, page objects, authentication
- [Unit Testing](./docs/testing/unit.md) - Vitest, React Testing Library, mocking
- [Backend Testing](./docs/testing/backend.md) - convex-test, integration tests

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

### Internal Documentation
- [Testing Overview](./docs/testing/README.md) - Testing strategy, commands, architecture
- [Email System](./docs/email/README.md) - Email notifications setup & usage
- [AI Overview](./docs/ai/README.md) - AI features overview
- [Text AI](./docs/ai/text/README.md) - Chat, search, suggestions
- [Voice AI](./docs/ai/voice/README.md) - Meeting bot, transcription

### External Documentation
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

**Last Updated:** 2025-11-27
**Convex Deployment:** peaceful-salmon-964
**Node Version:** 18+
**Package Manager:** pnpm (preferred)
