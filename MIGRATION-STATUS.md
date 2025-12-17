# Project → Workspace Migration Status

**Status**: ✅ DATA MIGRATION COMPLETE - Documentation updates in progress

## Migration Results

✅ **Data Migration Complete** (2025-12-16)
- **58 documents migrated**: Removed legacy `projectId` fields
  - issues: 49
  - labels: 2
  - sprints: 1
  - timeEntries: 6
- All data now uses `workspaceId` consistently

## What's Been Completed

✅ **Code Migration**
- Routes renamed: `/projects/*` → `/workspaces/*`
- Convex modules renamed: `projects.ts` → `workspaces.ts`, etc.
- Component props updated: `projectId` → `workspaceId`
- RBAC functions updated to use workspaceId

✅ **Schema Changes (Temporary)**
- Added optional `projectId` field (string) to tables for backward compatibility
- Made `workspaceId` optional temporarily during migration
- Created migration script in `convex/migrations/migrateProjectToWorkspace.ts`

## What Needs to Be Done

### 1. Run Data Migration

```bash
# Check current status
pnpm convex run migrations/migrateProjectToWorkspace:checkStatus

# Run the migration
pnpm convex run migrations/migrateProjectToWorkspace:migrate
```

### 2. Update Schema (After Migration)

Once data is migrated, update `convex/schema.ts`:

**Tables that need cleanup:**
- `issues` - Make `workspaceId` required, remove `projectId`
- `documents` - Remove `projectId` field
- `labels` - Make `workspaceId` required, remove `projectId`
- `issueTemplates` - Make `workspaceId` required, remove `projectId`
- `webhooks` - Make `workspaceId` required, remove `projectId`
- `savedFilters` - Make `workspaceId` required, remove `projectId`
- `automationRules` - Make `workspaceId` required, remove `projectId`
- `customFields` - Make `workspaceId` required, remove `projectId`
- `sprints` - Make `workspaceId` required, remove `projectId`

### 3. Fix TypeScript Errors

Several files currently have TypeScript errors due to optional `workspaceId`:

**Files using `getIssueWithWorkspace()` helper (✅ Fixed):**
- `convex/attachments.ts`

**Files that still need updates:**
- `convex/customFields.ts` - Add null checks or use helper
- `convex/customFunctions.ts` - Add null checks or use helper
- More files TBD (run `pnpm typecheck` to see full list)

### 4. Update Documentation

**CLAUDE.md needs updates in these sections:**
- "Database Schema" - Update table descriptions
- "Key Conventions" - Update examples using projectId
- "RBAC" section - Mentions `projectId` and `projectMembers`
- Code examples - Replace `/projects/` with `/workspaces/`

**Other docs to update:**
- `docs/API.md` - API endpoints mention `projects:read`, `projects:write` scopes
- `docs/AUTHENTICATION.md` - Mentions creating projects
- `docs/ai/README.md` - "Ask questions about projects"
- `docs/features/FUZZY_SEARCH.md` - `useProjectFuzzySearch` function
- `docs/integrations/README.md` - "Link repositories to Nixelo projects"
- `docs/testing/backend.md` - Test helper examples
- `convex/README.testing.md` - Imports `projects` module
- `convex/HELPERS_GUIDE.md` - Examples use `projectId`
- `convex/TESTING_STATUS.md` - Mentions `createTestProject`

### 5. Generated API Files

The file `convex/_generated/api.d.ts` still references:
- `projectMembers`
- `projectTemplates`  
- `projects`

These will auto-regenerate after next deployment.

## Migration Helper Function

Created `convex/lib/issueHelpers.ts` with:

```typescript
export async function getIssueWithWorkspace(
  ctx: QueryCtx | MutationCtx,
  issueId: Id<"issues">,
): Promise<Doc<"issues"> & { workspaceId: Id<"workspaces"> }>
```

Use this helper to safely get issues and ensure they have a workspaceId.

## Component Naming

**These component names are intentionally kept as-is:**
- `ProjectBoard.tsx` - "Project board" is the UI concept (like Jira's project boards)
- `ProjectSettings` - Settings for a workspace/project

The term "project" in UI components refers to the workspace being viewed, not the database entity.

## Notes

- The term "project" is still appropriate in some contexts:
  - UI: "Project Board", "Project Settings" (referring to the workspace being viewed)
  - Business logic: "Workspace" is the database entity
  - User-facing: Both terms are acceptable depending on context

- The migration script is **idempotent** - safe to run multiple times
- The schema allows both fields temporarily to prevent data loss
- After migration completes, we'll make `workspaceId` required again

## Testing After Migration

1. Verify all issues have `workspaceId`: `pnpm convex run migrations/migrateProjectToWorkspace:checkStatus`
2. Run TypeScript check: `pnpm typecheck`
3. Run all tests: `pnpm test` and `pnpm test:convex`
4. Run E2E tests: `pnpm e2e`
5. Manual smoke test: Create issue, view workspace, check calendar

## Rollback Plan

If migration fails:
1. Schema already allows both fields
2. Data is only modified (not deleted)
3. Original `projectId` values are preserved until explicitly removed
4. Can revert code changes from git history if needed

---

**Last Updated**: 2025-12-16
**Migration Script**: `convex/migrations/migrateProjectToWorkspace.ts`
