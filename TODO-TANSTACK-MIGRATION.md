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

## Phase 1: Preparation (Current PR - Optional)

### 1.1 Audit Current State
- [ ] List all "routes" currently handled in App.tsx
- [ ] List all shared state that actually needs to be shared
- [ ] Identify heavy dependencies (BlockNote, PDF libs, etc.)
- [ ] Document current auth flow

### 1.2 Current Routes Inventory
```
/                    → Landing page (NixeloLanding) - NEEDS SSR
/onboarding          → Onboarding flow - NO SSR
/invite/:token       → Invite acceptance - NO SSR
/* (authenticated)   → Dashboard views - NO SSR
  - dashboard
  - documents
  - projects
  - calendar
  - settings
  - admin
```

### 1.3 Shared State Audit
Identify what actually needs to be shared vs what can live in components:

| State | Currently | Should Be |
|-------|-----------|-----------|
| `activeView` | App.tsx | URL (route) |
| `selectedProjectId` | App.tsx | URL param or component |
| `selectedDocumentId` | App.tsx | URL param or component |
| `showCommandPalette` | App.tsx | Component or context |
| `showAIAssistant` | App.tsx | Component or context |
| `isMobileSidebarOpen` | App.tsx | Component |
| `showWelcomeTour` | App.tsx | Component |
| etc. | | |

---

## Phase 2: Install & Configure TanStack Start

### 2.1 Install Dependencies
```bash
pnpm add @tanstack/react-router @tanstack/start vinxi
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
├── routes/                    # NEW - file-based routing
│   ├── __root.tsx            # Root layout (providers, html shell)
│   ├── index.tsx             # / (landing page, SSR)
│   ├── pricing.tsx           # /pricing (SSR)
│   ├── onboarding.tsx        # /onboarding (no SSR)
│   ├── invite.$token.tsx     # /invite/:token (no SSR)
│   └── _dashboard/           # Layout group for dashboard
│       ├── route.tsx         # Dashboard layout wrapper
│       ├── index.tsx         # /dashboard
│       ├── projects/
│       │   ├── index.tsx     # /projects
│       │   └── $id.tsx       # /projects/:id
│       ├── documents/
│       │   ├── index.tsx     # /documents
│       │   └── $id.tsx       # /documents/:id
│       ├── calendar.tsx      # /calendar
│       ├── settings.tsx      # /settings
│       └── admin.tsx         # /admin
├── components/               # Stays the same
├── contexts/                 # NEW - for truly shared state
├── hooks/                    # Stays the same
├── lib/                      # Stays the same
└── styles/                   # Stays the same
```

---

## Phase 3: Create Route Files

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

### 3.3 Dashboard Layout - No SSR (`routes/_dashboard/route.tsx`)
```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/DashboardLayout'

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayoutWrapper,
  ssr: false, // Disable SSR for dashboard
})

function DashboardLayoutWrapper() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
```

### 3.4 Project Page with Params (`routes/_dashboard/projects/$id.tsx`)
```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/projects/$id')({
  component: ProjectPage,
})

function ProjectPage() {
  const { id } = Route.useParams() // Type-safe!
  // id is string, not string | undefined

  return <ProjectBoard projectId={id} />
}
```

---

## Phase 4: State Management Refactor

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

## Phase 5: Migrate Components

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

## Phase 8: Cleanup

### 8.1 Delete Old Files
- [ ] `src/App.tsx` (replaced by routes)
- [ ] Manual route parsing hooks
- [ ] Prop-drilling components

### 8.2 Update Imports
- [ ] Update all `import { Link }` to use TanStack Router
- [ ] Update all `window.location` usage
- [ ] Update all `history.pushState` usage

### 8.3 Documentation
- [ ] Update README with new dev commands
- [ ] Update CLAUDE.md with new architecture
- [ ] Document route structure

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
