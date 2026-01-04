# Nixelo - Product Roadmap

> **Last Updated:** 2026-01-01
> **Current Architecture:** Company → Workspaces → Teams → Projects → Issues

---

## 🔥 NEXT: Multi-Level Views

**Goal:** Support boards, documents, and wikis at multiple levels (inspired by ClickUp, Linear, Jira)

### Board Views (All Levels)

- [ ] **Workspace Board** - Department-wide view
  - [ ] All teams in workspace (cross-team dependencies)
  - [ ] Workspace backlog (unassigned issues)
  - [ ] Workspace sprint view (all active sprints)
  - [ ] Kanban, List, Timeline, Calendar views
- [ ] **Team Board** - Remaining items
  - [ ] Team backlog (unassigned to projects)
  - [ ] Team sprint/cycle view
  - [ ] Team velocity tracking
  - [ ] List, Timeline, Calendar views (Kanban done)
- [ ] **Custom Boards** - Filter anything
  - [ ] Saved filters (backend exists - needs UI)
  - [ ] Cross-team boards
  - [ ] Personal boards (@me)
  - [ ] Multiple view types

### Documents/Wikis (All Levels)

- [ ] **Company Wiki** - Organization-wide knowledge
- [ ] **Workspace Wiki** - Department documentation
- [ ] **Team Wiki** - Team knowledge base

### Calendar/Events (All Levels)

- [ ] **Company Calendar** - All-hands, holidays
- [ ] **Workspace Calendar** - Department events
- [ ] **Team Calendar** - Team meetings, standups

### Document Templates Integration

- [ ] Add route to expose DocumentTemplatesManager
- [ ] Add sidebar link for templates

---

## 🔥 NEXT: Public Launch

### Day 1-2: Landing Page

- [ ] Create landing page with hero, features, screenshots
- [ ] Create demo video (2-3 min walkthrough)

### Day 3: GitHub Polish

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

**Success:** 100 stars, 10 users, 5 Discord members

---

## 🎯 Feature Gaps (from Competitor Analysis)

> Source: [FEATURE_DEEP_DIVE.md](./research/FEATURE_DEEP_DIVE.md)

### P1 - Quick Wins (Low Effort, High Impact)

- [ ] **Search descriptions** - Currently only searches titles, not issue descriptions
- [ ] **Comment reactions** - 👍 👎 ❤️ 🎉 (simple `commentReactions` table)
- [ ] **Verify rich text comments** - Document editor supports it, do comments?

### P2 - Medium Priority (Worth Doing)

- [ ] **Label groups** - Like Linear: organize labels into groups (Priority, Component, Area)
- [ ] **User picker custom field** - For "Reviewer", "QA", "Designer" fields
- [ ] **Velocity charts** - Track story points per sprint, show average velocity
- [ ] **Timer widget** - Start/stop timer from issue detail page
- [ ] **Slack integration** - Extend existing `pumbleWebhooks` to Slack
- [ ] **Description search** - Add description to search index

### P3 - Nice to Have (Later)

- [ ] **Label descriptions** - Show on hover
- [ ] **Query language** - Simple `status:done priority:high` syntax
- [ ] **Swimlanes** - Group board rows by assignee/epic
- [ ] **WIP limits** - Warn when column exceeds limit
- [ ] **Auto-cycles** - Like Linear: auto-create next sprint

---

## Phase 2: Growth (Post-Launch)

### Calendar Sync

- [ ] Two-way sync (calendar ↔ Nixelo)
- [ ] Sync issue due dates to calendar
- [ ] Outlook Calendar integration

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

- [ ] Google Workspace SSO
- [ ] Microsoft Entra ID
- [ ] Okta

### AI Assistant

- [ ] Natural language queries
- [ ] Project insights
- [ ] Auto-summarize

---

## Technical Debt

### Backend

- [ ] SendPulse email provider (optional, Resend works)

### Medium Priority

- [ ] Caching strategy
- [ ] Monitoring/alerting
- [ ] Activity log archiving

---

## Related Docs

- [CLAUDE.md](./CLAUDE.md) - Development guide
