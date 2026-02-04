# Quality Overhaul

> **Priority:** P0/P2 (Mixed - E2E is blocking, tech debt is maintenance)
> **Effort:** Large
> **Status:** Not started

---

## Problem Statement

### E2E Tests (P0 - Blocking)

Our E2E tests have accumulated technical debt that makes them unreliable and meaningless:

1. **Generic selectors** - Tests use `page.locator("img").first()` or `page.getByRole("button")` without specificity, matching unintended elements
2. **Loosened assertions** - Tests have been "fixed" by making assertions so broad they always pass (e.g., "check any image exists" instead of "check the brand logo exists")
3. **No centralized selectors** - Each test invents its own selectors, leading to inconsistency and brittleness
4. **Missing data-testid** - Components lack stable test hooks, forcing tests to rely on implementation details

**Impact:** Tests pass but don't verify behavior. Bugs ship. Developer trust in tests erodes.

### Code Quality (P2 - Maintenance)

1. **Type inconsistency** - Types duplicated across files instead of using Convex-generated types
2. **Low docstring coverage** - 32.5% coverage on Convex functions
3. **Console.log pollution** - Debug logs in production code
4. **High complexity functions** - Several functions exceed Biome's complexity threshold

---

## Tasks

### E2E Infrastructure

#### 1. Create `e2e/selectors.ts` Constants File

**What:** A single source of truth for all test selectors, similar to how `src/config/routes.ts` works for URLs.

**Why:**
- Tests become self-documenting (`SELECTORS.issueCard` vs `page.locator("[data-testid='issue-card']")`)
- Selector changes happen in one place
- IDE autocomplete helps find selectors
- Validation can ensure selectors exist in the codebase

**Implementation:**

```typescript
// e2e/selectors.ts

/**
 * Centralized test selectors for E2E tests.
 *
 * RULES:
 * 1. Every selector must correspond to a data-testid in the component
 * 2. Use semantic names that describe WHAT the element is, not WHERE it is
 * 3. Group by feature/domain, not by page
 * 4. Include JSDoc with the component file path
 */

export const SELECTORS = {
  // Issues
  issueCard: '[data-testid="issue-card"]',
  issueKey: '[data-testid="issue-key"]',
  issuePriority: '[data-testid="issue-priority"]',

  // Board
  boardColumn: '[data-testid="board-column"]',
  boardColumnHeader: '[data-testid="board-column-header"]',
  boardColumnCount: '[data-testid="board-column-count"]',

  // Workspaces
  workspaceCard: '[data-testid="workspace-card"]',
  workspaceName: '[data-testid="workspace-name"]',

  // Navigation & Branding
  brandLogo: '[data-testid="brand-logo"]',
  sidebar: '[data-testid="sidebar"]',
  mainContent: '[data-testid="main-content"]',

  // Search
  searchModal: '[data-testid="search-modal"]',
  searchResultItem: '[data-testid="search-result-item"]',
  searchResultType: '[data-testid="search-result-type"]',

  // Auth
  authEmailInput: '[data-testid="auth-email-input"]',
  authPasswordInput: '[data-testid="auth-password-input"]',
  authSubmitButton: '[data-testid="auth-submit-button"]',
} as const;

export type SelectorKey = keyof typeof SELECTORS;
```

**Files to create:**
- [ ] `e2e/selectors.ts`

---

#### 2. Inventory Existing `data-testid` Usage

**How to run:**

```bash
# Find all data-testid in components
grep -r "data-testid" src/components --include="*.tsx" | grep -v ".test." | sort

# Find all data-testid in e2e tests
grep -r "data-testid\|getByTestId" e2e --include="*.ts" | sort
```

**Files to update:**
- [ ] Run inventory commands
- [ ] Document findings
- [ ] Identify gaps (components that need data-testid but don't have it)

---

#### 3. Add Missing `data-testid` Attributes to Components

**Guidelines:**

1. **Only add when needed** - Interactive elements, key content, container elements
2. **Use semantic names** - Name by WHAT it is, not WHERE it is
3. **Include in JSDoc** - Document that the attribute exists for testing

**Components that need data-testid (from test failures):**

| Component | Needed data-testid | Reason |
|-----------|-------------------|--------|
| `IssueCard.tsx` | `issue-card` | Board drag-drop tests |
| `WorkspaceCard.tsx` | `workspace-card` | Teams navigation tests |
| `Logo.tsx` | `brand-logo` | Branding verification tests |
| `GlobalSearch.tsx` | `search-result-item`, `search-result-type` | Search tests |
| `SignInForm.tsx` | `auth-email-input`, `auth-password-input`, `auth-submit-button` | Auth tests |

**Files to update:**
- [ ] `src/components/IssueCard.tsx`
- [ ] `src/components/WorkspaceCard.tsx`
- [ ] `src/components/ui/Logo.tsx`
- [ ] `src/components/GlobalSearch.tsx`
- [ ] `src/components/auth/SignInForm.tsx`
- [ ] (others as discovered during inventory)

---

#### 4. Update E2E Tests to Use SELECTORS Constants

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

#### 5. Audit and Fix/Delete Meaningless Tests

**Red flags to look for:**

1. Generic `.first()` on broad selectors
2. Role selectors without specificity
3. Assertions that can't fail
4. Tests that check existence but not behavior

**Tests to audit (from recent "fixes"):**
- [ ] `e2e/invite.spec.ts` - "invite page shows branding" - Currently checks any img
- [ ] `e2e/board-drag-drop.spec.ts` - Issue card selector was wrong
- [ ] `e2e/teams.spec.ts` - Workspace card selector too broad
- [ ] `e2e/search.spec.ts` - Issue badge assertion
- [ ] (full audit of all spec files)

---

#### 6. Add Validation Script for E2E Test Quality

**Files to create:**
- [ ] `scripts/validate/check-e2e-quality.js`
- [ ] Update `scripts/validate.js` to include e2e checks

---

#### 7. Update RULES.md with E2E Standards

**Files to update:**
- [ ] `RULES.md` - Add E2E testing section

---

### Code Quality

#### 8. Type Consistency

**What:** Ensure all TypeScript types (`IssueType`, `IssuePriority`, `IssueStatus`, etc.) are imported from canonical sources, not duplicated.

**Solution:** Use Convex-generated types from `convex/_generated/dataModel.d.ts` as the single source of truth. Do NOT create a separate `src/types/` file.

```typescript
// ✅ CORRECT: Import from Convex generated types
import type { Doc } from "convex/_generated/dataModel";
type IssueType = Doc<"issues">["type"];
type IssuePriority = Doc<"issues">["priority"];

// ❌ WRONG: Local type definitions
type IssueType = "story" | "task" | "bug" | "epic";
```

**Implementation:**
- [ ] Audit all type definitions with: `grep -r "IssueType\|IssuePriority\|IssueStatus" src --include="*.ts*"`
- [ ] Update all imports to use Convex-generated types
- [ ] Remove any local type redefinitions

---

#### 9. Docstring Coverage

**What:** Add JSDoc comments to Convex functions for better documentation.

**Current state:** 32.5% coverage

**Priority functions to document (most important first):**
1. Core public queries/mutations in `convex/issues/*.ts`, `convex/documents/*.ts`, `convex/projects/*.ts`
2. Auth-related functions in `convex/auth.ts`
3. Other exported utility functions as time permits

**Implementation:**
- [ ] Run: `grep -L "@param\|@returns" convex/*.ts` to find undocumented files
- [ ] Add JSDoc to core exported queries/mutations
- [ ] Add JSDoc to complex utility functions

---

#### 10. Remove Console Logs in Production Code

**How to find:**
```bash
grep -r "console\.log" src --include="*.ts*" | grep -v ".test." | grep -v "// DEBUG"
```

**Allowed exceptions:**
- Error logging with `console.error`
- Explicit `// DEBUG:` comments

**Implementation:**
- [ ] Run audit command
- [ ] Remove or convert to proper logging

---

#### 11. Biome Complexity Warnings

**Current warnings:**

| File | Function | Complexity | Max | Status |
|------|----------|------------|-----|--------|
| `src/lib/plate/markdown.ts` | `parseMarkdown` | 43 | 15 | **Done** |
| `src/lib/plate/editor.ts` | `isEmptyValue` | 21 | 15 | **Done** |
| `src/components/FilterBar.tsx` | `FilterBar` | 25 | 15 | **Done** |
| `src/components/KanbanBoard.tsx` | filter callback | 17 | 15 | **Done** |
| `src/components/plate/FloatingToolbar.tsx` | useEffect | 16 | 15 | **Done** |
| `src/components/plate/SlashMenu.tsx` | useEffect/handleSelect | 17 | 15 | **Done** |
| `e2e/permission-cascade.spec.ts` | unused params | - | - | **Done** |

**Approach:**
- Extract helper functions
- Use early returns
- Split large switch statements into lookup objects

**Implementation:**
- [x] Refactor `parseMarkdown` (43 → <15) - extracted block parsers (parseCodeBlock, parseHeading, etc.) and parser chain pattern
- [x] Refactor `isEmptyValue` (21 → <15) - extracted isEmptyTextNode, hasEmptyChildren, isEmptyParagraph helpers
- [x] Refactor `FilterBar` component (25 → <15) - extracted FilterDropdown, SavedFiltersDropdown, SaveFilterDialog, countActiveFilters
- [x] Refactor `KanbanBoard.tsx` filter callback (17 → <15) - extracted filter match helpers
- [x] Refactor `FloatingToolbar.tsx` useEffect (16 → <15) - extracted getSelectionRect
- [x] Refactor `SlashMenu.tsx` (17 → <15) - extracted detectSlashTrigger, deleteSlashCommand
- [x] Remove unused params in `e2e/permission-cascade.spec.ts`

---

## Acceptance Criteria

### E2E
- [ ] `e2e/selectors.ts` exists with all needed selectors
- [ ] All components have appropriate `data-testid` attributes
- [ ] All E2E tests import from `SELECTORS` (no raw `data-testid` strings in tests)
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

- `e2e/*.spec.ts` - All test files
- `e2e/selectors.ts` - Centralized selectors (to create)
- `src/components/**/*.tsx` - Components needing data-testid
- `scripts/validate/*.js` - Validation scripts
- `RULES.md` - Development rules
- `convex/schema.ts` - Type definitions
- `convex/_generated/dataModel.d.ts` - Generated types (source of truth)
- `biome.json` - Linter config
- `src/lib/plate/markdown.ts` - parseMarkdown complexity
- `src/components/FilterBar.tsx` - FilterBar complexity
- `src/components/KanbanBoard.tsx` - Filter callback complexity
