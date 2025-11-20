# Cascade - Product Roadmap & TODO

> **Last Updated:** 2025-11-19
> **Version:** 2.3 - Phase 1 Complete, Integrations Live, Code Quality Enhanced
> **Status:** Active Development - Ready for Public Launch

This document serves as the comprehensive roadmap for Cascade development, reorganized after competitive analysis against Canvas LMS, Cal.com, AppFlowy, and Kimai.

> **📌 Looking for setup instructions?** See [HUMAN_TODO.md](./HUMAN_TODO.md) for all manual setup tasks.
> **📊 Want to see how we compare?** See [COMPARISON_Analysis.md](./COMPARISON_Analysis.md) for competitive analysis.

---

## 🎯 Strategic Summary

**Cascade's Position:** Open-source Jira + Confluence alternative with real-time collaboration

**Competitive Advantages:**
- ⭐ Best-in-class real-time collaboration (Convex)
- ⭐ Modern tech stack (React 19, TypeScript, serverless)
- ⭐ Unique: Documents + Issues + Boards in one open-source app
- ⭐ Easiest deployment (Convex + Vercel)
- ⭐ Complete email notification system

**Critical Gaps vs. Competitors:**
- ❌ No mobile apps (Canvas, AppFlowy have this)
- ❌ No community (0 stars vs 3.5k-58k)
- ❌ No calendar integration (Cal.com dominates)
- ❌ No SSO/SAML (all mature competitors have this)
- ❌ No offline mode (AppFlowy has this)

**Overall Score: 70%** (Tech: A+, Product: B, Go-to-Market: F)

**Strategy: Launch → Validate → Grow → Monetize**

---

## 📊 Current State

### ✅ What Works (85% Feature Complete)
- ✅ Real-time collaborative document editing (BlockNote)
- ✅ Kanban/Scrum boards with drag-and-drop + undo/redo
- ✅ Full issue lifecycle (task/bug/story/epic)
- ✅ Sprint management & analytics dashboard
- ✅ Time tracking (backend + basic UI)
- ✅ Custom fields, labels, templates
- ✅ Automation rules & webhooks with logs
- ✅ Role-based access control (RBAC)
- ✅ Activity feeds & in-app notifications
- ✅ **Email notifications (100% complete)** - digests, unsubscribe, provider-agnostic
- ✅ Search, filters, command palette
- ✅ Import/Export (JSON + CSV)
- ✅ Dark/light theme
- ✅ Loading skeletons & optimistic UI
- ✅ File attachments with drag-and-drop
- ✅ Keyboard navigation
- ✅ Frontend testing (Vitest + React Testing Library)
- ✅ Backend testing (221 tests across 9 modules, 32% coverage)
- ✅ **REST API for CLI/AI integration** - API keys, scopes, rate limiting
- ✅ **Google Calendar OAuth integration** - bi-directional sync
- ✅ **Pumble webhook integration** - team chat notifications
- ✅ **API Keys management UI** - generate, view stats, revoke
- ✅ **Onboarding flow** - welcome modal, onboarding tour
- ✅ **Mobile-responsive PWA** - installable, offline-ready
- ✅ **Calendar events with attendance tracking** - required meetings, admin-only marking
- ✅ **Enhanced biome configuration** - comprehensive linting rules (a11y, security, performance)
- ✅ **Phase 5 refactoring** - automation & import/export components modularized

### 🔴 What's Missing (Critical for Launch)
- ❌ **Public launch** - No users, no community, 0 GitHub stars
- ❌ **Landing page** - No marketing site
- ❌ **Production deployment** - Still in development

### 🟡 What's Missing (Important but not blocking)
- 🟡 Document version history
- 🟡 Slack integration
- 🟡 GitHub integration (Pumble alternative for developers)
- 🟡 SSO/SAML
- 🟡 Native mobile apps
- 🟡 AI assistant

---

## 🚀 Roadmap Overview

### **Phase 1: Launch & Validate** (Next 3 Months)
**Goal:** 100 GitHub stars, 10 active users, public launch

**North Star Metric:** Weekly Active Projects (projects with activity in last 7 days)

| Status | Priority | Item | Impact | Effort | ETA |
|--------|----------|------|--------|--------|-----|
| ✅ | P0 | Loading Skeletons | High | 1 week | DONE |
| ✅ | P0 | Email Notifications | Critical | 3 weeks | DONE |
| ✅ | P0 | **Onboarding Flow** | Critical | 2 weeks | DONE |
| ✅ | P0 | **Mobile-Responsive PWA** | Critical | 4 weeks | DONE |
| ✅ | P0 | **REST API Integration** | Critical | 2 weeks | DONE |
| ✅ | P0 | **Google Calendar Integration** | Critical | 2 weeks | DONE |
| ✅ | P0 | **Pumble Integration** | High | 1 week | DONE |
| 🔥 | P0 | **Public Launch** | Critical | 1 week | NEXT |
| ✅ | P1 | Backend Testing | High | 4 weeks | DONE |
| ✅ | P1 | Quick Wins (6 items) | High | 1 week | DONE |

### **Phase 2: Grow & Differentiate** (Months 4-6)
**Goal:** 1,000 stars, 100 users, 10 contributors

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P0 | Calendar Integration (Google, Outlook) | High | 2 weeks |
| P0 | Slack Integration | High | 2 weeks |
| P0 | GitHub Integration | High | 2 weeks |
| P1 | Enhanced Search (filters, fuzzy) | High | 3 weeks |
| P1 | Performance Optimization | High | 3 weeks |
| P1 | Document Version History | High | 4 weeks |
| P2 | AI Project Assistant | Very High | 6-8 weeks |

### **Phase 3: Enterprise & Monetize** (Months 7-12)
**Goal:** 5,000 stars, 1,000 users, $10k MRR

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P0 | Hosted SaaS (Cascade Cloud) | Critical | 2 weeks |
| P0 | SSO/SAML | High | 4 weeks |
| P1 | Advanced RBAC & Audit Logs | High | 3 weeks |
| P1 | Native Mobile Apps (iOS/Android) | Medium | 12 weeks |
| P2 | Offline Mode | Medium | 8 weeks |
| P2 | Collaborative Whiteboards | Medium | 8 weeks |
| P2 | Plugin System | Medium | 6 weeks |

---

## 🔥 Phase 1: Launch & Validate (95% COMPLETE)

### Public Launch (P0) - 🔥 NEXT UP

**Impact:** ⭐⭐⭐⭐⭐ Everything depends on this
**Effort:** 🟢 Low (1 week)
**Status:** ❌ Not Started
**ETA:** Next Week

#### Why This Matters
- Currently: 0 users, 0 stars, 0 community
- Need feedback to validate product-market fit
- Competitors launched early and iterated (Cal.com, AppFlowy)
- "Launch now, iterate fast" is the winning strategy

#### Implementation Plan

**Day 1-2: Landing Page**
- [ ] **Create landing page** (`landing/index.html` or Vercel site)
  - [ ] Hero: "Open-source Jira + Confluence alternative with real-time collaboration"
  - [ ] Features showcase (documents, boards, real-time)
  - [ ] Screenshots/demo video
  - [ ] "Try Demo" (sample project) + "Self-host" buttons
  - [ ] Comparison table vs Jira/Confluence/Linear
  - [ ] GitHub star button
  - [ ] Discord/community link

- [ ] **Create demo video** (2-3 minutes)
  - [ ] Record walkthrough: create project, add issues, collaborate
  - [ ] Upload to YouTube
  - [ ] Embed on landing page

**Day 3: GitHub Polish**
- [ ] **Polish README.md**
  - [ ] Hero image/logo
  - [ ] Clear description
  - [ ] Quick start guide
  - [ ] Features list with screenshots
  - [ ] Comparison to competitors
  - [ ] Contributing guide
  - [ ] License (choose: AGPLv3 like competitors)

- [ ] **Add community files:**
  - [ ] CONTRIBUTING.md
  - [ ] CODE_OF_CONDUCT.md
  - [ ] SECURITY.md
  - [ ] Issue templates
  - [ ] PR template
  - [ ] "good first issue" labels

**Day 4-5: Launch Announcements**
- [ ] **Submit to launch platforms:**
  - [ ] Hacker News (Show HN: Cascade - Open-source real-time project management)
  - [ ] Reddit: r/selfhosted, r/opensource, r/programming, r/projectmanagement
  - [ ] Product Hunt
  - [ ] awesome-selfhosted list
  - [ ] awesome-opensource list

- [ ] **Write launch blog post:**
  - [ ] Why I built Cascade
  - [ ] What makes it different
  - [ ] Comparison to Jira/Confluence
  - [ ] Roadmap
  - [ ] Call to action (star, contribute, try)

- [ ] **Social media:**
  - [ ] Twitter/X thread
  - [ ] LinkedIn post
  - [ ] Dev.to article

**Day 6-7: Community Setup**
- [ ] **Set up Discord server**
  - [ ] Channels: #general, #support, #feature-requests, #development
  - [ ] Welcome message
  - [ ] Link from GitHub

- [ ] **Enable GitHub Discussions**
  - [ ] Categories: Announcements, Q&A, Ideas, Show & Tell

- [ ] **Monitor and respond:**
  - [ ] Check HN comments
  - [ ] Respond to Reddit
  - [ ] Thank GitHub stargazers
  - [ ] Fix bugs found by early users

#### Success Metrics
- 100 GitHub stars in first month
- 10 active users (weekly active projects)
- 5 community members in Discord
- First external contribution

---

## 🚀 Phase 2: Grow & Differentiate (Months 4-6)

**Goal:** 1,000 GitHub stars, 100 active users, 10 contributors

### 1. Calendar Integration (P0) - 🟡 PARTIALLY COMPLETE

**Impact:** ⭐⭐⭐⭐⭐ Cal.com proves demand
**Effort:** 🟢 Medium (2 weeks total, 1 week remaining)
**Status:** 50% Complete (Google done, Outlook pending)

**Completed:**
- ✅ Google Calendar API integration (OAuth + bi-directional sync)
- ✅ Two-way sync (calendar → Cascade, Cascade → calendar)
- ✅ Auto-refresh expired tokens

**Remaining:**
- [ ] Outlook Calendar API integration
- [ ] Sync issue due dates to calendar
- [ ] Sync sprint dates to calendar
- [ ] Create calendar events from issues
- [ ] Calendar view in Cascade UI
- [ ] Recurring event support

**Why:** Cal.com's success (36k stars) shows calendar integration is critical

---

### 2. Slack Integration (P0)

**Impact:** ⭐⭐⭐⭐⭐ Teams live in Slack
**Effort:** 🟢 Low (2 weeks)
**Status:** Not Started

- [ ] Slack app OAuth setup
- [ ] Post issue updates to channels
- [ ] Create issues from Slack (`/cascade create issue`)
- [ ] Unfurl issue links (show preview)
- [ ] Subscribe channels to projects
- [ ] Slash commands: `/cascade assign`, `/cascade complete`

---

### 3. GitHub Integration (P0)

**Impact:** ⭐⭐⭐⭐⭐ Developers need this
**Effort:** 🟢 Low (2 weeks)
**Status:** Not Started

- [ ] GitHub app OAuth setup
- [ ] Link commits to issues (`Fixes PROJ-123`)
- [ ] Link PRs to issues
- [ ] Auto-update status (merged → done)
- [ ] Show commit history in issue
- [ ] Create issues from GitHub issues (import)

---

### 4. Enhanced Search (P1)

**Impact:** ⭐⭐⭐⭐ Find things 5x faster
**Effort:** 🟡 Medium (3 weeks)
**Status:** Not Started

- [ ] Add search filters (type, status, assignee, project)
- [ ] Fuzzy matching (typo tolerance)
- [ ] Search within documents and comments
- [ ] Recent searches
- [ ] Search shortcuts (`type:bug`, `status:open`, `@me`)
- [ ] Keyboard navigation (↑↓ to select)
- [ ] Result highlighting
- [ ] "Advanced search" modal

---

### 5. Performance Optimization (P1)

**Impact:** ⭐⭐⭐⭐ Stays fast as data grows
**Effort:** 🟡 Medium (3 weeks)
**Status:** Not Started

- [ ] Query result caching
- [ ] Pagination (limit 50, load more)
- [ ] Optimize N+1 queries (batch fetches)
- [ ] Add missing indexes
- [ ] Virtual scrolling (react-window)
- [ ] Compress images/assets
- [ ] Code splitting (lazy load routes)
- [ ] Monitor slow queries

**Success Metrics:**
- Dashboard load < 1s with 1000 issues
- Issue list scrolling at 60fps
- Search results < 500ms

---

### 6. Document Version History (P1)

**Impact:** ⭐⭐⭐⭐ Confluence's killer feature
**Effort:** 🟡 Medium (4 weeks)
**Status:** Not Started

- [ ] Store snapshots on every save (debounced)
- [ ] Version history sidebar
- [ ] Diff view (show changes between versions)
- [ ] Restore previous version
- [ ] Name versions ("Final draft", "v1.2")
- [ ] Prune old versions (keep last 50 or 30 days)

---

### 7. AI Project Assistant (P2)

**Impact:** ⭐⭐⭐⭐⭐ Major differentiator (but expensive)
**Effort:** 🔴 High (6-8 weeks)
**Status:** Not Started

**Why:** Canvas has Gemini, Confluence has Rovo AI - this is table stakes

**Features:**
- [ ] Natural language queries ("show overdue issues")
- [ ] Project insights (bottlenecks, at-risk sprints)
- [ ] Auto-summarize (sprint summaries, long comments)
- [ ] Smart suggestions (assignees, labels, priority)
- [ ] Document assistance (draft PRDs, meeting notes)
- [ ] Chat interface (⌘K → "Ask AI")

**Tech:**
- Provider: Anthropic Claude 3.5 Sonnet (best reasoning)
- Cost: ~$0.01 per query, ~$3k/month at scale
- Mitigation: Rate limiting, caching, user quotas

---

## 💼 Phase 3: Enterprise & Monetize (Months 7-12)

**Goal:** 5,000 stars, 1,000 users, $10k MRR

### Business Model: Open Core (like Cal.com)

**Free Tier:**
- 100% self-hosted
- All core features
- Unlimited users
- Community support

**Team ($10/user/month):**
- Hosted on Cascade Cloud
- Automatic backups
- Email support
- 99.9% uptime SLA

**Enterprise ($30/user/month):**
- Everything in Team
- SSO/SAML
- Advanced RBAC
- Audit logs
- Phone support
- Custom SLA

---

### 1. Hosted SaaS - Cascade Cloud (P0)

**Impact:** ⭐⭐⭐⭐⭐ Primary revenue stream
**Effort:** 🟢 Low (2 weeks - Convex handles hosting!)
**Status:** Not Started

- [ ] Payment integration (Stripe)
- [ ] Subscription management
- [ ] Multi-tenancy setup (already supported)
- [ ] Billing dashboard
- [ ] Usage tracking
- [ ] Pricing page
- [ ] 14-day free trial
- [ ] Onboarding for paid users

**Pricing:**
- Free: Self-hosted
- Team: $10/user/month (min 3 users)
- Enterprise: $30/user/month + custom

---

### 2. SSO/SAML (P0)

**Impact:** ⭐⭐⭐⭐⭐ Enterprise requirement
**Effort:** 🟡 High (4 weeks)
**Status:** Not Started

- [ ] SAML authentication flow
- [ ] Google Workspace SSO
- [ ] Microsoft Entra ID (Azure AD)
- [ ] Okta integration
- [ ] Admin UI for SSO config
- [ ] Test with enterprise customers

---

### 3. Advanced RBAC & Audit Logs (P1)

**Impact:** ⭐⭐⭐⭐ Enterprise requirement
**Effort:** 🟡 Medium (3 weeks)
**Status:** Not Started

- [ ] Custom roles (beyond admin/editor/viewer)
- [ ] Granular permissions (per-project)
- [ ] Permission templates
- [ ] Audit log (all actions)
- [ ] Audit log export
- [ ] Compliance reports

---

### 4. Native Mobile Apps (P1)

**Impact:** ⭐⭐⭐⭐ Long-term investment
**Effort:** 🔴 Very High (12 weeks)
**Status:** Not Started

**Strategy:** React Native (reuse React components)

- [ ] Set up React Native project
- [ ] Share components with web
- [ ] Native navigation
- [ ] Push notifications (native)
- [ ] Offline support
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)

**Alternative:** PWA first, native only if users demand it

---

### 5. Offline Mode (P2)

**Impact:** ⭐⭐⭐ Complex, niche demand
**Effort:** 🔴 High (8 weeks)
**Status:** Not Started

- [ ] Offline-first architecture
- [ ] Local database (IndexedDB)
- [ ] Sync engine with conflict resolution
- [ ] Optimistic UI updates
- [ ] Background sync
- [ ] "Offline" indicator

**Inspiration:** AppFlowy's offline-first approach

---

### 6. Collaborative Whiteboards (P2)

**Impact:** ⭐⭐⭐ Nice to have
**Effort:** 🟡 Medium (8 weeks with Excalidraw)
**Status:** Not Started

**Strategy:** Integrate Excalidraw (don't build from scratch)

- [ ] Embed Excalidraw in documents
- [ ] Real-time collaboration (multiple cursors)
- [ ] Save whiteboards to Convex
- [ ] Export as PNG/SVG
- [ ] Link whiteboards to issues

---

### 7. Plugin System (P2)

**Impact:** ⭐⭐⭐ Revenue stream (like Kimai)
**Effort:** 🟡 High (6 weeks)
**Status:** Not Started

**Inspiration:** Kimai's plugin marketplace generates revenue

- [ ] Plugin API design
- [ ] Plugin manifest format
- [ ] Plugin marketplace
- [ ] Paid plugins (revenue share)
- [ ] Community plugins
- [ ] Plugin sandboxing

---

## 📊 Success Metrics & KPIs

### North Star Metric
**Weekly Active Projects** - Projects with at least one action in last 7 days

**Goal:** 1,000 weekly active projects by end of 2025

### Phase 1 Metrics (Launch)
- ✅ GitHub Stars: 100
- ✅ Active Users: 10
- ✅ Day 7 Retention: 40%
- ✅ Onboarding Completion: 60%

### Phase 2 Metrics (Growth)
- ✅ GitHub Stars: 1,000
- ✅ Active Users: 100
- ✅ Contributors: 10
- ✅ Day 30 Retention: 20%

### Phase 3 Metrics (Revenue)
- ✅ GitHub Stars: 5,000
- ✅ Active Users: 1,000
- ✅ Paying Customers: 50
- ✅ MRR: $10,000

### Performance Metrics (Always)
- Dashboard load time < 1s
- 95% of queries < 500ms
- Lighthouse score > 90
- Backend test coverage > 80%

---

## 🚧 Technical Debt & Known Issues

### Critical (Fix Before Launch)
- [ ] **Webhook secrets in plain text** - Security risk
- [ ] **No rate limiting on API** - Can be abused
- [ ] **N+1 query patterns** - Performance issues at scale

### High Priority (Fix in Phase 2)
- [ ] **Refactored components not integrated** - `.refactored.tsx` files exist but unused
- [ ] **No data migration strategy** - Schema changes risk breaking changes
- [ ] **Unbounded queries** - Some queries don't paginate

### Medium Priority (Fix in Phase 3)
- [ ] **No caching strategy** - All queries hit DB
- [ ] **Large activity logs** - No archiving
- [ ] **No monitoring/alerting** - Don't know when things break
- [ ] **Missing API documentation** - No public API docs

---

## 📚 Resources & Competitive Analysis

### Competitors Analyzed
- **Canvas LMS** - 5k stars, Rails/React, Education LMS
- **Cal.com** - 36k stars, Next.js/tRPC, Scheduling (open core success story)
- **AppFlowy** - 58k stars, Flutter/Rust, Notion alternative (fast growth)
- **Kimai** - 3.5k stars, Symfony/PHP, Time tracking (plugin revenue)

### Key Learnings
1. **Launch early, iterate fast** (Cal.com, AppFlowy)
2. **Open core = sustainable** (all successful projects use this)
3. **Developer-first marketing works** (Cal.com's success)
4. **Real-time is a moat** (only Cascade and AppFlowy have this)
5. **Mobile matters** (Canvas and AppFlowy have native apps)

### Documentation
- [Convex Docs](https://docs.convex.dev/)
- [React 19 Docs](https://react.dev/)
- [COMPARISON_Analysis.md](./COMPARISON_Analysis.md) - Full competitive analysis
- [HUMAN_TODO.md](./HUMAN_TODO.md) - Setup instructions

---

## 🎯 Next Actions

### This Week (Week 1-2)
1. **Start Onboarding Flow** - Most critical for activation
2. **Polish README** - Prepare for launch
3. **Create demo video** - Show don't tell

### Next Week (Week 3-4)
1. **Mobile responsive redesign** - Critical for modern apps
2. **PWA setup** - Low effort, high impact

### Week 7
1. **LAUNCH** - Hacker News, Reddit, Product Hunt
2. **Get first 100 stars**
3. **Get first 10 users**

---

## ✅ How to Use This Roadmap

### Daily Standup
1. Check current phase tasks
2. Pick highest priority incomplete task
3. Update status in TODO
4. Ship something every day

### Weekly Review
1. Review progress on phase goals
2. Adjust priorities based on user feedback
3. Celebrate wins 🎉

### Monthly Planning
1. Review metrics (stars, users, retention)
2. Adjust roadmap based on learnings
3. Plan next month's focus

---

**Strategy:** Launch → Learn → Iterate → Grow → Monetize

**Competitive Advantage:** Real-time Jira + Confluence that nobody else has in open-source

**Next Milestone:** 100 GitHub stars by end of Month 1

**Let's ship! 🚀**
