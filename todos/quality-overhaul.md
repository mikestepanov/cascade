# Quality Overhaul

> **Priority:** P0/P2 (Mixed - E2E is blocking, tech debt is maintenance)
> **Effort:** Large
> **Status:** In Progress

---

## Problem Statement

### E2E Tests (P0 - Blocking)

Our E2E tests have accumulated technical debt that makes them unreliable and meaningless:

1. **Generic selectors** - Tests use `page.locator("img").first()` or `page.getByRole("button")` without specificity, matching unintended elements
2. **Loosened assertions** - Tests have been "fixed" by making assertions so broad they always pass (e.g., "check any image exists" instead of "check the brand logo exists")
3. ~~**No centralized selectors**~~ ✅ DONE - Created shared `TEST_IDS` constants
4. ~~**Missing data-testid**~~ ✅ Partial - Key components updated

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
- `e2e/selectors.ts` - Re-exports from shared file
- `e2e/locators/index.ts` - Updated exports

**Usage pattern:**
```typescript
// In components:
import { TEST_IDS } from "@/lib/test-ids";
<button data-testid={TEST_IDS.ISSUE.CARD}>

// In E2E tests:
import { TEST_IDS } from "../selectors";
page.getByTestId(TEST_IDS.ISSUE.CARD);
```

### ✅ Task 3: Add data-testid to Components (Partial)

**Components updated:**
- [x] `src/components/IssueCard.tsx` - `ISSUE.CARD`, `ISSUE.KEY`, `ISSUE.PRIORITY`
- [x] `src/components/Kanban/KanbanColumn.tsx` - `BOARD.COLUMN`, `BOARD.COLUMN_HEADER`, `BOARD.COLUMN_COUNT`
- [x] `src/components/GlobalSearch.tsx` - `SEARCH.MODAL`, `SEARCH.RESULT_ITEM`, `SEARCH.RESULT_TYPE`
- [x] `src/components/auth/SignInForm.tsx` - `AUTH.EMAIL_INPUT`, `AUTH.PASSWORD_INPUT`, `AUTH.SUBMIT_BUTTON`

**Note:** `WorkspaceCard.tsx` and `Logo.tsx` don't exist in this codebase - they were hypothetical in the original plan. TEST_IDS are defined but components need to be created if these features are added.

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

### E2E Infrastructure

#### Task 2: Inventory Existing `data-testid` Usage

**How to run:**
```bash
# Find all data-testid in components
grep -r "data-testid" src/components --include="*.tsx" | grep -v ".test." | sort

# Find all data-testid in e2e tests
grep -r "data-testid\|getByTestId" e2e --include="*.ts" | sort
```

**TODO:**
- [ ] Run inventory commands
- [ ] Document findings
- [ ] Identify gaps (components that need data-testid but don't have it)

---

#### Task 4: Update E2E Tests to Use TEST_IDS Constants

**Files to update (all 27 spec files):**
- [ ] `e2e/activity-feed.spec.ts`
- [ ] `e2e/analytics.spec.ts`
- [ ] `e2e/auth.spec.ts`
- [ ] `e2e/auth-comprehensive.spec.ts`
- [ ] `e2e/board-drag-drop.spec.ts`
- [ ] `e2e/calendar.spec.ts`
- [ ] `e2e/dashboard.spec.ts`
- [ ] `e2e/dev-tools-test-account.spec.ts`
- [ ] `e2e/documents.spec.ts`
- [ ] `e2e/error-scenarios.spec.ts`
- [ ] `e2e/integration-workflow.spec.ts`
- [ ] `e2e/invite.spec.ts`
- [ ] `e2e/invites.spec.ts`
- [ ] `e2e/issue-detail-page.spec.ts`
- [ ] `e2e/issues.spec.ts`
- [ ] `e2e/landing.spec.ts`
- [ ] `e2e/onboarding.spec.ts`
- [ ] `e2e/permission-cascade.spec.ts`
- [ ] `e2e/rbac.spec.ts`
- [ ] `e2e/roadmap.spec.ts`
- [ ] `e2e/search.spec.ts`
- [ ] `e2e/settings/billing.spec.ts`
- [ ] `e2e/signout.spec.ts`
- [ ] `e2e/sprints.spec.ts`
- [ ] `e2e/teams.spec.ts`
- [ ] `e2e/time-tracking.spec.ts`
- [ ] `e2e/workspaces-org.spec.ts`

---

#### Task 5: Audit and Fix/Delete Meaningless Tests

**Red flags to look for:**
1. Generic `.first()` on broad selectors
2. Role selectors without specificity
3. Assertions that can't fail
4. Tests that check existence but not behavior

**Tests to audit:**
- [ ] `e2e/invite.spec.ts` - "invite page shows branding" - Currently checks any img
- [ ] `e2e/board-drag-drop.spec.ts` - Issue card selector was wrong
- [ ] `e2e/teams.spec.ts` - Workspace card selector too broad
- [ ] `e2e/search.spec.ts` - Issue badge assertion
- [ ] (full audit of all spec files)

---

#### Task 6: Add Validation Script for E2E Test Quality

**Files to create:**
- [ ] `scripts/validate/check-e2e-quality.js`
- [ ] Update `scripts/validate.js` to include e2e checks

---

#### Task 7: Update RULES.md with E2E Standards

**Files to update:**
- [ ] `RULES.md` - Add E2E testing section

---

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

#### Task 10: Remove Console Logs in Production Code

**How to find:**
```bash
grep -r "console\.log" src --include="*.ts*" | grep -v ".test." | grep -v "// DEBUG"
```

**TODO:**
- [ ] Run audit command
- [ ] Remove or convert to proper logging

---

## Acceptance Criteria

### E2E
- [x] `src/lib/test-ids.ts` exists as shared constants
- [x] `e2e/selectors.ts` re-exports from shared file
- [ ] All components have appropriate `data-testid` attributes (partial)
- [ ] All E2E tests import from `TEST_IDS` (no raw `data-testid` strings in tests)
- [ ] Validation script catches bad patterns
- [ ] No tests use `.first()` on generic selectors
- [ ] No tests check "any image exists" or similar meaningless assertions
- [ ] RULES.md documents E2E standards
- [ ] All E2E tests pass

### Code Quality
- [ ] No duplicate type definitions in codebase
- [ ] JSDoc on core convex functions
- [ ] No `console.log` in production code (except error/warn)
- [x] All Biome complexity warnings resolved

---

## Related Files

**Created:**
- `src/lib/test-ids.ts` - Shared test ID constants (source of truth)
- `e2e/selectors.ts` - Re-exports TEST_IDS for E2E

**Updated:**
- `src/components/IssueCard.tsx` - Uses TEST_IDS
- `src/components/Kanban/KanbanColumn.tsx` - Uses TEST_IDS
- `src/components/GlobalSearch.tsx` - Uses TEST_IDS
- `src/components/auth/SignInForm.tsx` - Uses TEST_IDS

**Reference:**
- `e2e/*.spec.ts` - All test files (to be updated)
- `scripts/validate/*.js` - Validation scripts
- `RULES.md` - Development rules
- `convex/schema.ts` - Type definitions
- `convex/_generated/dataModel.d.ts` - Generated types (source of truth)
