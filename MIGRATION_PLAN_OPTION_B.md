# Migration Plan: Option B (Linear Model)

**Target Architecture**: Company → Workspaces → Teams → Projects → Issues

**Timeline**: 3-4 weeks (with testing)

**Risk Level**: Medium-High (major schema changes, data migration required)

---

## 📋 Phase Overview

| Phase | Duration | Description | Risk |
|-------|----------|-------------|------|
| **Phase 0** | 2 days | Planning & backup | Low |
| **Phase 1** | 3 days | Add Workspace layer | Medium |
| **Phase 2** | 4 days | Rename current workspaces → projects | High |
| **Phase 3** | 3 days | Strengthen Teams | Medium |
| **Phase 4** | 5 days | Update all UI & routes | Medium |
| **Phase 5** | 3 days | Data migration | High |
| **Phase 6** | 2 days | Testing & validation | Low |

**Total**: ~22 days (with buffer: 4 weeks)

---

## 🎯 Phase 0: Planning & Backup (2 days)

### Goals:
- Full backup of current database
- Document current schema
- Create rollback plan
- Set up staging environment

### Tasks:

#### 1. Backup Current State
```bash
# Export current data
pnpm convex export --path ./backups/pre-migration-$(date +%Y%m%d)

# Git tag current state
git tag -a "pre-option-b-migration" -m "Before Linear model migration"
git push origin pre-option-b-migration

# Document current schema
pnpm convex run migrations/documentCurrentSchema
```

#### 2. Create Migration Branch
```bash
git checkout -b feature/option-b-architecture
```

#### 3. Document Current Structure
- Count: How many companies, workspaces, teams, projects, issues?
- Map: Which teams exist? Which workspaces?
- Users: How many users per workspace?

#### 4. Create Rollback Script
```typescript
// convex/migrations/rollbackOptionB.ts
export const rollback = internalMutation({
  // Script to undo changes if needed
});
```

---

## 🎯 Phase 1: Add Workspace Layer (3 days)

### Goals:
- Add new `workspaces` table (departments)
- Keep existing `workspaces` table as `workspaces_old` temporarily
- No data migration yet

### Schema Changes:

#### 1. Create New Workspaces Table
```typescript
// convex/schema.ts

workspaces: defineTable({
  name: v.string(), // "Engineering", "Marketing", "Product"
  slug: v.string(), // "engineering", "marketing"
  description: v.optional(v.string()),
  icon: v.optional(v.string()), // Emoji or icon
  companyId: v.id("companies"),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  // Settings
  settings: v.optional(v.object({
    defaultProjectVisibility: v.boolean(),
    allowExternalSharing: v.boolean(),
  })),
})
  .index("by_company", ["companyId"])
  .index("by_slug", ["slug"])
  .index("by_company_slug", ["companyId", "slug"])
  .searchIndex("search_name", {
    searchField: "name",
    filterFields: ["companyId"],
  }),
```

#### 2. Rename Current Workspaces (Temporary)
```typescript
// Keep old table temporarily during migration
workspaces_old: defineTable({
  // ... existing workspace definition
  // This will become "projects" in Phase 2
}),
```

#### 3. Add WorkspaceId to Teams
```typescript
teams: defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  
  // NEW: Workspace relationship
  workspaceId: v.id("workspaces"), // Team belongs to workspace
  companyId: v.id("companies"),
  
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_company", ["companyId"])
  .index("by_workspace_slug", ["workspaceId", "slug"]),
```

#### 4. Create Convex Functions
```typescript
// convex/workspaces.ts (NEW - for department-level workspaces)

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check company admin
    const isAdmin = await isCompanyAdmin(ctx, args.companyId, userId);
    if (!isAdmin) throw new Error("Only company admins can create workspaces");
    
    const workspaceId = await ctx.db.insert("workspaces", {
      ...args,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return workspaceId;
  },
});

export const list = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("workspaces")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});
```

#### 5. Deploy Schema
```bash
pnpm convex dev --once
# Verify new tables exist
pnpm convex run migrations/verifyPhase1:check
```

---

## 🎯 Phase 2: Rename Workspaces → Projects (4 days)

### Goals:
- Rename `workspaces_old` → `projects`
- Update all relationships
- Projects now belong to teams

### Schema Changes:

#### 1. Define Projects Table
```typescript
projects: defineTable({
  name: v.string(),
  key: v.string(), // "PROJ", "MKT", "ENG"
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  
  // NEW: Hierarchy
  workspaceId: v.id("workspaces"), // Project belongs to workspace
  teamId: v.optional(v.id("teams")), // Project belongs to team (optional)
  companyId: v.id("companies"), // Denormalized for easy querying
  
  // Ownership
  ownerId: v.id("users"), // Project owner
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  
  // Sharing
  isPublic: v.optional(v.boolean()), // Visible to all workspace members
  
  // Board configuration (keep existing)
  boardType: v.union(v.literal("kanban"), v.literal("scrum")),
  workflowStates: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      category: v.union(
        v.literal("todo"),
        v.literal("inprogress"),
        v.literal("done")
      ),
      order: v.number(),
    })
  ),
  
  // Agency features (keep existing)
  defaultHourlyRate: v.optional(v.number()),
  clientName: v.optional(v.string()),
  budget: v.optional(v.number()),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_team", ["teamId"])
  .index("by_company", ["companyId"])
  .index("by_key", ["key"])
  .index("by_owner", ["ownerId"])
  .index("by_workspace_key", ["workspaceId", "key"])
  .searchIndex("search_name", {
    searchField: "name",
    filterFields: ["companyId", "workspaceId", "teamId", "isPublic"],
  }),

projectMembers: defineTable({
  projectId: v.id("projects"),
  userId: v.id("users"),
  role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  addedBy: v.id("users"),
  addedAt: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_project_user", ["projectId", "userId"]),
```

#### 2. Update Issues Table
```typescript
issues: defineTable({
  // Primary ownership
  teamId: v.id("teams"), // Issues belong to teams FIRST
  projectId: v.optional(v.id("projects")), // Optionally in a project
  workspaceId: v.id("workspaces"), // Denormalized for easy filtering
  companyId: v.id("companies"), // Denormalized
  
  key: v.string(), // "PROJ-123" or "TEAM-456"
  title: v.string(),
  description: v.optional(v.string()),
  // ... rest of fields stay the same
})
  .index("by_team", ["teamId"])
  .index("by_project", ["projectId"])
  .index("by_workspace", ["workspaceId"])
  .index("by_company", ["companyId"])
  .index("by_team_status", ["teamId", "status"])
  .index("by_project_status", ["projectId", "status"])
  // ... other indexes
```

#### 3. Update All Related Tables

Update these tables with new hierarchy:
- `sprints` - Add `teamId`, `workspaceId`
- `documents` - Change `workspaceId` to `projectId` (docs belong to projects)
- `labels` - Add `workspaceId`, keep `projectId`
- `issueTemplates` - Add `workspaceId`, keep `projectId`
- `webhooks` - Add `workspaceId`, keep `projectId`
- `savedFilters` - Add `workspaceId`
- `automationRules` - Add `workspaceId`
- `customFields` - Add `workspaceId`
- `calendarEvents` - Add `workspaceId`, `teamId`
- `timeEntries` - Add `workspaceId`, `teamId`

---

## 🎯 Phase 3: Strengthen Teams (3 days)

### Goals:
- Make teams first-class citizens
- Team membership management
- Team settings and permissions

### Schema Changes:

#### 1. Team Settings
```typescript
teams: defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  
  workspaceId: v.id("workspaces"),
  companyId: v.id("companies"),
  
  // Team lead
  leadId: v.optional(v.id("users")),
  
  // Settings
  settings: v.optional(v.object({
    defaultIssueType: v.string(),
    cycleLength: v.number(), // 1, 2, 3 weeks
    cycleDayOfWeek: v.number(), // 0-6 (Monday = 1)
    defaultEstimate: v.optional(v.number()),
  })),
  
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_workspace", ["workspaceId"])
  .index("by_company", ["companyId"])
  .index("by_lead", ["leadId"])
  .index("by_workspace_slug", ["workspaceId", "slug"])
  .searchIndex("search_name", {
    searchField: "name",
    filterFields: ["workspaceId", "companyId"],
  }),

teamMembers: defineTable({
  teamId: v.id("teams"),
  userId: v.id("users"),
  role: v.union(v.literal("lead"), v.literal("member")),
  addedBy: v.id("users"),
  addedAt: v.number(),
})
  .index("by_team", ["teamId"])
  .index("by_user", ["userId"])
  .index("by_team_user", ["teamId", "userId"]),
```

#### 2. Team Convex Functions
```typescript
// convex/teams.ts (ENHANCE existing)

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    workspaceId: v.id("workspaces"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check workspace admin permission
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    
    const isAdmin = await isWorkspaceAdmin(ctx, args.workspaceId, userId);
    if (!isAdmin) throw new Error("Only workspace admins can create teams");
    
    const teamId = await ctx.db.insert("teams", {
      ...args,
      companyId: workspace.companyId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Add creator as team lead
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "lead",
      addedBy: userId,
      addedAt: Date.now(),
    });
    
    return teamId;
  },
});

export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    // Implementation
  },
});

export const listProjects = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
  },
});
```

---

## 🎯 Phase 4: Update All UI & Routes (5 days)

### Goals:
- Update all routes to new hierarchy
- Update all components
- Update navigation

### Route Structure Changes:

#### Before:
```
/:companySlug/workspaces
/:companySlug/workspaces/:key/board
/:companySlug/issues/:key
```

#### After:
```
/:companySlug/workspaces                           # List workspaces
/:companySlug/workspaces/:workspaceSlug            # Workspace home
/:companySlug/workspaces/:workspaceSlug/teams      # Teams in workspace
/:companySlug/workspaces/:workspaceSlug/teams/:teamSlug                    # Team home
/:companySlug/workspaces/:workspaceSlug/teams/:teamSlug/issues             # Team issues (board view)
/:companySlug/workspaces/:workspaceSlug/teams/:teamSlug/projects           # Team projects
/:companySlug/workspaces/:workspaceSlug/teams/:teamSlug/projects/:key      # Project home
/:companySlug/workspaces/:workspaceSlug/teams/:teamSlug/projects/:key/board     # Project board
/:companySlug/workspaces/:workspaceSlug/teams/:teamSlug/projects/:key/calendar  # Project calendar
/:companySlug/workspaces/:workspaceSlug/teams/:teamSlug/projects/:key/settings  # Project settings
/:companySlug/issues/:key                          # Direct issue access (unchanged)
```

### File Changes:

#### 1. Update routes directory structure
```
src/routes/_auth/_app/$companySlug/
  ├── workspaces/
  │   ├── index.tsx                          # List all workspaces
  │   └── $workspaceSlug/
  │       ├── index.tsx                      # Workspace home
  │       ├── settings.tsx                   # Workspace settings
  │       └── teams/
  │           ├── index.tsx                  # List teams
  │           └── $teamSlug/
  │               ├── index.tsx              # Team home (redirects to issues)
  │               ├── issues.tsx             # Team kanban board
  │               ├── backlog.tsx            # Team backlog
  │               ├── calendar.tsx           # Team calendar
  │               ├── settings.tsx           # Team settings
  │               └── projects/
  │                   ├── index.tsx          # List projects
  │                   └── $key/
  │                       ├── index.tsx      # Project home
  │                       ├── board.tsx      # Project board
  │                       ├── calendar.tsx   # Project calendar
  │                       ├── timesheet.tsx  # Project timesheet
  │                       └── settings.tsx   # Project settings
  └── issues/
      └── $key.tsx                           # Direct issue access
```

#### 2. Update route constants
```typescript
// src/config/routes.ts

export const ROUTES = {
  // ... public routes
  
  workspaces: {
    list: (company: string) => 
      `/${company}/workspaces`,
    
    detail: (company: string, workspaceSlug: string) => 
      `/${company}/workspaces/${workspaceSlug}`,
    
    teams: {
      list: (company: string, workspaceSlug: string) => 
        `/${company}/workspaces/${workspaceSlug}/teams`,
      
      detail: (company: string, workspaceSlug: string, teamSlug: string) => 
        `/${company}/workspaces/${workspaceSlug}/teams/${teamSlug}`,
      
      issues: (company: string, workspaceSlug: string, teamSlug: string) => 
        `/${company}/workspaces/${workspaceSlug}/teams/${teamSlug}/issues`,
      
      projects: {
        list: (company: string, workspaceSlug: string, teamSlug: string) => 
          `/${company}/workspaces/${workspaceSlug}/teams/${teamSlug}/projects`,
        
        board: (company: string, workspaceSlug: string, teamSlug: string, projectKey: string) => 
          `/${company}/workspaces/${workspaceSlug}/teams/${teamSlug}/projects/${projectKey}/board`,
        
        // ... other project views
      },
    },
  },
  
  issues: {
    detail: (company: string, key: string) => 
      `/${company}/issues/${key}`,
  },
};
```

#### 3. Update Components

Rename and update:
- `ProjectBoard.tsx` → Keep name but update to work with projects
- `WorkspaceBoard.tsx` → NEW: Team-level board
- Update all props: `workspaceId` → `teamId` or `projectId`

---

## 🎯 Phase 5: Data Migration (3 days)

### Goals:
- Create default workspaces for each company
- Assign existing "workspaces" as projects
- Create default teams
- Update all relationships

### Migration Script:

```typescript
// convex/migrations/migrateToOptionB.ts

export const checkStatus = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const oldWorkspaces = await ctx.db.query("workspaces_old").collect();
    const teams = await ctx.db.query("teams").collect();
    const newWorkspaces = await ctx.db.query("workspaces").collect();
    
    return {
      companies: companies.length,
      oldWorkspaces: oldWorkspaces.length,
      teams: teams.length,
      newWorkspaces: newWorkspaces.length,
      readyToMigrate: newWorkspaces.length === 0,
    };
  },
});

export const migrate = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting Option B migration...");
    
    const companies = await ctx.db.query("companies").collect();
    const migrationResults = {
      workspacesCreated: 0,
      teamsCreated: 0,
      projectsMigrated: 0,
      issuesUpdated: 0,
    };
    
    for (const company of companies) {
      console.log(`Migrating company: ${company.name}`);
      
      // Step 1: Create default workspace for company
      const workspaceId = await ctx.db.insert("workspaces", {
        name: "General", // Default workspace
        slug: "general",
        description: "Default workspace for all teams",
        companyId: company._id,
        createdBy: company.ownerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      migrationResults.workspacesCreated++;
      
      // Step 2: Create default team
      const teamId = await ctx.db.insert("teams", {
        name: "General Team",
        slug: "general",
        description: "Default team",
        workspaceId,
        companyId: company._id,
        createdBy: company.ownerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      migrationResults.teamsCreated++;
      
      // Step 3: Migrate old workspaces to projects
      const oldWorkspaces = await ctx.db
        .query("workspaces_old")
        .withIndex("by_company", (q) => q.eq("companyId", company._id))
        .collect();
      
      for (const oldWorkspace of oldWorkspaces) {
        // Create project from old workspace
        const projectId = await ctx.db.insert("projects", {
          name: oldWorkspace.name,
          key: oldWorkspace.key,
          description: oldWorkspace.description,
          icon: oldWorkspace.icon,
          workspaceId, // Assign to default workspace
          teamId, // Assign to default team
          companyId: company._id,
          ownerId: oldWorkspace.ownerId,
          createdBy: oldWorkspace.createdBy,
          createdAt: oldWorkspace.createdAt,
          updatedAt: oldWorkspace.updatedAt,
          isPublic: oldWorkspace.isPublic,
          boardType: oldWorkspace.boardType,
          workflowStates: oldWorkspace.workflowStates,
          defaultHourlyRate: oldWorkspace.defaultHourlyRate,
          clientName: oldWorkspace.clientName,
          budget: oldWorkspace.budget,
        });
        migrationResults.projectsMigrated++;
        
        // Step 4: Update issues
        const issues = await ctx.db
          .query("issues")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", oldWorkspace._id as any))
          .collect();
        
        for (const issue of issues) {
          await ctx.db.patch(issue._id, {
            projectId,
            teamId,
            workspaceId,
            companyId: company._id,
          });
          migrationResults.issuesUpdated++;
        }
        
        // Step 5: Migrate members
        const members = await ctx.db
          .query("workspaceMembers")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", oldWorkspace._id as any))
          .collect();
        
        for (const member of members) {
          // Add to project members
          await ctx.db.insert("projectMembers", {
            projectId,
            userId: member.userId,
            role: member.role,
            addedBy: member.addedBy,
            addedAt: member.addedAt,
          });
          
          // Add to team members
          const existingTeamMember = await ctx.db
            .query("teamMembers")
            .withIndex("by_team_user", (q) => 
              q.eq("teamId", teamId).eq("userId", member.userId))
            .first();
          
          if (!existingTeamMember) {
            await ctx.db.insert("teamMembers", {
              teamId,
              userId: member.userId,
              role: member.role === "admin" ? "lead" : "member",
              addedBy: member.addedBy,
              addedAt: member.addedAt,
            });
          }
        }
        
        // Step 6: Update all related entities
        // (sprints, documents, labels, etc.)
        // ... similar pattern for each table
      }
    }
    
    console.log("Migration complete!", migrationResults);
    return migrationResults;
  },
});

export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    // After verifying migration success, drop old tables
    // This is a separate step for safety
    console.log("Cleanup: Remove workspaces_old table");
    // Manual step: remove from schema
  },
});
```

---

## 🎯 Phase 6: Testing & Validation (2 days)

### Test Checklist:

#### 1. Data Integrity
- [ ] All companies have default workspace
- [ ] All companies have default team
- [ ] All old workspaces migrated to projects
- [ ] All issues have teamId, projectId, workspaceId
- [ ] All members migrated correctly
- [ ] No orphaned data

#### 2. Functionality
- [ ] Create new workspace
- [ ] Create new team
- [ ] Create new project
- [ ] Create issue in team
- [ ] Create issue in project
- [ ] Move issue between projects
- [ ] Team board shows all team issues
- [ ] Project board shows only project issues
- [ ] Permissions work at all levels

#### 3. UI/Navigation
- [ ] All routes work
- [ ] Breadcrumbs correct
- [ ] Navigation sidebar correct
- [ ] Search works across hierarchy
- [ ] Direct issue links work

#### 4. Performance
- [ ] Page load times acceptable
- [ ] Queries optimized with indexes
- [ ] No N+1 query issues

---

## 🚨 Rollback Plan

If something goes wrong:

```bash
# 1. Stop all deployments
git checkout pre-option-b-migration

# 2. Restore database backup
pnpm convex import --path ./backups/pre-migration-YYYYMMDD

# 3. Verify restoration
pnpm convex run migrations/verifyRollback

# 4. Redeploy old version
pnpm convex deploy
```

---

## 📊 Success Metrics

After migration:
- ✅ Zero data loss
- ✅ All routes work
- ✅ User can navigate entire hierarchy
- ✅ Permissions enforced correctly
- ✅ Performance acceptable (< 2s page loads)
- ✅ All tests pass

---

## 🎯 Post-Migration: New Features to Build

Once migration complete, you can add:

1. **Workspace-level features**
   - Workspace settings
   - Workspace-level OKRs
   - Workspace analytics

2. **Team-level features**
   - Team velocity tracking
   - Team capacity planning
   - Team-specific workflows
   - Cycles (team sprints)

3. **Cross-team features**
   - Cross-team boards
   - Dependencies between teams
   - Shared projects

4. **Enhanced permissions**
   - Workspace admins
   - Team leads
   - Project owners

---

## 📝 Next Steps

1. **Review this plan** - Any concerns or questions?
2. **Set up staging environment** - Test migration there first
3. **Start Phase 0** - Backup everything
4. **Execute phases sequentially** - Don't skip steps
5. **Test thoroughly** - Each phase before moving to next

**Should I start with Phase 0 (Planning & Backup)?**
