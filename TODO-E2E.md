# E2E Test Suite - Gap Analysis & TODO

> **Generated:** 2026-02-02
> **Last Updated:** 2026-02-02
> **Current Status:** 84 passing, 8 skipped, ~60% route coverage

---

## Recent Changes (2026-02-02)

### Completed
- [x] Removed hardcoded timeouts from `landing.page.ts` (4 instances)
- [x] Removed hardcoded timeouts from `dashboard.page.ts` (2 instances)
- [x] Removed hardcoded timeouts from `rbac.fixture.ts` (3 instances)
- [x] Rewrote `waitForSignUpResult()` in `auth-helpers.ts` to use `Promise.race`
- [x] Fixed silent failure in `calendar.spec.ts` - now throws error if no view buttons found
- [x] Fixed flaky Issue Detail tests - added `switchToTab("backlog")` before opening issue detail
- [x] Fixed `openIssueDetail()` to wait for timer button visibility
- [x] Fixed silent failure patterns in `rbac.spec.ts` - replaced `.catch(() => false)` with `.count()` checks
- [x] Fixed silent failure patterns in `auth.spec.ts` - rewrote toast handling with `Promise.race`
- [x] Made Issue Detail tests self-contained - added workspace creation for test isolation
- [x] Added URL verification after `createProject()` in Issue Detail tests
- [x] Completed billing spec TODOs - implemented billable checkbox visibility tests
- [x] Deleted debug spec files (`debug-cp.spec.ts`, `debug-auth.spec.ts`)

### Remaining Hardcoded Timeouts
~11 instances removed, ~11 still remain in other files (lower priority)

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Current Coverage](#current-coverage)
- [P0 - Critical Blockers](#p0---critical-blockers)
- [P1 - High Priority Gaps](#p1---high-priority-gaps)
- [P2 - Medium Priority Improvements](#p2---medium-priority-improvements)
- [P3 - Nice to Have](#p3---nice-to-have)
- [Implementation Issues](#implementation-issues)
  - [Hardcoded Timeouts](#hardcoded-timeouts)
  - [Silent Failure Patterns](#silent-failure-patterns)
  - [Shallow Tests](#shallow-tests)
  - [Incomplete Implementations](#incomplete-implementations)
- [Missing Infrastructure](#missing-infrastructure)
  - [Page Objects](#page-objects)
  - [Fixtures](#fixtures)
  - [Utilities](#utilities)
- [Untested Routes](#untested-routes)
- [Test Quality Metrics](#test-quality-metrics)

---

## Executive Summary

The E2E test suite has solid foundations for auth, dashboard, and basic workflows. However, several critical features lack coverage, and implementation patterns introduce flakiness risks.

**Key Stats:**
| Metric | Value |
|--------|-------|
| Total Tests | 92 (84 pass, 8 skip) |
| Route Coverage | ~60% |
| Depth Coverage | ~40% |
| Flaky Risk Areas | 22 hardcoded timeouts |
| Blocked Features | Documents (BlockNote) |

**Immediate Actions Needed:**
1. Remove hardcoded timeouts (flaky CI risk)
2. Fix silent failure patterns (hiding bugs)
3. Add team board coverage (core feature)
4. Resolve BlockNote incompatibility (blocks docs)

---

## Current Coverage

### Well-Tested Areas ✅
- [x] Auth flows (sign in, sign up, password reset)
- [x] Onboarding wizard (all personas)
- [x] Dashboard navigation and tabs
- [x] Project creation from templates
- [x] Issue creation and detail view
- [x] RBAC (admin/editor/viewer visibility)
- [x] Organization settings
- [x] Workspace creation
- [x] Calendar page navigation
- [x] Time tracking (start/stop timer)
- [x] User invitations (send, list, revoke)
- [x] Sign out flow
- [x] Error scenarios (404s, auth redirects)

### Partially Tested Areas ⚠️
- [ ] Global search (modal opens, but no result verification)
- [ ] Project analytics (visibility only, no data tests)
- [ ] Project settings (RBAC redirect only)
- [ ] Notifications (panel opens, no content tests)
- [ ] Theme toggle (class applied, no persistence test)
- [ ] Keyboard shortcuts (modal shows, no action tests)
- [ ] Billing settings (TODOs in implementation)

### Untested Areas ❌
- [ ] Document editing (BlockNote blocked)
- [ ] Team boards and calendars
- [ ] Roadmap view
- [ ] Project activity feed
- [ ] Issue drag-drop between columns
- [ ] Custom workflow states
- [ ] OAuth sign-in (Google)
- [ ] Invite acceptance flow
- [ ] Real-time collaboration/presence
- [ ] Email notifications
- [ ] Multi-user concurrent scenarios

---

## P0 - Critical Blockers

### 1. BlockNote React 19 Incompatibility
**Status:** BLOCKED
**Impact:** All document tests skipped (~8% coverage loss)
**Files:** `e2e/documents.spec.ts`

```
BlockNote 0.15 is incompatible with React 19.
Document collaboration, editing, and templates cannot be tested.
```

**Action Required:**
- [ ] Track BlockNote React 19 support issue
- [ ] Consider alternative editor if no fix coming
- [ ] Or: Pin React 18 for E2E environment only

### 2. Team Board/Calendar Not Tested
**Status:** NO COVERAGE
**Impact:** Core collaboration feature untested
**Routes:** `/workspaces/$slug/teams/$teamSlug/*`

**Action Required:**
- [ ] Create `TeamBoardPage` page object
- [ ] Create `e2e/teams.spec.ts` test file
- [ ] Test team board CRUD operations
- [ ] Test team calendar integration
- [ ] Test team settings access

### 3. Roadmap View Not Tested
**Status:** NO COVERAGE
**Impact:** Core PM feature untested
**Route:** `/projects/$key/roadmap`

**Action Required:**
- [ ] Create `RoadmapPage` page object
- [ ] Create `e2e/roadmap.spec.ts` test file
- [ ] Test roadmap display
- [ ] Test issue placement on timeline
- [ ] Test drag-drop between quarters

---

## P1 - High Priority Gaps

### 4. OAuth Sign-In Flow
**Status:** NO COVERAGE
**Impact:** Major auth path untested

**Action Required:**
- [ ] Create OAuth mock/stub in fixtures
- [ ] Test Google OAuth button flow
- [ ] Test redirect → callback → user creation
- [ ] Create `e2e/oauth.spec.ts`

### 5. Invite Acceptance Flow
**Status:** PARTIAL (send only)
**Impact:** Onboarding incomplete

**Action Required:**
- [ ] Create `InvitePage` page object
- [ ] Test invite token page load
- [ ] Test accept invite → join org flow
- [ ] Test expired/invalid invite handling

### 6. Issue Detail Page Route
**Status:** NO COVERAGE
**Route:** `/issues/$key`

**Action Required:**
- [ ] Test direct issue URL navigation
- [ ] Test issue detail page layout
- [ ] Test edit/update from detail page
- [ ] Test issue linking/relationships

### 7. Project Activity Feed
**Status:** NO COVERAGE
**Route:** `/projects/$key/activity`

**Action Required:**
- [ ] Create activity feed tests
- [ ] Test activity log display
- [ ] Test filtering by activity type
- [ ] Test pagination

---

## P2 - Medium Priority Improvements

### 8. Deepen Search Tests
**Current:** Modal opens only
**Needed:** Result verification

- [ ] Test search returns matching issues
- [ ] Test search filters (project, type, status)
- [ ] Test "no results" state
- [ ] Test search result navigation

### 9. Deepen Analytics Tests
**Current:** Visibility check only
**Needed:** Data verification

- [ ] Test chart rendering
- [ ] Test date range filtering
- [ ] Test metric calculations
- [ ] Test export functionality

### 10. Issue Drag-Drop
**Status:** NO COVERAGE
**Impact:** Core board interaction

- [ ] Create drag-drop test helpers
- [ ] Test move issue between columns
- [ ] Test reorder within column
- [ ] Test bulk move operations

### 11. Custom Workflow States
**Status:** NO COVERAGE

- [ ] Test workflow state CRUD
- [ ] Test state transition rules
- [ ] Test issue status changes via workflow

### 12. Permission Cascade Testing
**Current:** Single-level RBAC only
**Needed:** Org → Workspace → Project cascade

- [ ] Test org-level permission inheritance
- [ ] Test workspace-level overrides
- [ ] Test project-level restrictions

### 13. Time Approval Workflow
**Status:** Settings exist, workflow untested

- [ ] Test time entry submission
- [ ] Test manager approval flow
- [ ] Test rejection and revision
- [ ] Test approval status updates

---

## P3 - Nice to Have

### 14. Multi-Browser Testing
**Current:** Chromium only

- [ ] Enable Firefox in playwright.config.ts
- [ ] Enable Safari/WebKit
- [ ] Enable mobile viewports
- [ ] Fix any browser-specific issues

### 15. Visual Regression Testing
**Current:** None

- [ ] Integrate Percy or similar
- [ ] Add visual snapshots for key pages
- [ ] Set up baseline comparison in CI

### 16. Performance Testing
**Current:** None

- [ ] Add dashboard load time assertions
- [ ] Add search latency checks
- [ ] Add board render benchmarks
- [ ] Create performance baseline

### 17. Real-Time Collaboration Tests
**Current:** None

- [ ] Test presence indicators
- [ ] Test live cursor tracking
- [ ] Test concurrent edits
- [ ] Test conflict resolution

### 18. Email Notification Tests
**Current:** None

- [ ] Test notification triggers
- [ ] Test email content via mock OTP pattern
- [ ] Test notification preferences

---

## Implementation Issues

### Hardcoded Timeouts

These introduce flakiness. Replace with element-based waits.

#### Fixed (2026-02-02)
| File | Status |
|------|--------|
| `pages/landing.page.ts` | ✅ Fixed - 4 timeouts removed |
| `pages/dashboard.page.ts` | ✅ Fixed - 2 timeouts removed |
| `fixtures/rbac.fixture.ts` | ✅ Fixed - 3 timeouts removed |
| `utils/auth-helpers.ts` | ✅ Fixed - rewritten with Promise.race |

#### Remaining (Lower Priority)
| File | Line | Current | Fix |
|------|------|---------|-----|
| `utils/auth-helpers.ts` | various | Other polling loops | Convert to event-driven |
| `pages/settings.page.ts` | TBD | Check for timeouts | Element waits |
| `pages/workspaces.page.ts` | TBD | Check for timeouts | Element waits |

**Progress: ~11/22 instances fixed**

---

### Silent Failure Patterns

These hide test failures. Replace with proper assertions.

```typescript
// ❌ BAD - Silently skips if element missing
const visible = await element.isVisible().catch(() => false);

// ✅ GOOD - Fails loudly if element should exist
await expect(element).toBeVisible();

// ✅ GOOD - Explicit optional check with assertion
if (await element.isVisible()) {
  await expect(element).toHaveText('expected');
} else {
  throw new Error('Element should be visible but was not');
}
```

| File | Line | Pattern | Fix |
|------|------|---------|-----|
| `calendar.spec.ts` | 68-70 | `.catch(() => false)` | Assert buttons exist |
| `rbac.spec.ts` | 82, 98 | `.catch(() => false)` | Assert RBAC elements |
| `rbac.spec.ts` | 166, 182, 244 | `.catch(() => false)` | Assert permissions |
| `auth.spec.ts` | 158-168 | `.catch(() => {})` | Assert toast appears |
| `integration-workflow.spec.ts` | 176-179 | `.catch(() => false)` | Assert search modal |

---

### Shallow Tests

These only check visibility, not functionality.

| File | Test | Current | Should Test |
|------|------|---------|-------------|
| `calendar.spec.ts` | View switches | Button exists | Calendar updates |
| `rbac.spec.ts` | Permission checks | Tab visible | Actions work |
| `dashboard.spec.ts` | Filter issues | Method called | Results filtered |
| `issues.spec.ts` | Timer controls | Button exists | Timer actually runs |
| `error-scenarios.spec.ts` | 404 pages | Error text | HTTP 404 response |

---

### Incomplete Implementations

| File | Line | Issue |
|------|------|-------|
| ~~`settings/billing.spec.ts`~~ | ~~29-43~~ | ~~`// TODO: Navigate to time entry form...`~~ ✅ Fixed |
| ~~`settings/billing.spec.ts`~~ | ~~46-61~~ | ~~`// TODO: Verify billable checkbox...`~~ ✅ Fixed |
| `onboarding.spec.ts` | 78 | `// TODO: Dashboard stuck in loading...` |
| `onboarding.spec.ts` | 123, 155 | `// TODO: Storage state becomes invalid...` |

---

## Missing Infrastructure

### Page Objects

| Page Object | Route | Priority |
|-------------|-------|----------|
| `TeamBoardPage` | `/workspaces/$slug/teams/$teamSlug/board` | P0 |
| `RoadmapPage` | `/projects/$key/roadmap` | P0 |
| `ActivityFeedPage` | `/projects/$key/activity` | P1 |
| `InvitePage` | `/invite/$token` | P1 |
| `IssueDetailPage` | `/issues/$key` | P1 |
| `TimeTrackingPage` | `/time-tracking` | P2 |
| `AnalyticsPage` | `/projects/$key/analytics` | P2 |

### Fixtures

| Fixture | Purpose | Priority |
|---------|---------|----------|
| Multi-user concurrent | Real-time collab tests | P2 |
| Permission cascade | Org→WS→Project tests | P2 |
| OAuth mock | Google sign-in tests | P1 |
| Timezone | Calendar/time tests | P3 |

### Utilities

| Utility | Purpose | Priority |
|---------|---------|----------|
| `drag-drop-helpers.ts` | Board interactions | P2 |
| `performance-helpers.ts` | Load time assertions | P3 |
| `visual-regression-helpers.ts` | Screenshot comparison | P3 |

---

## Untested Routes

### Completely Untested

| Route | Feature | Priority | Status |
|-------|---------|----------|--------|
| `/projects/$key/roadmap` | Roadmap view | P0 | ✅ `roadmap.spec.ts` |
| `/projects/$key/activity` | Activity feed | P1 | |
| `/workspaces/$slug/teams/$teamSlug/board` | Team board | P0 | ✅ `teams.spec.ts` |
| `/workspaces/$slug/teams/$teamSlug/calendar` | Team calendar | P1 | |
| `/workspaces/$slug/teams/$teamSlug/settings` | Team settings | P2 | |
| `/documents` | Document library | BLOCKED | |
| `/documents/$id` | Document editor | BLOCKED | |
| `/documents/templates` | Doc templates | BLOCKED | |
| `/issues/$key` | Issue detail page | P1 | ✅ `issue-detail-page.spec.ts` |
| `/time-tracking` | Org time tracking | P2 | |
| `/invite/$token` | Invite acceptance | P1 | ✅ `invite.spec.ts` + screenshots |

### Partially Tested (Shallow)

| Route | Current | Needed |
|-------|---------|--------|
| `/projects/$key/analytics` | Heading visible | Charts, data |
| `/projects/$key/settings` | Redirect test | Full settings |
| `/projects/$key/billing` | None | Billing flow |

---

## Test Quality Metrics

### Target Metrics

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Route Coverage | 60% | 90% | 30% |
| Depth Coverage | 40% | 75% | 35% |
| Flaky Tests | ~5% | <1% | 4% |
| Avg Test Time | 2s | 1.5s | 0.5s |
| CI Pass Rate | ~95% | >99% | 4% |

### Coverage by Feature Area

| Area | Coverage | Target |
|------|----------|--------|
| Auth & Onboarding | 85% | 95% |
| Dashboard & Nav | 75% | 90% |
| Issues & Projects | 65% | 90% |
| Documents | 5% | 80% |
| Teams & Workspaces | 50% | 85% |
| Settings & Admin | 70% | 90% |
| Real-time Features | 0% | 60% |
| OAuth/Integrations | 0% | 70% |

---

## Progress Tracking

### Sprint 1: Stability (Est. 2-3 days) - COMPLETE ✅
- [x] Remove hardcoded timeouts from high-traffic files (11/22 done)
- [x] Fix silent failure pattern in calendar.spec.ts
- [x] Fix flaky Issue Detail tests (including test isolation with workspace creation)
- [x] Fix silent failure patterns in rbac.spec.ts (replaced with `.count()` checks)
- [x] Fix silent failure patterns in auth.spec.ts (rewrote with `Promise.race`)
- [x] Complete billing test TODOs (implemented billable checkbox visibility tests)
- [x] Delete debug spec files (debug-cp.spec.ts, debug-auth.spec.ts)

### Sprint 2: Core Coverage (Est. 3-5 days) - COMPLETE ✅
- [x] Add TeamBoardPage + tests (`e2e/teams.spec.ts`)
- [x] Add RoadmapPage + tests (`e2e/roadmap.spec.ts`)
- [x] Add InvitePage + acceptance flow (`e2e/invite.spec.ts`)
- [x] Add issue detail page tests (`e2e/issue-detail-page.spec.ts`)

### Sprint 3: Depth (Est. 3-5 days)
- [ ] Deepen search tests
- [ ] Deepen analytics tests
- [ ] Add drag-drop tests
- [ ] Add permission cascade tests

### Sprint 4: Advanced (Est. 5+ days)
- [ ] Resolve BlockNote issue
- [ ] Add OAuth flow tests
- [ ] Add multi-browser testing
- [ ] Add performance baselines

---

## Related Documentation

- [Testing Guide](./docs/testing/README.md)
- [Convex Testing](./convex/README.md)
- [E2E Config](./e2e/config.ts)
- [Playwright Config](./playwright.config.ts)
