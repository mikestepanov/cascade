# Nixelo - Active TODO

> **Last Updated:** 2026-02-02
> Focus: Core MVP features only

---

## Multi-Level Views

### Board Views
- [x] Saved Filters UI - Backend exists, needs full UI integration
- [ ] Cross-Team Dependencies - Visual view of dependencies across teams
- [ ] Workspace Backlog (unassigned issues)
- [ ] Workspace Sprint View (all active sprints)
- [ ] Personal boards (@me)

### Documents/Wikis
- [ ] Organization Wiki
- [ ] Workspace Wiki
- [ ] Team Wiki

### Calendar/Events
- [ ] Organization Calendar
- [ ] Workspace Calendar
- [ ] Team Calendar

### Document Templates
- [ ] Add route to expose DocumentTemplatesManager
- [ ] Add sidebar link for templates

---

## Feature Gaps (P1-P2)

- [x] Label groups - Organize labels into groups (Priority, Component, Area)
- [x] Velocity charts - Track story points per sprint
- [ ] Verify rich text comments - Improve Markdown support
- [ ] User picker custom field - For "Reviewer", "QA", "Designer" fields
- [ ] Slack integration - Extend existing `pumbleWebhooks` to Slack

---

## Tech Debt

- [ ] Type consistency - Ensure all TypeScript types (IssueType, IssuePriority) are imported from canonical sources, not duplicated
- [ ] Docstring coverage - Currently 32.5%, CodeRabbit threshold is 80% (convex/ functions need JSDoc)

---

## Agency MVP

- [ ] Invoicing System - Turn tracked hours into invoices (Backend partial)
- [ ] Client Portal - Secure view for clients

---

## E2E Test Gaps

| Route | Feature |
|-------|---------|
| `/projects/$key/activity` | Activity feed |
| `/workspaces/$slug/teams/$teamSlug/calendar` | Team calendar |
| `/workspaces/$slug/teams/$teamSlug/settings` | Team settings |
| `/time-tracking` | Org time tracking |

- [ ] Remove remaining hardcoded timeouts (~11 instances)

---

## Related Docs

- [CLAUDE.md](./CLAUDE.md) - Development guide
- [POST_MVP_TODO.md](./POST_MVP_TODO.md) - Deferred items
