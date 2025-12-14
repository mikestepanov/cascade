# Plan: Rename Projects → Workspaces

## Scope Analysis

**Scale of changes:**
- ~900 references in `src/components/`
- ~1345 references in `convex/` (excluding tests)
- 20+ tables reference `projectId`
- Routes, config, tests all need updates

## Tables with `projectId` References

| Table | Field | Required? |
|-------|-------|-----------|
| documents | projectId | optional |
| documentTemplates | projectId | optional |
| projectMembers | projectId | required |
| issues | projectId | required |
| sprints | projectId | required |
| labels | projectId | required |
| customFields | projectId | required |
| customFieldValues | projectId | required |
| webhooks | projectId | required |
| automationRules | projectId | required |
| attachments | projectId | required |
| calendarEvents | projectId | optional |
| issueActivity | projectId | required |
| aiChats | projectId | optional |
| aiSuggestions | projectId | required |
| notifications | projectId | optional |
| apiKeys | projectId | optional |
| bookingPages | projectId | required |
| timeEntries | projectId | optional |
| hourlyRates | projectId | optional |
| invites | projectId | optional |
| meetingRecordings | projectId | optional |

## Approach Options

### Option A: UI-Only Rename (Low Risk)
- Keep `projects` in code/schema
- Only change UI labels to "Workspace"
- **Pros:** Minimal code changes, no migration
- **Cons:** Confusing code vs UI mismatch

### Option B: Full Rename (High Risk)
- Rename table `projects` → `workspaces`
- Rename all `projectId` → `workspaceId`
- Update all routes, components, backend
- **Pros:** Clean, consistent naming
- **Cons:** ~2000+ changes, high risk of bugs

### Option C: Phased Rename (Medium Risk) ✅ Recommended
1. **Phase 1:** UI labels only (project → workspace in display text)
2. **Phase 2:** Routes (`/projects/` → `/workspaces/`)
3. **Phase 3:** Components (props, variables)
4. **Phase 4:** Backend (convex functions, schema)

## Recommended Plan: Phase 1 (UI Labels)

Start with the safest change - just update display text:

### Files to Update
1. **Sidebar labels** - `AppSidebar.tsx`
2. **Page titles** - route components
3. **Buttons/actions** - "Create Project" → "Create Workspace"
4. **Empty states** - "No projects" → "No workspaces"
5. **Tooltips/help text**

### NOT changing (yet)
- Variable names (`project`, `projectId`)
- Route paths (`/projects/`)
- Schema/database
- Function names

## Phase 1 Implementation Steps

1. [ ] Update AppSidebar.tsx - "Projects" → "Workspaces" label
2. [ ] Update ProjectsList.tsx - headings, empty states
3. [ ] Update CreateProjectModal.tsx - title, labels
4. [ ] Update ProjectBoard.tsx - title
5. [ ] Update project settings pages - headings
6. [ ] Update Dashboard quick actions
7. [ ] Update search/command palette labels
8. [ ] Run tests to verify no breaks

## Decision Needed

Should we:
1. **Start with Phase 1** (UI labels only) - safest, can ship quickly
2. **Go straight to full rename** - more work but cleaner result
3. **Skip renaming** - keep "Projects", focus on other features

