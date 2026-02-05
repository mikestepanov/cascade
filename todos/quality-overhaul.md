# Quality Overhaul

> **Priority:** P0/P2 (Mixed - E2E is blocking, tech debt is maintenance)
> **Effort:** Large
> **Status:** In Progress

---

## Problem Statement

### E2E Tests (P0 - Blocking)

Our E2E tests have accumulated technical debt that makes them unreliable and meaningless:

1. ~~**Generic selectors**~~ ✅ DONE - Fixed high-severity unscoped selectors in activity-feed.spec.ts and invite.spec.ts
2. ~~**Loosened assertions**~~ ✅ DONE - Fixed meaningless assertions (e.g., "check any image exists" → check actual error icon)
3. ~~**No centralized selectors**~~ ✅ DONE - Created shared `TEST_IDS` constants
4. ~~**Missing data-testid**~~ ✅ DONE - Key components updated, AST validator enforces usage

**Impact:** Tests pass but don't verify behavior. Bugs ship. Developer trust in tests erodes.

### Code Quality (P2 - Maintenance)

1. **Type inconsistency** - Types duplicated across files instead of using Convex-generated types
2. **Low docstring coverage** - 32.5% coverage on Convex functions
3. **Console.log pollution** - Debug logs in production code
4. ~~**High complexity functions**~~ ✅ DONE - All Biome complexity warnings resolved

---

## Completed Tasks

### ✅ Task 1: Shared Test ID Constants (DONE)

**Implementation:** Created shared `TEST_IDS` constants following StartHub pattern where BOTH production components AND E2E tests import from the same source.

**Files created/modified:**
- `src/lib/test-ids.ts` - Single source of truth for test IDs
- `e2e/locators/index.ts` - Re-exports TEST_IDS from shared file
- `scripts/validate/check-test-ids.js` - AST validator enforces all data-testid uses TEST_IDS constants

**Usage pattern:**
```typescript
// In components:
import { TEST_IDS } from "@/lib/test-ids";
<button data-testid={TEST_IDS.ISSUE.CARD}>

// In E2E tests:
import { TEST_IDS } from "../src/lib/test-ids";
page.getByTestId(TEST_IDS.ISSUE.CARD);
```

### ✅ Task 3: Add data-testid to Components (DONE)

**Components updated:**
- [x] `src/components/IssueCard.tsx` - `ISSUE.CARD`, `ISSUE.KEY`, `ISSUE.PRIORITY`
- [x] `src/components/Kanban/KanbanColumn.tsx` - `BOARD.COLUMN`, `BOARD.COLUMN_HEADER`, `BOARD.COLUMN_COUNT`
- [x] `src/components/GlobalSearch.tsx` - `SEARCH.MODAL`, `SEARCH.RESULT_ITEM`, `SEARCH.RESULT_TYPE`
- [x] `src/components/auth/SignInForm.tsx` - `AUTH.EMAIL_INPUT`, `AUTH.PASSWORD_INPUT`, `AUTH.SUBMIT_BUTTON`
- [x] `src/components/ActivityFeed.tsx` - `ACTIVITY.FEED`, `ACTIVITY.ENTRY`
- [x] `src/components/CommandPalette.tsx` - `EDITOR.COMMAND_PALETTE`
- [x] `src/components/CreateProjectFromTemplate.tsx` - `PROJECT.CREATE_MODAL`, `PROJECT.NAME_INPUT`, `PROJECT.KEY_INPUT`
- [x] `src/components/IssueDetailModal.tsx` - `ISSUE.DETAIL_MODAL`
- [x] `src/components/PlateEditor.tsx` - `EDITOR.PLATE`

**Note:** `WorkspaceCard.tsx` and `Logo.tsx` don't exist in this codebase - they were hypothetical in the original plan. TEST_IDS are defined but components need to be created if these features are added.

### ✅ Task 5: Audit and Fix Meaningless Tests (DONE)

**Findings from audit (18 issues found, 7 high severity):**
- [x] `e2e/activity-feed.spec.ts` — All 6 unscoped selectors fixed (scoped to `TEST_IDS.ACTIVITY.FEED` container)
- [x] `e2e/invite.spec.ts` — Fixed meaningless `page.locator("img").first()` (invalid invite page has no img; now checks actual AlertCircle error icon)

### ✅ Task 10: Console.log Audit (DONE)

**Result:** Zero `console.log` calls found in `src/**/*.{ts,tsx}` (excluding test files). Production code is clean.

### ✅ Task 4: Update E2E Tests to Use TEST_IDS Constants (DONE)

**Result:** All `getByTestId()` calls already use TEST_IDS constants (enforced by `check-test-ids.js` AST validator). No raw string `getByTestId("...")` calls found in any of the 26 spec files or 10 page objects.

### ✅ Task 6: E2E Quality Validation Script (DONE)

**Created:** `scripts/validate/check-e2e-quality.js` — line-based checker for E2E anti-patterns.

**Rules (errors):**
- `.first()` on broad page-level tag selectors (`page.locator("img").first()`)
- Generic CSS class selectors on `page` (`.animate-pulse`, `.animate-spin`, `.grid`, `.flex`)
- `waitForSelector()` usage (deprecated Playwright API)

**Rules (warnings):**
- `waitForLoadState("networkidle")` — flaky pattern, prefer element assertions

**Integration:** Added as Check 8 in `scripts/validate.js`. Runs in CI.

**Files fixed to pass validator (11 errors resolved):**
- `e2e/analytics.spec.ts` — 5x `.animate-pulse` → wait for analytics heading
- `e2e/onboarding.spec.ts` — 2x `.animate-spin` → wait for dashboard heading
- `e2e/pages/dashboard.page.ts` — `.animate-spin` → `getByRole("status")` / `[data-loading-spinner]`
- `e2e/pages/documents.page.ts` — `page.locator("aside").first()` → `getByRole("complementary")`
- `e2e/pages/projects.page.ts` — `page.locator("aside").first()` → `getByRole("complementary")`
- `e2e/pages/workspaces.page.ts` — `page.locator(".grid")` → scoped main-content locator

### ✅ Task 7: RULES.md E2E Standards (DONE)

**Updated:** `RULES.md` Playwright/E2E Testing section expanded with:
- Selector priority guide (accessible → TEST_IDS → data attrs → scoped CSS)
- Test ID constants pattern (shared `src/lib/test-ids.ts`)
- Anti-patterns table (enforced by `check-e2e-quality.js`)
- Scoping selectors examples (container-scoped vs unscoped)

### ✅ Task 11: Biome Complexity Warnings (DONE)

All complexity warnings resolved:
- [x] `parseMarkdown` (43 → <15) - extracted block parsers
- [x] `isEmptyValue` (21 → <15) - extracted helper functions
- [x] `FilterBar` (25 → <15) - extracted sub-components
- [x] `KanbanBoard.tsx` filter callback (17 → <15) - extracted filter helpers
- [x] `FloatingToolbar.tsx` useEffect (16 → <15) - extracted getSelectionRect
- [x] `SlashMenu.tsx` (17 → <15) - extracted slash command helpers
- [x] `permission-cascade.spec.ts` - removed unused params

---

## Remaining Tasks

### Code Quality

#### Task 8: Type Consistency

**What:** Ensure all TypeScript types (`IssueType`, `IssuePriority`, `IssueStatus`, etc.) are imported from canonical sources, not duplicated.

**Solution:** Use Convex-generated types from `convex/_generated/dataModel.d.ts` as the single source of truth.

**TODO:**
- [ ] Audit all type definitions with: `grep -r "IssueType\|IssuePriority\|IssueStatus" src --include="*.ts*"`
- [ ] Update all imports to use Convex-generated types
- [ ] Remove any local type redefinitions

---

#### Task 9: Docstring Coverage

**Current state:** 32.5% coverage

**TODO:**
- [ ] Run: `grep -L "@param\|@returns" convex/*.ts` to find undocumented files
- [ ] Add JSDoc to core exported queries/mutations
- [ ] Add JSDoc to complex utility functions

---

## Acceptance Criteria

### E2E
- [x] `src/lib/test-ids.ts` exists as shared constants
- [x] `e2e/locators/index.ts` re-exports from shared file (deleted obsolete `e2e/selectors.ts`)
- [x] All key components have `data-testid` attributes (9 components updated)
- [x] All E2E tests import from `TEST_IDS` (AST validator enforces — no raw strings)
- [x] Validation script catches bad patterns (`check-test-ids.js` + `check-e2e-quality.js` in CI)
- [x] High-severity `.first()` on generic selectors fixed (activity-feed, invite, analytics, onboarding)
- [x] No tests check "any image exists" or similar meaningless assertions
- [x] RULES.md documents E2E standards (selector priority, TEST_IDS, anti-patterns, scoping)
- [ ] All E2E tests pass (need to verify with full E2E run)

### Code Quality
- [ ] No duplicate type definitions in codebase
- [ ] JSDoc on core convex functions
- [x] No `console.log` in production code (verified clean)
- [x] All Biome complexity warnings resolved

---

## Related Files

**Created:**
- `src/lib/test-ids.ts` - Shared test ID constants (source of truth)
- `scripts/validate/check-test-ids.js` - AST validator for test ID enforcement
- `scripts/validate/check-e2e-quality.js` - E2E quality checker (broad selectors, networkidle, etc.)

**Updated (components — data-testid added):**
- `src/components/IssueCard.tsx`, `src/components/Kanban/KanbanColumn.tsx`
- `src/components/GlobalSearch.tsx`, `src/components/auth/SignInForm.tsx`
- `src/components/ActivityFeed.tsx`, `src/components/CommandPalette.tsx`
- `src/components/CreateProjectFromTemplate.tsx`, `src/components/IssueDetailModal.tsx`
- `src/components/PlateEditor.tsx`

**Updated (E2E — scoped selectors, TEST_IDS constants, quality fixes):**
- `e2e/activity-feed.spec.ts` - Selectors scoped to activity feed container
- `e2e/invite.spec.ts` - Fixed meaningless image assertion
- `e2e/analytics.spec.ts` - Replaced `.animate-pulse` with heading assertion
- `e2e/onboarding.spec.ts` - Replaced `.animate-spin` with heading assertion
- `e2e/pages/dashboard.page.ts` - Replaced `.animate-spin` with role-based locator
- `e2e/pages/projects.page.ts` - Replaced `page.locator("aside")` with `getByRole("complementary")`
- `e2e/pages/documents.page.ts` - Replaced `page.locator("aside")` with `getByRole("complementary")`
- `e2e/pages/workspaces.page.ts` - Replaced `page.locator(".grid")` with scoped locator
- `e2e/rbac.spec.ts`, `e2e/screenshot-pages.ts`
- `e2e/locators/index.ts` - Updated imports

**Updated (infrastructure):**
- `scripts/validate.js` - Added Check 8 (E2E quality)
- `RULES.md` - Added E2E testing standards section

**Deleted:**
- `e2e/selectors.ts` - Removed redundant middleman file

**Reference:**
- `scripts/validate/*.js` - Validation scripts
- `RULES.md` - Development rules
- `convex/schema.ts` - Type definitions
- `convex/_generated/dataModel.d.ts` - Generated types (source of truth)
