# TanStack Start Migration Plan

> **Goal**: Migrate from Vite + manual routing to TanStack Start for SSR on marketing pages and clean routing architecture.

## Why This Migration?

### Current Problems
1. **App.tsx is 600+ lines** with manual `window.location` routing
2. **20+ useState hooks** in parent, passed as props to children
3. **No SSR** - bad for SEO on landing/marketing pages
4. **No code splitting** - dashboard code loads on landing page
5. **Prop drilling nightmare** - MainAppLayout receives 20+ props

### What TanStack Start Gives Us
1. **File-based routing** - routes defined by folder structure
2. **SSR where needed** - landing, pricing, blog (SEO)
3. **SPA where needed** - dashboard (disable SSR per route)
4. **Automatic code splitting** - heavy libs only load on routes that use them
5. **Type-safe routing** - params, search params fully typed
6. **Nested layouts** - `<Outlet />` pattern like React Router
7. **Still Vite** - same build tool under the hood

---

## Phase 1: Preparation ✅ COMPLETED

### 1.1 Audit Current State
- [x] List all "routes" currently handled in App.tsx
- [x] List all shared state that actually needs to be shared
- [x] Identify heavy dependencies (BlockNote, PDF libs, etc.)
- [x] Document current auth flow

### 1.2 Current Routes (Before Migration)
```
/                    → Landing page (NixeloLanding)
/onboarding          → Onboarding flow
/invite/:token       → Invite acceptance
/* (authenticated)   → Dashboard views (flat, state-based)
  - dashboard, documents, projects, calendar, settings, timesheet
```

### 1.3 New Route Structure (Jira/Linear-inspired)
```
# Marketing (SSR for SEO)
/                           → Landing page
/pricing                    → Pricing page (future)
/blog                       → Blog (future)

# Auth
/onboarding                 → Onboarding flow
/invite/:token              → Invite acceptance

# Dashboard (authenticated, no SSR)
/dashboard                  → Overview (assigned issues, recent activity)
/inbox                      → Notifications, mentions (future)

# Documents (global, Notion-style)
/documents                  → All documents list
/documents/:id              → Document editor (BlockNote)

# Projects (Jira-style, everything nested)
/projects                   → All projects list
/projects/:key              → Project overview → redirects to board
/projects/:key/board        → Kanban board (default view)
/projects/:key/backlog      → Backlog view (future)
/projects/:key/timeline     → Timeline/roadmap (future)
/projects/:key/calendar     → Project calendar & meetings
/projects/:key/timesheet    → Project time tracking
/projects/:key/settings     → Project settings
/projects/:key/analytics    → Project analytics (future)

# Issues (direct access like Jira's /browse/)
/issues/:key                → Issue detail (e.g., /issues/PROJ-123)

# Settings (global)
/settings                   → User settings
/settings/profile           → Profile
/settings/notifications     → Notification preferences
/settings/integrations      → Connected apps (future)

# Admin
/admin                      → Admin dashboard
/admin/users                → User management
/admin/invites              → Invite management
```

**Key Changes from Current:**
1. **Project-scoped views** - Calendar, timesheet under `/projects/:key/`
2. **Project key in URL** - Use `PROJ` not UUID (like Jira)
3. **Direct issue access** - `/issues/PROJ-123` for shareable links
4. **Documents stay global** - Can link to projects but exist independently
5. **Nested settings** - `/settings/profile`, `/settings/notifications`

### 1.4 Shared State Audit
**Move to URL (routes/params):**
| State | Currently | Should Be |
|-------|-----------|-----------|
| `activeView` | App.tsx useState | URL path (route) |
| `selectedProjectId` | App.tsx useState | URL param `/projects/:id` |
| `selectedDocumentId` | App.tsx useState | URL param `/documents/:id` |

**Keep in Context (truly shared across routes):**
| State | Why Context |
|-------|-------------|
| `showCommandPalette` | Triggered by keyboard shortcut from anywhere |
| `showAIAssistant` | Floating button visible on all dashboard routes |
| `showShortcutsHelp` | Modal triggered from anywhere |

**Move to Local Component State:**
| State | Why Local |
|-------|-----------|
| `isMobileSidebarOpen` | Only used in MainAppLayout |
| `showWelcomeTour` | Only used during onboarding |
| `showProjectWizard` | Only used during onboarding |
| `showSampleProjectModal` | Only used during onboarding |

### 1.5 Heavy Dependencies (Lazy Loaded)
| Chunk | Size (gzip) | Used On |
|-------|-------------|---------|
| `editor` (BlockNote) | 170 KB | `/documents/:id` only |
| `mantine` | 36 KB | `/documents/:id` (editor UI) |
| `markdown` | 53 KB | Issue descriptions, comments |
| `analytics` | 53 KB | Deferred load |
| `tour` (driver.js) | 6 KB | Onboarding only |

### 1.6 Current Auth Flow
```
1. User visits /
2. Convex checks auth state
3. If authenticated:
   - Check onboardingStatus
   - If no record → redirect to /onboarding
   - If completed → show dashboard
4. If unauthenticated:
   - Show NixeloLanding (needs SSR for SEO)
5. Special: /invite/:token
   - Shows invite details
   - If unauthenticated → shows SignInForm inline
   - If authenticated → shows Accept button
```

---

## Phase 2: Install & Configure TanStack Start ✅ COMPLETED

### 2.1 Install Dependencies ✅ DONE
```bash
# Updated packages (post-Vinxi migration):
pnpm add @tanstack/react-router @tanstack/react-start
pnpm add -D @tanstack/router-plugin @tanstack/router-devtools
```

### 2.2 Update Configuration Files

#### package.json scripts
```json
{
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start"
  }
}
```

#### app.config.ts (new file)
```ts
import { defineConfig } from '@tanstack/start/config'

export default defineConfig({
  server: {
    preset: 'vercel', // or 'node', 'cloudflare', etc.
  },
})
```

#### tsconfig.json updates
```json
{
  "compilerOptions": {
    "types": ["vinxi/types/client"]
  }
}
```

### 2.3 File Structure Migration
```
src/
├── routes/                           # NEW - file-based routing
│   ├── __root.tsx                   # Root layout (providers, html shell)
│   │
│   │   # Marketing (SSR enabled)
│   ├── index.tsx                    # / (landing page)
│   ├── pricing.tsx                  # /pricing (future)
│   │
│   │   # Auth flows
│   ├── onboarding.tsx               # /onboarding
│   ├── invite.$token.tsx            # /invite/:token
│   │
│   │   # App (authenticated, no SSR)
│   └── _app/                        # Layout group (underscore = no URL segment)
│       ├── route.tsx                # App shell (sidebar, header, auth check)
│       │
│       │   # Dashboard
│       ├── dashboard.tsx            # /dashboard
│       │
│       │   # Documents (global)
│       ├── documents/
│       │   ├── index.tsx            # /documents
│       │   └── $id.tsx              # /documents/:id (BlockNote editor)
│       │
│       │   # Projects (Jira-style nested)
│       ├── projects/
│       │   ├── index.tsx            # /projects (list all)
│       │   └── $key/                # /projects/:key (project layout)
│       │       ├── route.tsx        # Project layout (tabs, project header)
│       │       ├── index.tsx        # /projects/:key → redirect to board
│       │       ├── board.tsx        # /projects/:key/board
│       │       ├── backlog.tsx      # /projects/:key/backlog (future)
│       │       ├── calendar.tsx     # /projects/:key/calendar
│       │       ├── timesheet.tsx    # /projects/:key/timesheet
│       │       ├── analytics.tsx    # /projects/:key/analytics (future)
│       │       └── settings.tsx     # /projects/:key/settings
│       │
│       │   # Direct issue access (like Jira /browse/)
│       ├── issues/
│       │   └── $key.tsx             # /issues/PROJ-123
│       │
│       │   # Settings (nested)
│       ├── settings/
│       │   ├── index.tsx            # /settings (redirect to profile)
│       │   ├── profile.tsx          # /settings/profile
│       │   └── notifications.tsx    # /settings/notifications
│       │
│       │   # Admin
│       └── admin/
│           ├── index.tsx            # /admin
│           ├── users.tsx            # /admin/users
│           └── invites.tsx          # /admin/invites
│
├── components/                      # Stays the same
├── contexts/                        # Shared state (CommandPalette, AI, etc.)
├── hooks/                           # Stays the same
├── lib/                             # Stays the same
└── styles/                          # Stays the same
```

**TanStack Router Naming Conventions:**
- `__root.tsx` - Root layout (wraps everything)
- `_app/` - Pathless layout group (underscore prefix = no URL segment)
- `$key` - Dynamic param (like `:key` in other routers)
- `route.tsx` - Layout file for a directory
- `index.tsx` - Index route for a directory

---

## Phase 3: Create Route Files ✅ COMPLETED

**All routes implemented:**
- [x] `__root.tsx` - Root layout with providers, SSR-safe Convex initialization
- [x] `index.tsx` - Landing page (SSR enabled)
- [x] `onboarding.tsx` - Onboarding flow (SSR disabled)
- [x] `invite.$token.tsx` - Invite acceptance
- [x] `_app/route.tsx` - Auth-protected layout (SSR disabled)
- [x] `_app/dashboard.tsx` - Dashboard
- [x] `_app/documents/index.tsx` - Documents list
- [x] `_app/documents/$id.tsx` - Document editor (lazy loaded)
- [x] `_app/projects/index.tsx` - Projects list
- [x] `_app/projects/$key/route.tsx` - Project layout with tabs
- [x] `_app/projects/$key/index.tsx` - Project index (redirects to board)
- [x] `_app/projects/$key/board.tsx` - Kanban board
- [x] `_app/projects/$key/calendar.tsx` - Project calendar
- [x] `_app/projects/$key/timesheet.tsx` - Project timesheet
- [x] `_app/projects/$key/settings.tsx` - Project settings
- [x] `_app/issues/$key.tsx` - Issue detail page
- [x] `_app/settings/index.tsx` - Settings (redirects to profile)
- [x] `_app/settings/profile.tsx` - Profile settings

**Navigation components updated:**
- [x] `Sidebar.tsx` - Uses TanStack Router `<Link>` and `useNavigate()`
- [x] `ProjectSidebar.tsx` - Uses TanStack Router `<Link>` and `useNavigate()`

### 3.1 Root Layout (`routes/__root.tsx`)
```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ConvexAuthProvider client={convex}>
          <Outlet />
          <Toaster />
        </ConvexAuthProvider>
      </body>
    </html>
  )
}
```

### 3.2 Landing Page with SSR (`routes/index.tsx`)
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { NixeloLanding } from '@/components/NixeloLanding'

export const Route = createFileRoute('/')({
  component: LandingPage,
  // SSR enabled by default for SEO
})

function LandingPage() {
  return <NixeloLanding />
}
```

### 3.3 App Layout - No SSR (`routes/_app/route.tsx`)
```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    // Auth check - redirect to landing if not authenticated
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
    // Onboarding check
    if (!context.auth.onboardingCompleted) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: AppLayout,
  ssr: false, // Disable SSR for entire app section
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
```

### 3.4 Project Layout (`routes/_app/projects/$key/route.tsx`)
```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { ProjectHeader } from '@/components/ProjectHeader'
import { ProjectTabs } from '@/components/ProjectTabs'

export const Route = createFileRoute('/_app/projects/$key')({
  component: ProjectLayout,
})

function ProjectLayout() {
  const { key } = Route.useParams() // Type-safe! e.g., "PROJ"
  const project = useQuery(api.projects.getByKey, { key })

  if (!project) return <ProjectNotFound />

  return (
    <div className="flex flex-col h-full">
      <ProjectHeader project={project} />
      <ProjectTabs projectKey={key} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
```

### 3.5 Project Board (`routes/_app/projects/$key/board.tsx`)
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { ProjectBoard } from '@/components/ProjectBoard'

export const Route = createFileRoute('/_app/projects/$key/board')({
  component: BoardPage,
})

function BoardPage() {
  const { key } = Route.useParams()
  return <ProjectBoard projectKey={key} />
}
```

### 3.6 Issue Detail (`routes/_app/issues/$key.tsx`)
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { IssueDetailPanel } from '@/components/IssueDetailPanel'

export const Route = createFileRoute('/_app/issues/$key')({
  component: IssuePage,
})

function IssuePage() {
  const { key } = Route.useParams() // e.g., "PROJ-123"
  // Parse project key and issue number
  const [projectKey, issueNum] = key.split('-')

  return <IssueDetailPanel projectKey={projectKey} issueNumber={parseInt(issueNum)} />
}
```

---

## Phase 4: State Management Refactor ✅ COMPLETED

State is now managed appropriately:
- Navigation state is in URL (routes/params)
- UI modals (CommandPalette, ShortcutsHelp) are in `_app/route.tsx`
- Local state stays local to components

### 4.1 Move State to Components
Most state should live in the component that uses it:

```tsx
// BEFORE: App.tsx owns everything
function Content() {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  // ... 20 more
  return <MainAppLayout {...allTheProps} />
}

// AFTER: Each component owns its state
function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  return <Sidebar isOpen={isSidebarOpen} />
}

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  return <AIPanel isOpen={isOpen} />
}
```

### 4.2 Create Contexts for Truly Shared State
Only use context for state needed across many unrelated components:

```tsx
// contexts/CommandPaletteContext.tsx
const CommandPaletteContext = createContext<{
  isOpen: boolean
  open: () => void
  close: () => void
} | null>(null)

export function CommandPaletteProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <CommandPaletteContext.Provider value={{
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  )
}

export const useCommandPalette = () => useContext(CommandPaletteContext)
```

### 4.3 Use URL for Navigation State
Replace state with URL params:

```tsx
// BEFORE: state
const [selectedProjectId, setSelectedProjectId] = useState(null)
<ProjectList onSelect={setSelectedProjectId} />

// AFTER: URL
// routes/_dashboard/projects/$id.tsx
const { id } = Route.useParams()
<ProjectList /> // clicking navigates to /projects/:id
```

---

## Phase 5: Migrate Components ✅ COMPLETED

All components updated to use TanStack Router:
- `AppHeader.tsx` - Uses `<Link>` and `useLocation()` for active state
- `CommandPalette.tsx` - Uses `useNavigate()` internally
- `Dashboard.tsx` - Uses `useNavigate()` for project navigation
- `MyIssuesList.tsx` / `ProjectsList.tsx` - Accept callbacks from parent
- `Sidebar.tsx` / `ProjectSidebar.tsx` - Use `<Link>` and `useNavigate()`
- `keyboardShortcuts.ts` - Uses `navigate()` callback

Deleted legacy files:
- `src/App.tsx` - Replaced by routes
- `src/main.tsx` - Replaced by `__root.tsx`
- `src/hooks/useAppState.ts` - No longer needed
- `src/utils/viewHelpers.ts` - No longer needed

### 5.1 Components to Update

| Component | Changes Needed |
|-----------|----------------|
| `App.tsx` | Delete entirely, replaced by routes |
| `MainAppLayout` | Becomes `DashboardLayout`, no props |
| `Sidebar` | Uses `useParams()` instead of props |
| `ProjectSidebar` | Uses `useParams()` instead of props |
| `AppHeader` | Uses `useNavigate()` instead of callbacks |
| `NixeloLanding` | Stays mostly the same |
| `OnboardingPage` | Stays mostly the same |
| `InviteAcceptPage` | Uses route params |

### 5.2 Navigation Changes
```tsx
// BEFORE: callback props
<Button onClick={() => setActiveView('projects')}>Projects</Button>

// AFTER: links
import { Link } from '@tanstack/react-router'
<Link to="/projects">Projects</Link>

// Or programmatic
import { useNavigate } from '@tanstack/react-router'
const navigate = useNavigate()
navigate({ to: '/projects/$id', params: { id: '123' } })
```

---

## Phase 6: Auth Integration

### 6.1 Protected Routes
```tsx
// routes/_dashboard/route.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: DashboardLayout,
  ssr: false,
})
```

### 6.2 Auth Context in Router
```tsx
// routes/__root.tsx
export const Route = createRootRoute({
  beforeLoad: async () => {
    // Get auth state from Convex
    const auth = await getAuthState()
    return { auth }
  },
  component: RootLayout,
})
```

---

## Phase 7: Testing & Verification

### 7.1 Bundle Size Check
```bash
pnpm build

# Verify chunks are separate:
# - Landing page bundle should NOT include dashboard code
# - Dashboard bundle should NOT include BlockNote until editor route
# - PDF libs should only load on routes that use them
```

### 7.2 SSR Verification
```bash
# Check landing page HTML
curl https://nixelo.com/ | grep "<title>"

# Should see full HTML, not empty div
# Meta tags should be present for SEO
```

### 7.3 Lighthouse Audit
- [ ] Landing page: Performance 90+, SEO 100
- [ ] Dashboard: Performance 80+ (after hydration)

### 7.4 Functionality Testing
- [ ] Landing page loads without JS (SSR working)
- [ ] Auth flow works (login, signup, logout)
- [ ] Onboarding flow works
- [ ] Invite acceptance works
- [ ] Dashboard navigation works
- [ ] Deep links work (refresh on /projects/123)
- [ ] Command palette works (keyboard shortcut)
- [ ] Mobile responsive

---

## Phase 8: Cleanup ✅ COMPLETED

### 8.1 Delete Old Files ✅ DONE
- [x] `src/App.tsx` - Deleted
- [x] `src/main.tsx` - Deleted
- [x] `src/hooks/useAppState.ts` - Deleted
- [x] `src/utils/viewHelpers.ts` - Deleted

### 8.2 Update Imports ✅ DONE
- [x] All navigation uses TanStack Router `<Link>` and `useNavigate()`
- [x] `window.location` usage reviewed - only `reload()` for error recovery (appropriate)
- [x] No `history.pushState` usage found

### 8.3 Documentation
- [x] TODO-TANSTACK-MIGRATION.md updated with completion status
- [ ] Update CLAUDE.md with new routing architecture (if needed)

---

## Migration Order (Recommended)

1. **Phase 2** - Install & configure (1 day)
2. **Phase 3.1-3.2** - Root + Landing only (1 day)
3. **Verify SSR works** - Deploy, test SEO
4. **Phase 3.3-3.4** - Dashboard routes (2 days)
5. **Phase 4** - State refactor (2 days)
6. **Phase 5** - Component updates (2 days)
7. **Phase 6** - Auth integration (1 day)
8. **Phase 7-8** - Testing & cleanup (1 day)

**Total estimate: 1-2 weeks**

---

## Rollback Plan

If migration fails:
1. Keep `main` branch unchanged until fully tested
2. Migration happens in `feature/tanstack-migration` branch
3. Can always revert to current Vite setup

---

## Resources

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
- [SSR Guide](https://tanstack.com/start/latest/docs/framework/react/guide/ssr)
- [Convex + TanStack](https://docs.convex.dev/client/tanstack)

---

## Questions to Resolve Before Starting

1. **Hosting**: Where will SSR run? (Vercel, Cloudflare, Node server?)
2. **Domain**: Single domain or split (app.nixelo.com)?
3. **Timeline**: When do we need SEO working?
4. **Analytics**: Does PostHog need SSR-specific setup?
