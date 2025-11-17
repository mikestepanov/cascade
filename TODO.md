# Cascade - Product Roadmap & TODO

> **Last Updated:** 2025-01-17
> **Version:** 1.0
> **Status:** Active Development

This document serves as the comprehensive roadmap for Cascade development, prioritizing features based on user impact, competitive analysis, and technical feasibility.

---

## 📊 Current State Summary

**Cascade is a real-time collaborative project management platform** combining document management (Confluence-like) with issue tracking (Jira-like).

### ✅ What We Have
- ✅ Real-time collaborative document editing (BlockNote)
- ✅ Kanban/Scrum boards with drag-and-drop
- ✅ Full issue lifecycle (task/bug/story/epic)
- ✅ Sprint management & analytics
- ✅ Time tracking (backend + basic UI)
- ✅ Custom fields, labels, templates
- ✅ Automation rules & webhooks
- ✅ Role-based access control (RBAC)
- ✅ Activity feeds & notifications (in-app only)
- ✅ Search, filters, command palette
- ✅ Analytics dashboard with charts
- ✅ Import/Export (JSON)
- ✅ Dark/light theme

### 🔴 Critical Gaps
- ❌ Email notifications (in-app only)
- ❌ Mobile-responsive design
- ❌ Document version history
- ❌ Offline mode
- ❌ Loading skeletons (just spinners)
- ❌ Backend testing (frontend only)
- ❌ SSO/SAML (basic auth only)

---

## 🎯 Priorities & Timeline

### **Phase 1: Polish & Retention** (Next 2 Months)
**Goal:** Fix critical gaps, reduce churn, improve perceived performance

| Priority | Feature | Impact | Effort | Status |
|----------|---------|--------|--------|--------|
| 🔥 P0 | Loading Skeletons & Optimistic UI | High | 1 week | Not Started |
| 🔥 P0 | Email Notifications | Critical | 2-3 weeks | Not Started |
| 🔥 P0 | Onboarding Flow | High | 2 weeks | Not Started |
| 🟡 P1 | Backend Testing | High | 4 weeks | Not Started |
| 🟡 P1 | Quick Wins (see below) | High | 1 week | Not Started |

### **Phase 2: Mobile & AI** (3-6 Months)
**Goal:** Differentiate, expand market, enable mobile usage

| Priority | Feature | Impact | Effort | Status |
|----------|---------|--------|--------|--------|
| 🔥 P0 | Mobile-Responsive Redesign + PWA | Critical | 4-6 weeks | Not Started |
| 🚀 P0 | AI Project Assistant | Very High | 6-8 weeks | Not Started |
| 🟡 P1 | Enhanced Search | High | 3 weeks | Not Started |
| 🟡 P1 | Performance Optimization | High | 3 weeks | Not Started |

### **Phase 3: Enterprise & Ecosystem** (6-12 Months)
**Goal:** Enterprise-ready, ecosystem integrations, advanced features

| Priority | Feature | Impact | Effort | Status |
|----------|---------|--------|--------|--------|
| 🟡 P1 | SSO/SAML | High | 4 weeks | Not Started |
| 🟡 P1 | Document Version History | High | 4 weeks | Not Started |
| 🟢 P2 | Native Mobile Apps (iOS/Android) | Medium | 12+ weeks | Not Started |
| 🟢 P2 | Offline Mode | Medium | 8 weeks | Not Started |
| 🟢 P2 | Collaborative Whiteboards | Medium | 8 weeks | Not Started |
| 🟢 P2 | Slack Integration | High | 2 weeks | Not Started |
| 🟢 P2 | GitHub Integration | High | 2 weeks | Not Started |
| 🟢 P2 | Google Calendar Sync | High | 2 weeks | Not Started |

---

## 🚀 Phase 1 - Detailed Implementation Plan

### 1. Loading Skeletons & Optimistic UI (P0)

**Impact:** ⭐⭐⭐⭐⭐ Makes app feel 10x faster
**Effort:** 🟢 Low (1 week)
**Status:** ❌ Not Started

#### What & Why
Replace all loading spinners with skeleton screens and implement optimistic UI updates for instant feedback. Users perceive performance as equally important as actual performance.

#### Implementation Checklist
- [ ] **Create reusable Skeleton components** (`src/components/ui/Skeleton.tsx`)
  - [ ] `<SkeletonCard />` - Card-shaped skeleton
  - [ ] `<SkeletonText />` - Text line skeleton
  - [ ] `<SkeletonAvatar />` - Circle skeleton for avatars
  - [ ] `<SkeletonTable />` - Table row skeleton
  - [ ] `<SkeletonList />` - List item skeleton

- [ ] **Replace spinners with skeletons in key components:**
  - [ ] `Dashboard.tsx` - Stats cards, issue list, projects list
  - [ ] `ProjectBoard.tsx` - Board loading state
  - [ ] `KanbanBoard.tsx` - Column and card skeletons
  - [ ] `DocumentEditor.tsx` - Editor loading skeleton
  - [ ] `Sidebar.tsx` - Document list skeleton
  - [ ] `ProjectSidebar.tsx` - Project list skeleton
  - [ ] `IssueDetail.tsx` - Issue detail skeleton
  - [ ] `AnalyticsDashboard.tsx` - Chart skeletons

- [ ] **Implement optimistic UI updates:**
  - [ ] Issue creation - Show immediately, sync in background
  - [ ] Issue updates (status, priority, assignee) - Update UI instantly
  - [ ] Comments - Show optimistically
  - [ ] Label creation - Add to list immediately
  - [ ] Board drag-and-drop - Move cards instantly

- [ ] **Add smooth transitions:**
  - [ ] Fade-in when data loads
  - [ ] Skeleton → Content transition (200ms ease)
  - [ ] Loading → Error state transitions

- [ ] **Progress indicators for long operations:**
  - [ ] Bulk operations progress bar
  - [ ] File upload progress
  - [ ] Export generation progress

#### Files to Modify
- `src/components/Dashboard.tsx:105-111` - Loading spinner
- `src/components/ProjectBoard.tsx:33-39` - Loading spinner
- `src/components/ui/LoadingSpinner.tsx` - Replace with Skeleton
- All components using `<LoadingSpinner />` (grep for it)

#### Testing Checklist
- [ ] Test on slow 3G connection (Chrome DevTools)
- [ ] Test rapid navigation between pages
- [ ] Test concurrent mutations (optimistic conflicts)
- [ ] Test error states (failed optimistic updates)

#### Success Metrics
- Perceived load time < 100ms (optimistic UI)
- Skeleton visible for < 500ms on average
- Zero jarring spinner flashes

---

### 2. Email Notifications (P0)

**Impact:** ⭐⭐⭐⭐⭐ Critical for retention
**Effort:** 🟡 Medium (2-3 weeks)
**Status:** ❌ Not Started

#### What & Why
Users need to be notified outside the app. Currently only in-app notifications exist. Email is critical for:
- Keeping users engaged when not in app
- Alerts for @mentions, assignments, comments
- Daily/weekly digests
- Industry standard expectation

#### Implementation Checklist

**Backend (Convex):**
- [ ] **Set up email service integration**
  - [ ] Research options: Resend, SendGrid, AWS SES, Postmark
  - [ ] Recommendation: **Resend** (best DX, free tier, React templates)
  - [ ] Add API keys to Convex environment variables
  - [ ] Test email sending from Convex function

- [ ] **Create email notification system** (`convex/notifications/email.ts`)
  - [ ] `sendEmail(to, subject, html, text)` helper
  - [ ] `sendMentionNotification(userId, issueId, mentionedBy)`
  - [ ] `sendAssignmentNotification(userId, issueId)`
  - [ ] `sendCommentNotification(userId, issueId, comment)`
  - [ ] `sendStatusChangeNotification(watchers, issueId, oldStatus, newStatus)`
  - [ ] `sendDailyDigest(userId, summary)`
  - [ ] `sendWeeklyDigest(userId, summary)`

- [ ] **Create notification preferences table** (`convex/schema.ts`)
  ```typescript
  notificationPreferences: defineTable({
    userId: v.id("users"),
    emailEnabled: v.boolean(), // Master toggle
    mentionsEmail: v.boolean(),
    assignmentsEmail: v.boolean(),
    commentsEmail: v.boolean(),
    statusChangesEmail: v.boolean(),
    dailyDigest: v.boolean(),
    weeklyDigest: v.boolean(),
    digestDay: v.optional(v.string()), // "monday", "friday", etc.
    digestTime: v.optional(v.string()), // "09:00", "17:00", etc.
  }).index("by_user", ["userId"])
  ```

- [ ] **Hook email notifications into existing notification system**
  - [ ] Update `convex/notifications.ts` to check email preferences
  - [ ] Call email functions after creating in-app notifications
  - [ ] Batch emails (don't send 10 emails for 10 comments)

- [ ] **Create scheduled jobs for digests** (`convex/crons.ts`)
  - [ ] Daily digest cron (runs every morning)
  - [ ] Weekly digest cron (runs on configured day)
  - [ ] Query users with digest enabled
  - [ ] Generate digest summary
  - [ ] Send digest emails

**Frontend (React):**
- [ ] **Create notification preferences UI** (`src/components/NotificationPreferences.tsx`)
  - [ ] Email notifications toggle (master switch)
  - [ ] Individual notification type toggles
  - [ ] Digest frequency selector (none, daily, weekly)
  - [ ] Digest time picker
  - [ ] Preview digest option
  - [ ] "Send test email" button

- [ ] **Add preferences to user settings/profile**
  - [ ] Create user settings page if doesn't exist
  - [ ] Add "Notifications" tab
  - [ ] Save preferences mutation

- [ ] **Add unsubscribe functionality**
  - [ ] Create unsubscribe page (`/unsubscribe/:token`)
  - [ ] Generate unsubscribe tokens
  - [ ] One-click unsubscribe from digest emails

**Email Templates:**
- [ ] **Create email templates** (React Email or MJML)
  - [ ] Base layout template (header, footer, branding)
  - [ ] Mention notification template
  - [ ] Assignment notification template
  - [ ] Comment notification template
  - [ ] Daily digest template
  - [ ] Weekly digest template
  - [ ] Welcome email template

- [ ] **Template variables:**
  - [ ] Issue title, key, status, priority
  - [ ] Commenter name, comment text
  - [ ] Issue URL (deep link to specific issue)
  - [ ] Unsubscribe link
  - [ ] Project name
  - [ ] Action button ("View Issue")

**Testing:**
- [ ] **Test all notification types**
  - [ ] Send test mention
  - [ ] Send test assignment
  - [ ] Send test comment
  - [ ] Trigger digest generation
  - [ ] Test batch notifications (multiple events)

- [ ] **Test edge cases:**
  - [ ] Email disabled in preferences
  - [ ] Invalid email address
  - [ ] User deleted
  - [ ] Unsubscribed user
  - [ ] Email delivery failures

- [ ] **Load testing:**
  - [ ] 100 notifications at once
  - [ ] 1000 users daily digest
  - [ ] Rate limiting (don't spam users)

#### Files to Create
- `convex/notifications/email.ts` - Email sending logic
- `convex/crons.ts` - Scheduled digest jobs
- `src/components/NotificationPreferences.tsx` - Settings UI
- `src/components/UserSettings.tsx` - User settings page
- `emails/` directory - Email templates

#### Files to Modify
- `convex/schema.ts` - Add notificationPreferences table
- `convex/notifications.ts` - Hook in email notifications
- `convex/_generated/api.d.ts` - Auto-generated after schema change

#### External Services Required
- Email service (Resend recommended)
  - Free tier: 3,000 emails/month
  - Paid: $20/month for 50,000 emails
  - React Email templates built-in

#### Success Metrics
- Email delivery rate > 98%
- Open rate > 40% (industry average 20-30%)
- Unsubscribe rate < 1%
- Email sent within 5 minutes of event

---

### 3. Onboarding Flow (P0)

**Impact:** ⭐⭐⭐⭐⭐ Increases activation rate 3x
**Effort:** 🟢 Low (2 weeks)
**Status:** ❌ Not Started

#### What & Why
Currently users are dropped into an empty dashboard with no guidance. Research shows:
- Users who complete onboarding are 3x more likely to stick around
- First impression matters - if users don't understand value in 60 seconds, they bounce
- Competitors (Linear, Notion, ClickUp) all have excellent onboarding

#### Implementation Checklist

**Phase 1: Welcome Tour (Intro.js or Shepherd.js)**
- [ ] **Install tour library**
  - [ ] Research: Intro.js vs Shepherd.js vs Driver.js
  - [ ] Recommendation: **Driver.js** (lightweight, no jQuery, TypeScript)
  - [ ] `pnpm add driver.js`

- [ ] **Create onboarding tour** (`src/components/Onboarding/WelcomeTour.tsx`)
  - [ ] Step 1: Welcome message
  - [ ] Step 2: Show command palette (⌘K)
  - [ ] Step 3: Point to "Create Project" button
  - [ ] Step 4: Explain dashboard layout
  - [ ] Step 5: Show sidebar navigation
  - [ ] Step 6: Finish with "Create your first project" CTA

- [ ] **Track onboarding progress** (`convex/schema.ts`)
  ```typescript
  users: defineTable({
    // ...existing fields
    onboardingCompleted: v.boolean(),
    onboardingStep: v.optional(v.number()),
    lastOnboardingAt: v.optional(v.number()),
  })
  ```

- [ ] **Show tour on first login**
  - [ ] Check `onboardingCompleted` flag
  - [ ] Auto-start tour for new users
  - [ ] "Skip tour" option
  - [ ] "Restart tour" in help menu

**Phase 2: Sample Project with Demo Data**
- [ ] **Create sample project generator** (`convex/onboarding.ts`)
  - [ ] `createSampleProject(userId)` mutation
  - [ ] Generate "Sample Project" with key "SAMPLE"
  - [ ] Create 3 workflow states (To Do, In Progress, Done)
  - [ ] Create 10 sample issues:
    - [ ] 3 bugs (high priority, with descriptions)
    - [ ] 4 tasks (various priorities)
    - [ ] 2 stories (with acceptance criteria)
    - [ ] 1 epic (with linked issues)
  - [ ] Create 2 labels ("urgent", "needs-review")
  - [ ] Create 1 sprint ("Sprint 1" - active)
  - [ ] Add 5 sample comments with @mentions
  - [ ] Add sample activity log entries

- [ ] **Pre-populate on first login**
  - [ ] Offer to create sample project
  - [ ] Modal: "Want to explore Cascade with sample data?"
  - [ ] CTA: "Yes, show me around" or "I'll start from scratch"
  - [ ] Create sample project in background
  - [ ] Redirect to sample project board

**Phase 3: Interactive Tutorial**
- [ ] **Guided project creation** (`src/components/Onboarding/ProjectCreationWizard.tsx`)
  - [ ] Step 1: Project name & key
  - [ ] Step 2: Choose board type (Kanban vs Scrum)
  - [ ] Step 3: Configure workflow states
  - [ ] Step 4: Invite team members (optional)
  - [ ] Step 5: Create first issue
  - [ ] Confetti animation on completion 🎉

- [ ] **Achievement system** (gamification)
  - [ ] ✅ Created first project
  - [ ] ✅ Created first issue
  - [ ] ✅ Completed first task
  - [ ] ✅ Invited team member
  - [ ] ✅ Used command palette
  - [ ] ✅ Created first sprint
  - [ ] Track in `convex/schema.ts` (achievements array)

**Phase 4: Video Walkthrough**
- [ ] **Embed walkthrough video** (`src/components/Onboarding/VideoTutorial.tsx`)
  - [ ] Record 2-minute intro video (Loom or similar)
  - [ ] Show key features: boards, documents, search
  - [ ] Embed in dashboard empty state
  - [ ] "Watch video" vs "Skip" buttons

**Phase 5: Progressive Tooltips**
- [ ] **First-use tooltips** (shown once per feature)
  - [ ] Drag-and-drop on kanban board
  - [ ] ⌘K command palette
  - [ ] Quick filters
  - [ ] Bulk operations
  - [ ] Document linking
  - [ ] Sprint planning

- [ ] **Track tooltip display** (`localStorage` or Convex)
  - [ ] `tooltipsShown: string[]` in user preferences
  - [ ] Don't show same tooltip twice

**Phase 6: Onboarding Checklist**
- [ ] **Progress checklist** (`src/components/Onboarding/OnboardingChecklist.tsx`)
  - [ ] Sticky widget in bottom-right
  - [ ] Progress bar (e.g., "3/6 complete")
  - [ ] Expandable/collapsible
  - [ ] Check items:
    - [ ] ✅ Create a project
    - [ ] ✅ Add a team member
    - [ ] ✅ Create an issue
    - [ ] ✅ Complete an issue
    - [ ] ✅ Create a document
    - [ ] ✅ Set up automation
  - [ ] Dismiss when all complete

#### Files to Create
- `src/components/Onboarding/WelcomeTour.tsx`
- `src/components/Onboarding/ProjectCreationWizard.tsx`
- `src/components/Onboarding/VideoTutorial.tsx`
- `src/components/Onboarding/OnboardingChecklist.tsx`
- `convex/onboarding.ts` - Sample data generation

#### Files to Modify
- `convex/schema.ts` - Add onboarding fields to users table
- `src/App.tsx` - Check onboarding status, show tour
- `src/components/Dashboard.tsx` - Show sample project CTA

#### Dependencies
- `driver.js` - Tour library
- `react-confetti` - Celebration animation (optional)

#### Success Metrics
- Onboarding completion rate > 60%
- Time to first project created < 2 minutes
- Activation rate (created project + issue) > 40%
- Retention at Day 7 increases by 50%

---

### 4. Backend Testing (P1)

**Impact:** ⭐⭐⭐⭐ Prevents catastrophic bugs
**Effort:** 🟡 Medium (4 weeks, can run parallel)
**Status:** ❌ Not Started

#### What & Why
Currently **zero backend tests**. Frontend has tests, but backend mutations/queries are untested. This is a ticking time bomb - backend bugs corrupt data and are hard to rollback.

#### Implementation Checklist

**Setup:**
- [ ] **Install Convex test utilities**
  - [ ] `pnpm add -D convex-test`
  - [ ] Create `convex/test-utils.ts` with helpers
  - [ ] Set up test database (separate from dev)

- [ ] **Configure test runner**
  - [ ] Update `package.json` scripts
  - [ ] `"test:convex": "vitest run --config convex/vitest.config.ts"`
  - [ ] Create `convex/vitest.config.ts`
  - [ ] Set up mock authentication

**Test Coverage Plan (80%+ coverage goal):**

- [ ] **Authentication tests** (`convex/auth.test.ts`)
  - [ ] Test user signup
  - [ ] Test user login
  - [ ] Test session creation
  - [ ] Test logout
  - [ ] Test unauthenticated access (should fail)

- [ ] **RBAC tests** (`convex/rbac.test.ts`)
  - [ ] Test role assignment (admin, editor, viewer)
  - [ ] Test permission checks (`assertMinimumRole`)
  - [ ] Test viewer can't edit (should throw)
  - [ ] Test editor can edit
  - [ ] Test admin can delete
  - [ ] Test non-member access (should fail)

- [ ] **Projects tests** (`convex/projects.test.ts`)
  - [ ] Test project creation
  - [ ] Test project update
  - [ ] Test project deletion (owner only)
  - [ ] Test add member
  - [ ] Test remove member
  - [ ] Test update member role
  - [ ] Test project key uniqueness
  - [ ] Test public vs private projects

- [ ] **Issues tests** (`convex/issues.test.ts`)
  - [ ] Test issue creation
  - [ ] Test issue update
  - [ ] Test issue deletion
  - [ ] Test issue assignment
  - [ ] Test status transitions
  - [ ] Test issue linking (blocks, relates)
  - [ ] Test epic hierarchy
  - [ ] Test activity logging

- [ ] **Documents tests** (`convex/documents.test.ts`)
  - [ ] Test document creation
  - [ ] Test document update
  - [ ] Test document deletion
  - [ ] Test document-project linking
  - [ ] Test public/private access

- [ ] **Sprints tests** (`convex/sprints.test.ts`)
  - [ ] Test sprint creation
  - [ ] Test sprint start/end
  - [ ] Test issue assignment to sprint
  - [ ] Test sprint completion
  - [ ] Test velocity calculation

- [ ] **Automation tests** (`convex/automationRules.test.ts`)
  - [ ] Test rule creation
  - [ ] Test rule execution
  - [ ] Test trigger conditions
  - [ ] Test actions (set assignee, priority, etc.)
  - [ ] Test execution tracking

- [ ] **Webhooks tests** (`convex/webhooks.test.ts`)
  - [ ] Test webhook creation
  - [ ] Test webhook trigger
  - [ ] Test event filtering
  - [ ] Test signature generation
  - [ ] Test active/inactive toggle

- [ ] **Notifications tests** (`convex/notifications.test.ts`)
  - [ ] Test mention detection
  - [ ] Test notification creation
  - [ ] Test notification read/unread
  - [ ] Test notification preferences

- [ ] **Analytics tests** (`convex/analytics.test.ts`)
  - [ ] Test issue distribution calculations
  - [ ] Test velocity calculation
  - [ ] Test burndown chart data
  - [ ] Test team performance metrics

**Integration Tests:**
- [ ] **Complex workflows** (`convex/workflows.test.ts`)
  - [ ] Test full issue lifecycle (create → assign → comment → complete)
  - [ ] Test sprint workflow (create sprint → add issues → start → complete)
  - [ ] Test automation workflow (create rule → trigger → verify action)
  - [ ] Test bulk operations (update 100 issues at once)

**Performance Tests:**
- [ ] **Load tests** (`convex/performance.test.ts`)
  - [ ] Test 1000 issues in project (should load in <1s)
  - [ ] Test 100 concurrent users
  - [ ] Test large document (10MB of content)
  - [ ] Test N+1 query patterns (should be batched)

**CI/CD Integration:**
- [ ] **GitHub Actions workflow** (`.github/workflows/test.yml`)
  - [ ] Run tests on every PR
  - [ ] Run tests on push to main
  - [ ] Block merge if tests fail
  - [ ] Report coverage to CodeCov

- [ ] **Pre-commit hook** (Husky)
  - [ ] Run tests before commit
  - [ ] Run linter before commit
  - [ ] Block commit if tests fail

#### Files to Create
- `convex/test-utils.ts` - Test helpers
- `convex/vitest.config.ts` - Test configuration
- `convex/*.test.ts` - Test files (one per module)
- `.github/workflows/test.yml` - CI workflow

#### Dependencies
- `convex-test` - Convex testing utilities
- `vitest` - Already installed for frontend

#### Success Metrics
- Backend code coverage > 80%
- All mutations have tests
- All queries have tests
- Zero data corruption bugs in production

---

### 5. Quick Wins (P1)

**Impact:** ⭐⭐⭐⭐ High impact, low effort
**Effort:** 🟢 Low (1 week total)
**Status:** ❌ Not Started

These are small features that provide outsized value and can be shipped in a few hours each.

#### 5.1 Empty State CTAs

**What:** Add "Create your first X" buttons to all empty states
**Why:** Empty states are passive - users don't know what to do
**Effort:** 2 hours

**Checklist:**
- [ ] Dashboard empty state → "Create your first project" button
- [ ] Project board empty state → "Create your first issue" button
- [ ] Document list empty state → "Create your first document" button
- [ ] Labels empty state → "Add your first label" button
- [ ] Templates empty state → "Create a template" button

**Files to modify:**
- `src/components/ui/EmptyState.tsx` - Add `action` prop

---

#### 5.2 Webhook Logs/History UI

**What:** Show webhook delivery history and status
**Why:** Backend tracks webhook events, but no way to see if they succeeded
**Effort:** 4 hours

**Checklist:**
- [ ] Create `WebhookLogs.tsx` component
- [ ] Query webhook executions from backend
- [ ] Show delivery status (success, failed, retrying)
- [ ] Show request/response data
- [ ] Show error messages
- [ ] Add "Retry" button for failed deliveries
- [ ] Add "Test webhook" button (sends ping event)

**Files to create:**
- `src/components/webhooks/WebhookLogs.tsx`

**Files to modify:**
- `src/components/WebhooksManager.tsx` - Add "View logs" button
- `convex/webhooks.ts` - Add `listExecutions` query

---

#### 5.3 Export to CSV

**What:** Add CSV export in addition to JSON
**Why:** Users want to open exports in Excel
**Effort:** 3 hours

**Checklist:**
- [ ] Create CSV formatter utility (`src/lib/csv.ts`)
- [ ] Add CSV option to export dropdown
- [ ] Generate CSV with headers
- [ ] Handle nested data (flatten)
- [ ] Download as `.csv` file

**Files to create:**
- `src/lib/csv.ts` - CSV formatting utilities

**Files to modify:**
- `src/components/ExportButton.tsx` - Add CSV option
- `convex/export.ts` - Add `exportToCSV` mutation

---

#### 5.4 Keyboard Navigation

**What:** Arrow keys to navigate lists (issues, projects, documents)
**Why:** Power users love keyboard shortcuts
**Effort:** 4 hours

**Checklist:**
- [ ] Add arrow key listeners to lists
- [ ] ↑↓ to select items
- [ ] Enter to open selected item
- [ ] / to focus search
- [ ] Esc to deselect
- [ ] Visual indicator for selected item

**Files to modify:**
- `src/components/Dashboard.tsx` - Issue list navigation
- `src/components/Sidebar.tsx` - Document list navigation
- `src/components/ProjectSidebar.tsx` - Project list navigation

---

#### 5.5 Undo/Redo for Boards

**What:** Ctrl+Z to undo drag-and-drop actions
**Why:** Easy to accidentally drag to wrong column
**Effort:** 6 hours

**Checklist:**
- [ ] Implement action history stack
- [ ] Track board mutations (status change, reorder)
- [ ] Ctrl+Z to undo
- [ ] Ctrl+Shift+Z to redo
- [ ] Show "Undo" toast notification
- [ ] Limit history to last 10 actions

**Files to modify:**
- `src/components/KanbanBoard.tsx` - Add undo/redo

---

#### 5.6 Attachment Upload UI

**What:** Add file attachment picker to issues
**Why:** Backend storage exists, just need UI
**Effort:** 6 hours

**Checklist:**
- [ ] Create file upload component
- [ ] Add "Attach file" button to issue detail
- [ ] Show upload progress
- [ ] Display attached files
- [ ] Download attachment
- [ ] Delete attachment

**Files to create:**
- `src/components/FileUpload.tsx`
- `src/components/AttachmentList.tsx`

**Files to modify:**
- `src/components/IssueDetail.tsx` - Add attachments section
- `convex/issues.ts` - File upload mutation

---

## 🚀 Phase 2 - Detailed Implementation Plan

### 6. Mobile-Responsive Redesign + PWA (P0)

**Impact:** ⭐⭐⭐⭐⭐ Expands addressable market
**Effort:** 🔴 High (4-6 weeks)
**Status:** ❌ Not Started

#### What & Why
Current design is desktop-first. Mobile usage is growing - 60% of web traffic is mobile. Competitors (Linear, AppFlowy) have great mobile apps. PWA enables offline use and push notifications.

#### Implementation Checklist

**Phase 1: Mobile-Responsive Redesign**
- [ ] **Audit mobile experience**
  - [ ] Test all pages on iPhone (375px width)
  - [ ] Test all pages on Android (360px width)
  - [ ] Test on tablet (768px width)
  - [ ] Document all UX issues

- [ ] **Redesign key flows for mobile:**
  - [ ] Dashboard (stack cards vertically)
  - [ ] Kanban board (swipe columns, compact cards)
  - [ ] Issue detail (full screen on mobile)
  - [ ] Navigation (hamburger menu)
  - [ ] Search (full screen modal)
  - [ ] Document editor (mobile toolbar)

- [ ] **Touch-optimized interactions:**
  - [ ] Larger tap targets (44x44px minimum)
  - [ ] Swipe actions (swipe issue to complete)
  - [ ] Pull to refresh
  - [ ] Long press context menus
  - [ ] Bottom sheet modals (instead of centered)

- [ ] **Responsive components:**
  - [ ] Tab bar → Bottom navigation on mobile
  - [ ] Sidebar → Drawer that slides from left
  - [ ] Dropdowns → Full-screen pickers
  - [ ] Tables → Card layout on mobile

**Phase 2: Progressive Web App (PWA)**
- [ ] **PWA setup** (`vite.config.ts`)
  - [ ] Install `vite-plugin-pwa`
  - [ ] Configure service worker
  - [ ] Define app manifest
  - [ ] Add icons (192x192, 512x512)
  - [ ] Set theme color

- [ ] **App manifest** (`public/manifest.json`)
  ```json
  {
    "name": "Cascade - Project Management",
    "short_name": "Cascade",
    "description": "Real-time project management and documentation",
    "theme_color": "#3b82f6",
    "background_color": "#ffffff",
    "display": "standalone",
    "orientation": "portrait",
    "icons": [...]
  }
  ```

- [ ] **Service worker features:**
  - [ ] Cache static assets (CSS, JS, fonts)
  - [ ] Cache API responses (stale-while-revalidate)
  - [ ] Offline fallback page
  - [ ] Background sync (queue mutations when offline)
  - [ ] Push notification support

- [ ] **Install prompt:**
  - [ ] Detect if installable
  - [ ] Show "Add to Home Screen" banner
  - [ ] Track install events

**Phase 3: Offline Mode**
- [ ] **Offline data layer:**
  - [ ] Use IndexedDB for local storage
  - [ ] Sync strategy: optimistic UI + background sync
  - [ ] Queue mutations when offline
  - [ ] Retry queue when back online
  - [ ] Conflict resolution (last write wins)

- [ ] **Offline indicators:**
  - [ ] Show "Offline" banner when disconnected
  - [ ] Show "Syncing..." when reconnecting
  - [ ] Show pending changes count

**Phase 4: Push Notifications**
- [ ] **Push notification setup:**
  - [ ] Request notification permission
  - [ ] Subscribe to push service
  - [ ] Store subscription in Convex
  - [ ] Send test notification

- [ ] **Notification types:**
  - [ ] @mentions
  - [ ] Assignments
  - [ ] Comments on watched issues
  - [ ] Sprint started/ended

#### Dependencies
- `vite-plugin-pwa` - PWA plugin for Vite
- `workbox` - Service worker library
- `idb` - IndexedDB wrapper (for offline storage)

#### Success Metrics
- Mobile load time < 3s on 3G
- Lighthouse mobile score > 90
- PWA installable on all devices
- Offline functionality works for 90% of actions

---

### 7. AI Project Assistant (P0)

**Impact:** ⭐⭐⭐⭐⭐ Major differentiator
**Effort:** 🔴 High (6-8 weeks)
**Status:** ❌ Not Started

#### What & Why
AI is the biggest trend in 2025. Confluence has Rovo AI, Canvas has Gemini integration. Cascade needs an AI assistant to stay competitive. This is our **unique selling point**.

#### Implementation Checklist

**Phase 1: Infrastructure Setup**
- [ ] **Choose AI provider:**
  - [ ] Research: OpenAI, Anthropic Claude, Google Gemini, Mistral
  - [ ] Recommendation: **Anthropic Claude 3.5 Sonnet** (best reasoning, fast)
  - [ ] Alternative: OpenAI GPT-4 Turbo (more popular, cheaper)
  - [ ] Set up API keys in Convex environment

- [ ] **Create AI service** (`convex/ai/`)
  - [ ] `convex/ai/client.ts` - API client wrapper
  - [ ] `convex/ai/prompts.ts` - Prompt templates
  - [ ] `convex/ai/context.ts` - Context builders (project data, issues, etc.)
  - [ ] Rate limiting (5 requests/minute per user)
  - [ ] Token usage tracking
  - [ ] Error handling and retries

**Phase 2: Chat Interface**
- [ ] **Create chat component** (`src/components/AI/AIAssistant.tsx`)
  - [ ] Open with ⌘K → "Ask AI" option
  - [ ] Or dedicated button in header
  - [ ] Full-screen chat modal
  - [ ] Message history (save to Convex)
  - [ ] Typing indicator
  - [ ] Code block rendering
  - [ ] Copy response button
  - [ ] "Regenerate" button

- [ ] **Message UI:**
  - [ ] User messages (right-aligned, blue)
  - [ ] AI responses (left-aligned, gray)
  - [ ] Markdown rendering (for formatted responses)
  - [ ] Loading state (animated dots)
  - [ ] Error state (retry button)

**Phase 3: Natural Language Queries**
- [ ] **Query understanding** (`convex/ai/queries.ts`)
  - [ ] Parse user intent from natural language
  - [ ] Extract filters from query
  - [ ] Convert to Convex query
  - [ ] Execute query and return results

- [ ] **Supported query patterns:**
  - [ ] "Show me overdue issues"
  - [ ] "What's blocking the login feature?"
  - [ ] "List all high priority bugs assigned to me"
  - [ ] "What did Sarah work on last week?"
  - [ ] "Find issues mentioning 'authentication'"
  - [ ] "Show sprint progress"

**Phase 4: Project Insights**
- [ ] **Automatic insights** (`convex/ai/insights.ts`)
  - [ ] Analyze project health
  - [ ] Identify bottlenecks (too many in-progress issues)
  - [ ] Detect overdue tasks
  - [ ] Find unassigned issues
  - [ ] Suggest optimizations

- [ ] **Insight types:**
  - [ ] "Your sprint is at risk - 60% of issues are still in progress"
  - [ ] "5 issues have been in 'In Progress' for >2 weeks"
  - [ ] "Team velocity is down 20% this sprint"
  - [ ] "3 high-priority issues are unassigned"

**Phase 5: Auto-Summarize**
- [ ] **Sprint summaries** (`convex/ai/summarize.ts`)
  - [ ] Summarize completed sprint
  - [ ] Highlight accomplishments
  - [ ] List blockers
  - [ ] Generate standup update

- [ ] **Issue summaries:**
  - [ ] Summarize long comment threads
  - [ ] Extract action items
  - [ ] Identify decisions made

- [ ] **Document summaries:**
  - [ ] TL;DR of long documents
  - [ ] Extract key points
  - [ ] Generate meeting notes

**Phase 6: Smart Suggestions**
- [ ] **Suggest assignees** (`convex/ai/suggestions.ts`)
  - [ ] Analyze issue description
  - [ ] Find team member with relevant expertise
  - [ ] Based on past assignments and skills

- [ ] **Suggest labels:**
  - [ ] Analyze issue content
  - [ ] Recommend relevant labels
  - [ ] Create new labels if needed

- [ ] **Suggest priority:**
  - [ ] Parse urgency from description
  - [ ] Consider context (deadlines, dependencies)
  - [ ] Recommend priority level

- [ ] **Suggest links:**
  - [ ] Find related issues
  - [ ] Find relevant documents
  - [ ] Suggest blocking relationships

**Phase 7: Document Assistance**
- [ ] **Draft generation** (`convex/ai/drafts.ts`)
  - [ ] "Write a project update for stakeholders"
  - [ ] "Draft meeting notes from this discussion"
  - [ ] "Create a PRD for this feature"
  - [ ] Insert into document editor

- [ ] **Document Q&A:**
  - [ ] "What are the acceptance criteria for this feature?"
  - [ ] "When is the deadline?"
  - [ ] "Who is responsible for testing?"
  - [ ] Answer from document content

**Phase 8: Advanced Features (Future)**
- [ ] **Code generation:**
  - [ ] Generate issue descriptions from error logs
  - [ ] Extract requirements from customer requests
  - [ ] Create test cases from acceptance criteria

- [ ] **Voice commands:**
  - [ ] "Create an issue for fixing the login bug"
  - [ ] "Assign PROJ-123 to me"
  - [ ] "Complete task PROJ-456"
  - [ ] Uses Web Speech API

- [ ] **Predictive analytics:**
  - [ ] Predict sprint completion date
  - [ ] Forecast project delivery
  - [ ] Identify at-risk milestones

#### Files to Create
- `convex/ai/client.ts` - AI API client
- `convex/ai/prompts.ts` - Prompt templates
- `convex/ai/queries.ts` - Natural language query parser
- `convex/ai/insights.ts` - Project insights generator
- `convex/ai/summarize.ts` - Summarization logic
- `convex/ai/suggestions.ts` - Smart suggestions
- `convex/ai/drafts.ts` - Document drafting
- `src/components/AI/AIAssistant.tsx` - Chat UI
- `src/components/AI/AIButton.tsx` - Trigger button

#### Dependencies
- `@anthropic-ai/sdk` or `openai` - AI SDK
- `react-markdown` - Render AI responses
- `react-syntax-highlighter` - Code blocks in responses

#### Cost Estimates
- Claude 3.5 Sonnet: $3/million input tokens, $15/million output tokens
- Average query: 1000 input tokens, 500 output tokens = $0.0105 per query
- 1000 users x 10 queries/day = 10,000 queries/day = $105/day = $3,150/month
- Mitigation: Rate limiting, caching responses, user quotas

#### Success Metrics
- AI query success rate > 90% (understands intent)
- Response time < 5 seconds
- User satisfaction score > 4.5/5
- 40% of users use AI assistant weekly

---

### 8. Enhanced Search (P1)

**Impact:** ⭐⭐⭐⭐ Find things 5x faster
**Effort:** 🟡 Medium (3 weeks)
**Status:** ❌ Not Started

#### Implementation Checklist
- [ ] Add search filters (type, status, assignee, project)
- [ ] Fuzzy matching (typo tolerance)
- [ ] Search within documents and comments
- [ ] Recent searches
- [ ] Search shortcuts (`type:bug`, `status:open`, `@me`)
- [ ] Keyboard navigation (↑↓ to select results)
- [ ] Search result highlighting
- [ ] "Advanced search" modal with visual filter builder

#### Files to Modify
- `src/components/GlobalSearch.tsx`
- `convex/search.ts` - Full-text search queries

---

### 9. Performance Optimization (P1)

**Impact:** ⭐⭐⭐⭐ App stays fast as data grows
**Effort:** 🟡 Medium (3 weeks)
**Status:** ❌ Not Started

#### Implementation Checklist
- [ ] Implement query result caching (Convex supports this)
- [ ] Add pagination to all list queries (limit 50, load more)
- [ ] Optimize N+1 queries (batch fetches with Promise.all)
- [ ] Add indexes to all frequently queried fields
- [ ] Lazy load issue list (virtual scrolling with react-window)
- [ ] Compress images and assets
- [ ] Code splitting (lazy load routes)
- [ ] Monitor slow queries (add logging)
- [ ] Database query profiling

#### Success Metrics
- Dashboard load time < 1s (with 1000 issues)
- Issue list scrolling at 60fps
- Search results < 500ms
- Lighthouse performance score > 90

---

## 📋 Backlog - Phase 3 Features

### SSO/SAML
**Status:** Not Started
**Effort:** 4 weeks
**Priority:** P1 (Enterprise requirement)

- [ ] Research SAML libraries for React/Convex
- [ ] Implement SAML authentication flow
- [ ] Support Google Workspace SSO
- [ ] Support Microsoft Entra ID (Azure AD)
- [ ] Support Okta
- [ ] Admin UI for SSO configuration
- [ ] Test with enterprise customers

---

### Document Version History
**Status:** Not Started
**Effort:** 4 weeks
**Priority:** P1 (Confluence's killer feature)

- [ ] Store document snapshots on every save
- [ ] Show version history sidebar
- [ ] Diff view (show changes between versions)
- [ ] Restore previous version
- [ ] Name versions ("Final draft", "v1.2", etc.)
- [ ] Prune old versions (keep last 50, or 30 days)

---

### Native Mobile Apps (iOS/Android)
**Status:** Not Started
**Effort:** 12+ weeks
**Priority:** P2 (Long-term investment)

**Options:**
1. React Native (reuse React components)
2. Flutter (better performance)
3. PWA only (no app store listing)

**Recommendation:** Start with PWA, build native apps only if users demand it.

---

### Offline Mode
**Status:** Not Started
**Effort:** 8 weeks
**Priority:** P2 (Complex, but valuable)

- [ ] Offline-first architecture (like AppFlowy)
- [ ] Local database (IndexedDB or SQLite)
- [ ] Sync engine (conflict resolution)
- [ ] Optimistic UI updates
- [ ] Background sync
- [ ] "Offline mode" indicator

---

### Collaborative Whiteboards
**Status:** Not Started
**Effort:** 8 weeks
**Priority:** P2 (Nice to have)

**Options:**
1. Integrate Excalidraw (open-source whiteboard)
2. Integrate tldraw (modern whiteboard library)
3. Build custom (too much work)

**Recommendation:** Integrate Excalidraw - battle-tested, embeddable.

- [ ] Embed Excalidraw in documents
- [ ] Real-time collaboration (multiple cursors)
- [ ] Save whiteboards to Convex
- [ ] Export as PNG/SVG
- [ ] Link whiteboards to issues

---

### Integrations

#### Slack Integration
**Status:** Not Started
**Effort:** 2 weeks
**Priority:** P2

- [ ] Slack app setup (OAuth)
- [ ] Post issue updates to channels
- [ ] Create issues from Slack (`/cascade create issue`)
- [ ] Unfurl issue links (show preview)
- [ ] Subscribe channels to projects

#### GitHub Integration
**Status:** Not Started
**Effort:** 2 weeks
**Priority:** P2

- [ ] GitHub app setup (OAuth)
- [ ] Link commits to issues (`Fixes PROJ-123`)
- [ ] Link PRs to issues
- [ ] Auto-update issue status (merged → done)
- [ ] Show commit history in issue

#### Google Calendar Sync
**Status:** Not Started
**Effort:** 2 weeks
**Priority:** P2

- [ ] Google Calendar API integration
- [ ] Sync issue due dates to calendar
- [ ] Sync sprint dates to calendar
- [ ] Two-way sync (update in calendar → updates issue)
- [ ] Create calendar events from issues

---

## 📊 Metrics & Success Criteria

### Key Performance Indicators (KPIs)

**User Activation:**
- Goal: 60% of signups create a project within 24 hours
- Current: Unknown (need analytics)

**User Retention:**
- Goal: 40% Day 7 retention
- Goal: 20% Day 30 retention
- Current: Unknown (need analytics)

**Engagement:**
- Goal: 5 issues created per user per week
- Goal: 3 sessions per user per week
- Goal: 15 minutes average session duration

**Performance:**
- Goal: Dashboard loads in < 1 second
- Goal: 95% of queries complete in < 500ms
- Goal: Lighthouse score > 90

**Quality:**
- Goal: Backend test coverage > 80%
- Goal: Frontend test coverage > 70%
- Goal: Zero data corruption bugs

**Growth:**
- Goal: 10% week-over-week user growth
- Goal: 5% week-over-week project growth

---

## 🚧 Known Issues & Technical Debt

### Critical Issues
- [ ] **No backend testing** - Risk of data corruption
- [ ] **Webhook secrets stored plain text** - Security risk
- [ ] **No rate limiting on API** - Can be abused
- [ ] **N+1 query patterns** - Performance degradation at scale

### High Priority
- [ ] **Refactored components not integrated** - `.refactored.tsx` files exist but unused
- [ ] **Deprecated members array** - Schema comment says deprecated but still used
- [ ] **No data migration strategy** - Schema changes risk breaking changes
- [ ] **Unbounded queries** - Some queries don't paginate (risk OOM)

### Medium Priority
- [ ] **No caching strategy** - All queries hit DB
- [ ] **Large activity logs** - No archiving (grows indefinitely)
- [ ] **No search result limiting** - Could return 10,000 results
- [ ] **Missing API documentation** - No public API docs

### Low Priority
- [ ] **No TypeScript strict mode in Convex** - Some type unsafety
- [ ] **Inconsistent error messages** - Some are technical, some user-friendly
- [ ] **No monitoring/alerting** - Don't know when things break

---

## 📚 Resources & References

### Documentation
- [Convex Docs](https://docs.convex.dev/)
- [React 19 Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [BlockNote Editor](https://www.blocknotejs.org/)
- [Vite Guide](https://vitejs.dev/guide/)

### Competitive Analysis
- **Linear** - Best-in-class issue tracking UX
- **Notion** - Flexible documents and databases
- **Confluence** - Document collaboration standard
- **Jira** - Project management standard
- **ClickUp** - All-in-one productivity
- **Monday.com** - Visual project management
- **Asana** - Team collaboration

### Inspiration
- **Cal.com** - Open source scheduling
- **AppFlowy** - Open source Notion alternative
- **Kimai** - Time tracking
- **Canvas LMS** - Learning management

### Tools
- **Resend** - Email notifications
- **Driver.js** - Product tours
- **Excalidraw** - Whiteboards
- **Anthropic Claude** - AI assistant
- **PostHog** - Product analytics (already integrated)

---

## 🔄 How to Use This TODO

### Daily Standup
1. Check Phase 1 tasks
2. Pick highest priority uncompleted task
3. Update status (In Progress)
4. Work on task
5. Mark complete when done
6. Move to next task

### Weekly Planning
1. Review Phase 1 progress
2. Estimate completion date
3. Identify blockers
4. Plan next week's tasks
5. Update priorities if needed

### Monthly Review
1. Calculate completion %
2. Review metrics (KPIs)
3. Adjust roadmap if needed
4. Celebrate wins 🎉

### Quarterly Planning
1. Review all phases
2. Reprioritize based on user feedback
3. Add new features to backlog
4. Archive completed phases

---

## 🎯 North Star Metric

**The one metric that matters:**

> **Weekly Active Projects**
>
> A project is "active" if it has at least one issue created, updated, or commented on in the past 7 days.
>
> Goal: 1,000 weekly active projects by end of 2025.

Why this metric?
- Measures actual product usage (not just signups)
- Correlates with retention and engagement
- Easy to track and understand
- Aligns with business goals (more active projects = more value)

---

## ✅ How to Mark Tasks Complete

When you complete a task:
1. Change `[ ]` to `[x]`
2. Add completion date: `[x] Task name (completed 2025-01-20)`
3. Add notes if needed: `[x] Task name - Note: chose Resend over SendGrid`
4. Commit to git: `git commit -m "feat: completed loading skeletons"`
5. Celebrate! 🎉

---

**Next Steps:** Start with Phase 1, Task 1 (Loading Skeletons). Let's ship something this week! 🚀
