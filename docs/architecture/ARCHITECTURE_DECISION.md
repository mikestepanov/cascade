# Architecture Decision: Option B Implementation

> **STATUS: PROPOSAL** - This document describes a planned architectural change that has been partially implemented. The current codebase is in a transitional state between the "current" and "target" designs described below. Consult the actual schema (`convex/schema.ts`) and routes (`src/config/routes.ts`) for the ground truth.

**Date**: 2025-12-16
**Decision**: Implement Linear-style architecture (Organization → Workspaces → Teams → Projects)

---

## 🎯 Current State vs Target State

### CURRENT (Confused State)
```
Company
  └── "Workspaces" (actually projects)
       ├── Issues
       ├── Sprints
       ├── Documents
       └── Board (hardcoded per workspace)

Routes:
/:company/workspaces/:key/board
/:company/workspaces/:key/calendar
/:company/issues/:key
```

### TARGET (Option B - Linear Model)
```
Company
  └── Workspaces (departments)
       └── Teams (small groups)
            └── Projects (initiatives)
                 └── Issues (tasks)

Routes:
/:company/workspaces/:workspaceSlug/teams/:teamSlug/issues
/:company/workspaces/:workspaceSlug/teams/:teamSlug/projects/:key/board
/:company/issues/:key (direct access)
```

---

## 📊 Visual Hierarchy

### Current Structure (What Exists Now)
```
┌─────────────────────────────────────┐
│ COMPANY: Acme Corp                  │
│ - slug: "acme-corp"                 │
│ - Users, Teams (unused)             │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│ WORKSPACE*  │  │ WORKSPACE*  │
│ "Marketing" │  │ "Website"   │
│ key: "MKT"  │  │ key: "WEB"  │
├─────────────┤  ├─────────────┤
│ • Issues    │  │ • Issues    │
│ • Sprints   │  │ • Sprints   │
│ • Documents │  │ • Documents │
│ • Members   │  │ • Members   │
│ • Board     │  │ • Board     │
└─────────────┘  └─────────────┘

* Called "workspace" but actually behaves like a project!

Current URL: /acme-corp/workspaces/MKT/board
Current DB:  workspaces.key = "MKT"
```

### Target Structure (Option B)
```
┌─────────────────────────────────────────────────┐
│ COMPANY: Acme Corp                              │
│ - slug: "acme-corp"                             │
│ - Users, Billing                                │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼───────┐  ┌─────▼────────┐
│ WORKSPACE    │  │ WORKSPACE    │
│ "Engineering"│  │ "Marketing"  │
│ slug: "eng"  │  │ slug: "mkt"  │
└──────┬───────┘  └──────────────┘
       │
   ┌───┴────┬─────────┐
   │        │         │
┌──▼──┐ ┌──▼──┐ ┌────▼───┐
│TEAM │ │TEAM │ │ TEAM   │
│"FE" │ │"BE" │ │"DevOps"│
└──┬──┘ └─────┘ └────────┘
   │
   ├────────┬─────────┐
   │        │         │
┌──▼───┐ ┌─▼────┐ ┌──▼────┐
│PROJ  │ │PROJ  │ │ PROJ  │
│"Auth"│ │"UI"  │ │"Infra"│
│ MKT  │ │ WEB  │ │ DEV   │
└──┬───┘ └──────┘ └───────┘
   │
   └──► Issues

Target URL: /acme-corp/eng/fe/projects/MKT/board
Target DB:  projects.key = "MKT"
           projects.teamId = team._id
           projects.workspaceId = workspace._id
```

---

## 🔄 Database Schema Changes

### Tables to Add:
```typescript
// NEW: Department-level workspaces
workspaces: {
  name: "Engineering",
  slug: "eng",
  companyId: Id<"companies">,
}

// ENHANCED: Teams with workspace relationship
teams: {
  name: "Frontend",
  slug: "fe",
  workspaceId: Id<"workspaces">,  // NEW
  companyId: Id<"companies">,
}

// NEW: Team membership
teamMembers: {
  teamId: Id<"teams">,
  userId: Id<"users">,
  role: "lead" | "member",
}
```

### Tables to Rename:
```typescript
// Current "workspaces" → Becomes "projects"
workspaces → projects: {
  name: "Marketing Campaign",
  key: "MKT",
  workspaceId: Id<"workspaces">,  // NEW
  teamId: Id<"teams">,            // NEW
  companyId: Id<"companies">,     // EXISTS
}
```

### Tables to Update:
```typescript
// Issues now belong to teams primarily
issues: {
  teamId: Id<"teams">,             // NEW - primary owner
  projectId?: Id<"projects">,      // OPTIONAL - can be unassigned
  workspaceId: Id<"workspaces">,   // NEW - denormalized
  companyId: Id<"companies">,      // NEW - denormalized
}
```

---

## 🛣️ URL Structure Changes

### BEFORE:
```
/:company/workspaces                    # List "workspaces" (actually projects)
/:company/workspaces/:key/board         # Board for workspace "MKT"
/:company/workspaces/:key/calendar      # Calendar
/:company/issues/:key                   # Direct issue access
```

### AFTER:
```
/:company/workspaces                    # List workspaces (departments)

/:company/workspaces/:workspace         # Workspace home
/:company/workspaces/:workspace/teams   # Teams in workspace

/:company/workspaces/:workspace/teams/:team                    # Team home
/:company/workspaces/:workspace/teams/:team/issues             # Team board (ALL team issues)
/:company/workspaces/:workspace/teams/:team/backlog            # Team backlog
/:company/workspaces/:workspace/teams/:team/calendar           # Team calendar

/:company/workspaces/:workspace/teams/:team/projects           # Team's projects
/:company/workspaces/:workspace/teams/:team/projects/:key      # Project home
/:company/workspaces/:workspace/teams/:team/projects/:key/board     # Project board (filtered)
/:company/workspaces/:workspace/teams/:team/projects/:key/calendar  # Project calendar
/:company/workspaces/:workspace/teams/:team/projects/:key/settings  # Project settings

/:company/issues/:key                   # Direct issue access (unchanged)
```

### URL Examples:
```
Current:  /acme-corp/workspaces/MKT/board
Target:   /acme-corp/eng/frontend/projects/MKT/board

Current:  /acme-corp/workspaces/WEB/calendar
Target:   /acme-corp/mkt/growth/projects/WEB/calendar

Direct:   /acme-corp/issues/MKT-123 (stays the same)
```

---

## 📁 File Structure Changes

### BEFORE:
```
src/routes/_auth/_app/$companySlug/
  ├── workspaces/
  │   ├── index.tsx                    # List workspaces
  │   └── $key/
  │       ├── board.tsx                # Board view
  │       ├── calendar.tsx             # Calendar view
  │       └── settings.tsx             # Settings
  └── issues/
      └── $key.tsx                     # Issue detail
```

### AFTER:
```
src/routes/_auth/_app/$companySlug/
  ├── workspaces/
  │   ├── index.tsx                    # List workspaces (departments)
  │   └── $workspaceSlug/
  │       ├── index.tsx                # Workspace home
  │       ├── settings.tsx             # Workspace settings
  │       └── teams/
  │           ├── index.tsx            # List teams
  │           └── $teamSlug/
  │               ├── index.tsx        # Team home (→ issues)
  │               ├── issues.tsx       # Team board (ALL issues)
  │               ├── backlog.tsx      # Team backlog
  │               ├── calendar.tsx     # Team calendar
  │               ├── settings.tsx     # Team settings
  │               └── projects/
  │                   ├── index.tsx    # List projects
  │                   └── $key/
  │                       ├── index.tsx      # Project home
  │                       ├── board.tsx      # Project board
  │                       ├── calendar.tsx   # Project calendar
  │                       ├── timesheet.tsx  # Project timesheet
  │                       └── settings.tsx   # Project settings
  └── issues/
      └── $key.tsx                     # Issue detail (unchanged)
```

---

## 🎯 Key Concepts

### Workspace (Department Level)
- **Purpose**: Group teams by department
- **Example**: Engineering, Marketing, Product, Sales
- **Features**:
  - Workspace settings
  - Workspace-level analytics
  - Department-wide visibility

### Team (Small Group)
- **Purpose**: 5-20 people working together
- **Example**: Frontend Team, Backend Team, Growth Team
- **Features**:
  - Team board (all team issues)
  - Team velocity tracking
  - Team-specific workflows
  - Cycles/sprints

### Project (Initiative)
- **Purpose**: Specific deliverable or initiative
- **Example**: "Dashboard Redesign", "API v2", "Mobile App"
- **Features**:
  - Project board (filtered view)
  - Project timeline
  - Project-specific settings
  - Optional (issues can exist without project)

### Issue (Task)
- **Belongs to**: Team (required), Project (optional)
- **Key**: Generated from team or project (e.g., "FE-123" or "MKT-456")

---

## 🚀 Migration Strategy

### Phase Order:
1. **Add workspace layer** (new department-level workspaces)
2. **Rename current workspaces → projects**
3. **Strengthen teams** (full team functionality)
4. **Update all routes** (new URL structure)
5. **Migrate data** (assign default workspaces/teams)
6. **Test everything**

### Data Migration:
For each company:
1. Create "General" workspace (default)
2. Create "General Team" (default)
3. Convert old workspaces → projects
4. Assign projects to default team
5. Update all issues with team/workspace/project IDs

---

## 📊 Comparison to Other Tools

| Feature | Current | Option B | Jira | Linear |
|---------|---------|----------|------|--------|
| Top Level | Company | Company | Site | Organization |
| Layer 2 | Workspace* | Workspace | Project | Workspace |
| Layer 3 | - | Team | - | Team |
| Layer 4 | - | Project | - | Project |
| Issue Owner | Workspace | Team | Project | Team |
| Flexible Boards | ❌ | ✅ | ✅ | ✅ |

*Current "workspace" is actually a project

---

## ✅ Benefits of Option B

1. **Scales Better**: Works for 10 people or 10,000 people
2. **Clear Ownership**: Teams own issues, projects are optional grouping
3. **Department Isolation**: Engineering workspace separate from Marketing
4. **Team Autonomy**: Each team has their own board, settings, workflow
5. **Flexible Views**: Team boards, project boards, cross-team boards
6. **Industry Standard**: Matches Linear (modern PM tool)
7. **Future-Proof**: Can add workspace-level features (OKRs, budgets, etc.)

---

## 🎯 Next Steps

1. **Review this document** - Make sure architecture is clear
2. **Execute migration plan** - Follow MIGRATION_PLAN_OPTION_B.md
3. **Update documentation** - CLAUDE.md, README.md
4. **Build UI** - Workspace/team/project pages
5. **Test thoroughly** - All levels of hierarchy

---

**Questions?**
- Is the hierarchy clear?
- Do the URLs make sense?
- Any concerns about complexity?
