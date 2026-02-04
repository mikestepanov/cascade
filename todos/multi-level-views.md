# Multi-Level Views

> **Priority:** P1 (Core MVP feature)
> **Effort:** Large
> **Status:** Not started

---

## Problem Statement

Nixelo supports a hierarchy: Organization → Workspace → Team → Project. However, views (boards, wikis, calendars) currently only exist at the Project level. Users need:

- **Organization-level views** - See all issues across all workspaces
- **Workspace-level views** - See issues across all teams in a workspace
- **Team-level views** - See issues across all projects in a team

**Impact:** Users can't get a high-level overview without opening each project individually.

---

## Tasks

### Board Views

#### 1. Workspace Backlog (Unassigned Issues)

**What:** A view showing all issues in a workspace that aren't assigned to any sprint.

**Route:** `/:orgSlug/workspaces/:workspaceSlug/backlog`

**Implementation:**
- [ ] Create `convex/workspaces.ts` → `getBacklogIssues` query
- [ ] Create `src/routes/$orgSlug/workspaces/$workspaceSlug/backlog.tsx`
- [ ] Add sidebar link under workspace

---

#### 2. Workspace Sprint View

**What:** Combined view of all active sprints across teams in a workspace.

**Route:** `/:orgSlug/workspaces/:workspaceSlug/sprints`

**Implementation:**
- [ ] Create `convex/workspaces.ts` → `getActiveSprints` query
- [ ] Create sprint overview component
- [ ] Add route and sidebar link

---

#### 3. Cross-Team Dependencies View

**What:** Visual graph showing issue dependencies that span multiple teams.

**Route:** `/:orgSlug/workspaces/:workspaceSlug/dependencies`

**Implementation:**
- [ ] Query issues with cross-team blockedBy/blocks relationships
- [ ] Use react-flow or similar for visualization
- [ ] Add filtering by team, status, priority

---

#### 4. Personal Boards (@me)

**What:** View showing all issues assigned to the current user across all projects.

**Route:** `/:orgSlug/my-issues`

**Implementation:**
- [ ] Already have `dashboard` with my issues - extend with board view
- [ ] Add toggle between list and board view
- [ ] Group by project or status

---

### Document/Wiki Views

#### 5. Organization Wiki

**What:** Shared documents visible across all workspaces.

**Route:** `/:orgSlug/wiki`

**Implementation:**
- [ ] Add `organizationId` field to documents (currently only has `workspaceId`)
- [ ] Create org-level documents list view
- [ ] Add "Organization Docs" section to sidebar

---

#### 6. Workspace Wiki

**What:** Documents scoped to a workspace, shared across teams.

**Route:** `/:orgSlug/workspaces/:workspaceSlug/wiki`

**Implementation:**
- [ ] Filter documents by workspaceId
- [ ] Create workspace documents view
- [ ] Integrate with existing document components

---

#### 7. Team Wiki

**What:** Documents scoped to a specific team.

**Route:** `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug/wiki`

**Implementation:**
- [ ] Add `teamId` field to documents
- [ ] Create team documents view
- [ ] Add team sidebar section

---

### Calendar Views

#### 8. Organization Calendar

**What:** All events across the organization.

**Route:** `/:orgSlug/calendar`

**Implementation:**
- [ ] Aggregate events from all workspaces
- [ ] Color-code by workspace/team
- [ ] Add filtering controls

---

#### 9. Workspace Calendar

**What:** Events scoped to a workspace.

**Route:** `/:orgSlug/workspaces/:workspaceSlug/calendar`

**Implementation:**
- [ ] Filter events by workspaceId
- [ ] Show team events within workspace
- [ ] Add to workspace sidebar

---

#### 10. Team Calendar

**What:** Events scoped to a team.

**Route:** `/:orgSlug/workspaces/:workspaceSlug/teams/:teamSlug/calendar`

**Implementation:**
- [ ] Filter events by teamId
- [ ] Include project-level events
- [ ] Add E2E test coverage

---

### Document Templates

#### 11. Expose Document Templates

**What:** Add UI route for managing document templates.

**Current state:** Backend exists (`convex/documentTemplates.ts`), no UI route.

**Route:** `/:orgSlug/documents/templates`

**Implementation:**
- [ ] Create route file
- [ ] Import existing `DocumentTemplatesManager` component
- [ ] Add sidebar link

---

## Acceptance Criteria

- [ ] Users can view backlogs at workspace level
- [ ] Users can see all active sprints across a workspace
- [ ] Cross-team dependencies are visualized
- [ ] Wikis exist at org, workspace, and team levels
- [ ] Calendars aggregate appropriately at each level
- [ ] Document templates are accessible via UI
- [ ] All new routes have E2E test coverage

---

## Related Files

- `src/config/routes.ts` - Route constants
- `convex/workspaces.ts` - Workspace queries
- `convex/documents.ts` - Document queries
- `convex/calendarEvents.ts` - Calendar queries
- `src/routes/` - Route components
