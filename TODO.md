# Cascade - Product Roadmap

> **Last Updated:** 2025-11-25
> **Status:** Ready for Public Launch

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

### Calendar Sync (Google Calendar OAuth works, sync pending)
- [ ] Two-way sync (calendar ↔ Cascade)
- [ ] Sync issue due dates to calendar
- [ ] Outlook Calendar integration

### Slack Integration
- [ ] Post issue updates to channels
- [ ] Create issues from Slack (`/cascade create`)
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

### Cascade Cloud (Hosted SaaS)
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

### Backend Cleanup
- [x] `@ts-nocheck` pragmas reviewed - kept for legitimate Convex framework limitations (circular types, aggregate API)
- [ ] Implement AI response time calculation (`convex/internal/ai.ts:204`)
- [ ] SendPulse email provider (optional, Resend works)

### Critical (Before Launch)
- [x] Webhook secrets in plain text (fixed - secrets no longer returned in queries)
- [x] N+1 query patterns (fixed in bulk operations and dashboard queries)

### High Priority
- [ ] Refactored components not integrated (`.refactored.tsx` files)
- [ ] Unbounded queries (no pagination)

### Medium Priority
- [ ] No caching strategy
- [ ] No monitoring/alerting
- [ ] Large activity logs (no archiving)

---

## Related Docs

- [SETUP.md](./SETUP.md) - Setup instructions
- [CLAUDE.md](./CLAUDE.md) - Development guide
