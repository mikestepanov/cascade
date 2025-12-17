# Nixelo - Product Roadmap

> **Last Updated:** 2024-12-17
> **Status:** ✅ Architecture Migration COMPLETE (Option B)

---

## ✅ COMPLETED: Option B Architecture Migration

**Architecture:** Company → Workspaces → Teams → Projects → Issues

**All Phases Complete!**
- ✅ Phase 1: Renamed workspace → project (3,209 replacements)
- ✅ Phase 2: Added workspace layer + teams
- ✅ Phase 3: Created full route hierarchy
- ✅ Phase 4: Updated UI components (sidebar, breadcrumbs)
- ✅ Phase 5: Data migration (100% success - 46 projects, 49 issues)
- ✅ Phase 6: Documentation and testing

**Migration Results:**
- 63 workspaces created ("General" per company)
- 63 teams created ("General Team" per workspace)
- 46/46 projects migrated (100%)
- 49/49 issues migrated (100%)
- **0 errors!**

**See:** `MIGRATION-STATUS.md` for complete details

---

## 🔥 NEXT: Multi-Level Views

**Goal:** Support boards, documents, and wikis at multiple levels (inspired by ClickUp, Linear, Jira)

### Board Views (All Levels)
- [ ] **Workspace Board** - Department-wide view
  - [ ] All teams in workspace (cross-team dependencies)
  - [ ] Workspace backlog (unassigned issues)
  - [ ] Workspace sprint view (all active sprints)
  - [ ] Kanban, List, Timeline, Calendar views
  
- [ ] **Team Board** - Team-wide view (PRIMARY)
  - [ ] All team issues (across projects or none)
  - [ ] Team backlog (unassigned to projects)
  - [ ] Team sprint/cycle view
  - [ ] Team velocity tracking
  - [ ] Kanban, List, Timeline, Calendar views
  
- [x] **Project Board** - Filtered view (EXISTING - already works!)
  - [x] Project-specific issues only
  - [x] Project timeline/roadmap
  - [x] Client-facing boards (agency)
  - [x] Kanban, List, Timeline, Calendar views
  
- [ ] **Custom Boards** - Filter anything
  - [ ] Saved filters (already exists - just needs UI)
  - [ ] Cross-team boards
  - [ ] Personal boards (@me)
  - [ ] Multiple view types

### Documents/Wikis (All Levels)
- [ ] **Company Wiki** - Organization-wide knowledge
  - [ ] Company policies, handbook
  - [ ] Onboarding documentation
  - [ ] All-hands meeting notes
  
- [ ] **Workspace Wiki** - Department documentation
  - [ ] Engineering standards, architecture docs
  - [ ] Marketing playbooks, brand guidelines
  - [ ] Product roadmaps, strategy docs
  
- [ ] **Team Wiki** - Team knowledge base
  - [ ] Team processes, runbooks
  - [ ] Meeting notes, retrospectives
  - [ ] Code guidelines, best practices
  
- [x] **Project Wiki** - Project-specific docs (EXISTING - already works!)
  - [x] Project brief, requirements
  - [x] Technical specs
  - [x] Client deliverables

### Calendar/Events (All Levels)
- [ ] **Company Calendar** - All-hands, holidays
- [ ] **Workspace Calendar** - Department events
- [ ] **Team Calendar** - Team meetings, standups
- [x] **Project Calendar** - Project milestones, deadlines (EXISTING)

---

## 🔥 NEXT: Public Launch

**Everything else depends on this.**

### Day 1-2: Landing Page
- [ ] Create landing page
  - [ ] Hero: "Open-source Jira + Confluence alternative"
  - [ ] Features showcase
  - [ ] Screenshots/demo video
  - [ ] "Try Demo" + "Self-host" buttons
  - [ ] GitHub star button
- [ ] Create demo video (2-3 min walkthrough)

### Day 3: GitHub Polish
- [x] Polish README.md (hero image, quick start, features)
- [x] Add CONTRIBUTING.md
- [x] Add CODE_OF_CONDUCT.md
- [ ] Add issue/PR templates
- [ ] Add "good first issue" labels

### Day 4-5: Launch
- [ ] Hacker News (Show HN)
- [ ] Reddit: r/selfhosted, r/opensource, r/programming
- [ ] Product Hunt
- [ ] awesome-selfhosted list
- [ ] Write launch blog post

### Day 6-7: Community
- [ ] Set up Discord server
- [ ] Enable GitHub Discussions
- [ ] Monitor and respond to feedback

**Success:** 100 stars, 10 users, 5 Discord members

---

## Phase 2: Growth (Post-Launch)

### Multi-Level View Implementation
- [ ] Workspace-level boards (cross-team)
- [ ] Team-level boards (primary view)
- [ ] View switcher (kanban/list/timeline/calendar)
- [ ] Custom board builder
- [ ] Saved filters per level
- [ ] Workspace/team wikis
- [ ] Document organization by level

### Calendar Sync (Google Calendar OAuth works, sync pending)
- [ ] Two-way sync (calendar ↔ Nixelo)
- [ ] Sync issue due dates to calendar
- [ ] Outlook Calendar integration
- [ ] Calendar at workspace/team/project levels

### Slack Integration
- [ ] Post issue updates to channels
- [ ] Create issues from Slack (`/nixelo create`)
- [ ] Unfurl issue links

### GitHub Integration
- [ ] Link commits to issues (`Fixes PROJ-123`)
- [ ] Link PRs to issues
- [ ] Auto-update status on merge

### Enhanced Search
- [ ] Fuzzy matching
- [ ] Search shortcuts (`type:bug`, `@me`)
- [ ] Advanced search modal
- [ ] Search across workspace/team/project

### Document Version History
- [ ] Version history sidebar
- [ ] Diff view
- [ ] Restore previous version

---

## Phase 3: Enterprise

### Nixelo Cloud (Hosted SaaS)
- [ ] Stripe payment integration
- [ ] Subscription management
- [ ] Pricing page

### SSO/SAML
- [ ] Google Project SSO
- [ ] Microsoft Entra ID
- [ ] Okta

### AI Assistant
- [ ] Natural language queries
- [ ] Project insights
- [ ] Auto-summarize

---

## Unused/Unintegrated Code

### DocumentTemplatesManager Component
**Location:** `src/components/DocumentTemplatesManager.tsx`

A fully-built feature for managing document templates that was never integrated:
- List view of all document templates
- Create, edit, delete templates
- Template selection callback

**Action needed:**
- [ ] Decide: integrate into app or remove
- [ ] If integrating: add route, sidebar link, make `onSelectTemplate` required
- [ ] Check for unused backend functions in `convex/` related to templates

---

## Technical Debt

### Backend Cleanup
- [x] `@ts-nocheck` pragmas reviewed - kept for legitimate Convex framework limitations (circular types, aggregate API)
- [ ] Implement AI response time calculation (`convex/internal/ai.ts:204`)
- [ ] SendPulse email provider (optional, Resend works)

### Critical (Before Launch)
- [x] Webhook secrets in plain text (fixed - secrets no longer returned in queries)
- [x] N+1 query patterns (fixed in bulk operations and dashboard queries)

### High Priority
- [x] Refactored components (deleted duplicate `.refactored.tsx` files - were artifacts)
- [ ] Unbounded queries (no pagination)

### Medium Priority
- [ ] No caching strategy
- [ ] No monitoring/alerting
- [ ] Large activity logs (no archiving)

---

## Related Docs

- [SETUP.md](./SETUP.md) - Setup instructions
- [CLAUDE.md](./CLAUDE.md) - Development guide
