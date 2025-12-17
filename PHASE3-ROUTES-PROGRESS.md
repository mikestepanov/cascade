# Phase 3 Progress: Route Structure Update

**Date**: 2024-12-17  
**Status**: In Progress

---

## ✅ Completed

### Route Constants Updated (`src/config/routes.ts`)

**New Hierarchy Routes:**
```typescript
ROUTES.workspaces.list(companySlug)
ROUTES.workspaces.detail(companySlug, workspaceSlug)
ROUTES.workspaces.board(companySlug, workspaceSlug)              // Future
ROUTES.workspaces.wiki(companySlug, workspaceSlug)               // Future
ROUTES.workspaces.settings(companySlug, workspaceSlug)

ROUTES.workspaces.teams.list(companySlug, workspaceSlug)
ROUTES.workspaces.teams.detail(companySlug, workspaceSlug, teamSlug)
ROUTES.workspaces.teams.board(companySlug, workspaceSlug, teamSlug)       // Future
ROUTES.workspaces.teams.backlog(companySlug, workspaceSlug, teamSlug)     // Future
ROUTES.workspaces.teams.wiki(companySlug, workspaceSlug, teamSlug)        // Future
ROUTES.workspaces.teams.calendar(companySlug, workspaceSlug, teamSlug)
ROUTES.workspaces.teams.settings(companySlug, workspaceSlug, teamSlug)

ROUTES.workspaces.teams.projects.list(companySlug, workspaceSlug, teamSlug)
ROUTES.workspaces.teams.projects.board(companySlug, workspaceSlug, teamSlug, projectKey)
ROUTES.workspaces.teams.projects.calendar(companySlug, workspaceSlug, teamSlug, projectKey)
ROUTES.workspaces.teams.projects.timesheet(companySlug, workspaceSlug, teamSlug, projectKey)
ROUTES.workspaces.teams.projects.wiki(companySlug, workspaceSlug, teamSlug, projectKey)    // Future
ROUTES.workspaces.teams.projects.settings(companySlug, workspaceSlug, teamSlug, projectKey)
```

**Legacy Routes (Backward Compatibility):**
```typescript
ROUTES.projects.list(companySlug)                    // /:slug/projects
ROUTES.projects.board(companySlug, projectKey)       // /:slug/projects/:key/board
ROUTES.projects.calendar(companySlug, projectKey)    // /:slug/projects/:key/calendar
ROUTES.projects.timesheet(companySlug, projectKey)   // /:slug/projects/:key/timesheet
ROUTES.projects.settings(companySlug, projectKey)    // /:slug/projects/:key/settings
```

---

## 🚧 Next Steps

### 1. Create New Route Files

Need to create the actual route files in TanStack Router:

```
src/routes/_auth/_app/$companySlug/
├── workspaces/
│   ├── index.tsx                              # List workspaces
│   └── $workspaceSlug/
│       ├── route.tsx                          # Workspace layout
│       ├── index.tsx                          # Workspace home → redirects to teams
│       ├── board.tsx                          # Workspace board (future)
│       ├── wiki.tsx                           # Workspace wiki (future)
│       ├── settings.tsx                       # Workspace settings
│       └── teams/
│           ├── index.tsx                      # List teams
│           └── $teamSlug/
│               ├── route.tsx                  # Team layout
│               ├── index.tsx                  # Team home → redirects to board
│               ├── board.tsx                  # Team board (future)
│               ├── backlog.tsx                # Team backlog (future)
│               ├── wiki.tsx                   # Team wiki (future)
│               ├── calendar.tsx               # Team calendar
│               ├── settings.tsx               # Team settings
│               └── projects/
│                   ├── index.tsx              # List team projects
│                   └── $key/
│                       ├── route.tsx          # Project layout (tabs)
│                       ├── index.tsx          # Project home → redirect to board
│                       ├── board.tsx          # Project board
│                       ├── calendar.tsx       # Project calendar
│                       ├── timesheet.tsx      # Project timesheet
│                       ├── wiki.tsx           # Project wiki (future)
│                       └── settings.tsx       # Project settings
```

### 2. Update Existing Components

Components that need workspace/team context:
- [ ] `AppSidebar.tsx` - Add workspace/team navigation
- [ ] `ProjectBoard.tsx` - Accept workspace/team params
- [ ] `ProjectSettings/` - Update to use new hierarchy
- [ ] `Dashboard.tsx` - Show workspaces instead of direct projects

### 3. Migration Strategy

**Option A: Gradual (Recommended)**
- Keep legacy `/projects/:key` routes working
- Create new workspace/team routes in parallel
- Migrate projects one-by-one to workspaces/teams
- Redirect legacy routes to new structure once migrated

**Option B: Big Bang**
- Create default "General" workspace for all companies
- Create default "General Team" in each workspace
- Assign all existing projects to default team
- Update all routes at once
- Remove legacy routes

### 4. Data Migration

Need migration script to:
- [ ] Create default workspace for each company
- [ ] Create default team in each workspace  
- [ ] Update all projects with workspaceId and teamId
- [ ] Update all issues with workspaceId and teamId
- [ ] Verify data integrity

---

## 📊 URL Examples

### Before (Current):
```
/acme-corp/projects                           # List projects
/acme-corp/projects/MKT/board                 # Marketing project board
/acme-corp/projects/WEB/calendar              # Website project calendar
```

### After (New Hierarchy):
```
/acme-corp/workspaces                                    # List workspaces
/acme-corp/workspaces/engineering                        # Engineering workspace home
/acme-corp/workspaces/engineering/teams                  # List teams
/acme-corp/workspaces/engineering/teams/frontend         # Frontend team home
/acme-corp/workspaces/engineering/teams/frontend/board   # Team board (future)
/acme-corp/workspaces/engineering/teams/frontend/projects                # List projects
/acme-corp/workspaces/engineering/teams/frontend/projects/MKT/board     # Project board
/acme-corp/workspaces/engineering/teams/frontend/projects/WEB/calendar  # Project calendar
```

### Shortcuts (Direct Access):
```
/acme-corp/issues/MKT-123                     # Direct issue access (unchanged)
/acme-corp/projects/MKT/board                 # Legacy project access (redirects to new URL)
```

---

## 🎯 Benefits of New Structure

1. **Clear Hierarchy**: Company → Workspace → Team → Project
2. **Scalable**: Works for 10 or 10,000 people
3. **Flexible Views**: Boards at workspace, team, or project level
4. **Team Ownership**: Issues belong to teams, projects are optional
5. **Department Isolation**: Engineering separate from Marketing
6. **Future-Proof**: Can add workspace-level features (OKRs, budgets)

---

## 📝 Related Documents

- `ARCHITECTURE_DECISION.md` - Full architecture explanation
- `MIGRATION_PLAN_OPTION_B.md` - Complete migration plan
- `TODO.md` - Multi-level views roadmap
- `src/config/routes.ts` - Route constants

---

**Next Action**: Create route files for workspace/team hierarchy
