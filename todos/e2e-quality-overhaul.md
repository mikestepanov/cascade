# E2E Test Quality Overhaul

> **Priority:** P0 (Blocking - tests are unreliable)
> **Effort:** Large (touches all e2e tests + components)
> **Status:** Not started

---

## Problem Statement

Our E2E tests have accumulated technical debt that makes them unreliable and meaningless:

1. **Generic selectors** - Tests use `page.locator("img").first()` or `page.getByRole("button")` without specificity, matching unintended elements
2. **Loosened assertions** - Tests have been "fixed" by making assertions so broad they always pass (e.g., "check any image exists" instead of "check the brand logo exists")
3. **No centralized selectors** - Each test invents its own selectors, leading to inconsistency and brittleness
4. **Missing data-testid** - Components lack stable test hooks, forcing tests to rely on implementation details

**Impact:** Tests pass but don't verify behavior. Bugs ship. Developer trust in tests erodes.

---

## Solution Overview

1. Create a centralized `e2e/selectors.ts` constants file (like how `ROUTES` works)
2. Add `data-testid` attributes to components that need stable test hooks
3. Audit and fix/delete all meaningless tests
4. Add validation to prevent regression

---

## Tasks

### 1. Create `e2e/selectors.ts` Constants File

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
  // ─────────────────────────────────────────────────────────────
  // Issues
  // ─────────────────────────────────────────────────────────────

  /** Issue card on board/backlog - src/components/IssueCard.tsx */
  issueCard: '[data-testid="issue-card"]',

  /** Issue key badge (e.g., "PROJ-123") - src/components/IssueCard.tsx */
  issueKey: '[data-testid="issue-key"]',

  /** Issue priority indicator - src/components/IssueCard.tsx */
  issuePriority: '[data-testid="issue-priority"]',

  // ─────────────────────────────────────────────────────────────
  // Board
  // ─────────────────────────────────────────────────────────────

  /** Board column container - src/components/KanbanBoard.tsx */
  boardColumn: '[data-testid="board-column"]',

  /** Column header with status name - src/components/KanbanBoard.tsx */
  boardColumnHeader: '[data-testid="board-column-header"]',

  /** Issue count badge in column header */
  boardColumnCount: '[data-testid="board-column-count"]',

  // ─────────────────────────────────────────────────────────────
  // Workspaces
  // ─────────────────────────────────────────────────────────────

  /** Workspace card in list view - src/components/WorkspaceCard.tsx */
  workspaceCard: '[data-testid="workspace-card"]',

  /** Workspace name in card */
  workspaceName: '[data-testid="workspace-name"]',

  // ─────────────────────────────────────────────────────────────
  // Navigation & Branding
  // ─────────────────────────────────────────────────────────────

  /** Main brand logo - src/components/ui/Logo.tsx */
  brandLogo: '[data-testid="brand-logo"]',

  /** Sidebar navigation container */
  sidebar: '[data-testid="sidebar"]',

  /** Main content area (excludes sidebar) */
  mainContent: '[data-testid="main-content"]',

  // ─────────────────────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────────────────────

  /** Global search modal */
  searchModal: '[data-testid="search-modal"]',

  /** Search result item */
  searchResultItem: '[data-testid="search-result-item"]',

  /** Search result type badge (issue/document) */
  searchResultType: '[data-testid="search-result-type"]',

  // ─────────────────────────────────────────────────────────────
  // Auth
  // ─────────────────────────────────────────────────────────────

  /** Email input on auth forms */
  authEmailInput: '[data-testid="auth-email-input"]',

  /** Password input on auth forms */
  authPasswordInput: '[data-testid="auth-password-input"]',

  /** Primary auth submit button */
  authSubmitButton: '[data-testid="auth-submit-button"]',

} as const;

// Type for selector keys (useful for validation)
export type SelectorKey = keyof typeof SELECTORS;

// Helper to get selector by key (for dynamic access)
export function getSelector(key: SelectorKey): string {
  return SELECTORS[key];
}
```

**Usage in tests:**

```typescript
// Before (fragile, unclear)
const issueCard = page.locator("[data-issue-card]").filter({ hasText: issueTitle });
const workspaceCard = page.locator('a[href*="/workspaces/"]').filter({ hasText: workspaceName });

// After (stable, self-documenting)
import { SELECTORS } from "./selectors";

const issueCard = page.locator(SELECTORS.issueCard).filter({ hasText: issueTitle });
const workspaceCard = page.locator(SELECTORS.workspaceCard).filter({ hasText: workspaceName });
```

**Files to create:**
- [ ] `e2e/selectors.ts`

---

### 2. Inventory Existing `data-testid` Usage

**What:** Find all current `data-testid` attributes in the codebase to understand what we have.

**Why:** Avoid duplicating selectors or creating conflicts. Understand the current state.

**How to run:**

```bash
# Find all data-testid in components
grep -r "data-testid" src/components --include="*.tsx" | grep -v ".test." | sort

# Find all data-testid in e2e tests
grep -r "data-testid\|getByTestId" e2e --include="*.ts" | sort
```

**Expected output format:**

| Component | data-testid | Used in tests? |
|-----------|-------------|----------------|
| `IssueCard.tsx` | `issue-card` | No |
| `KanbanBoard.tsx` | `board-column` | Yes |
| ... | ... | ... |

**Files to update:**
- [ ] Run inventory commands
- [ ] Document findings in this file or a spreadsheet
- [ ] Identify gaps (components that need data-testid but don't have it)

---

### 3. Add Missing `data-testid` Attributes to Components

**What:** Add `data-testid` attributes to components that E2E tests need to interact with.

**Why:** Provides stable, semantic hooks for tests that don't rely on CSS classes, DOM structure, or text content.

**Guidelines:**

1. **Only add when needed** - Don't add data-testid to every element. Only add to:
   - Interactive elements (buttons, inputs, links)
   - Key content elements that tests assert on
   - Container elements that tests need to scope within

2. **Use semantic names** - Name by WHAT it is, not WHERE it is:
   ```tsx
   // Good
   data-testid="issue-card"
   data-testid="create-issue-button"

   // Bad
   data-testid="left-sidebar-first-button"
   data-testid="modal-content-div"
   ```

3. **Include in JSDoc** - Document that the attribute exists for testing:
   ```tsx
   /**
    * Issue card component for board and backlog views.
    *
    * @testid issue-card - Root element
    * @testid issue-key - Key badge (e.g., "PROJ-123")
    */
   export function IssueCard({ issue }: IssueCardProps) {
     return (
       <div data-testid="issue-card">
         <span data-testid="issue-key">{issue.key}</span>
       </div>
     );
   }
   ```

**Components that need data-testid (from test failures):**

| Component | Needed data-testid | Reason |
|-----------|-------------------|--------|
| `IssueCard.tsx` | `issue-card` | Board drag-drop tests |
| `WorkspaceCard.tsx` | `workspace-card` | Teams navigation tests |
| `Logo.tsx` | `brand-logo` | Branding verification tests |
| `GlobalSearch.tsx` | `search-result-item`, `search-result-type` | Search tests |
| `SignInForm.tsx` | `auth-email-input`, `auth-password-input`, `auth-submit-button` | Auth tests |

**Example implementation:**

```tsx
// src/components/IssueCard.tsx

export function IssueCard({ issue, canEdit, selectionMode, ... }: IssueCardProps) {
  return (
    <button
      data-testid="issue-card"  // ← Add this
      draggable={canEdit && !selectionMode}
      className={cn("...")}
    >
      <span data-testid="issue-key" className="font-mono">
        {issue.key}
      </span>
      {/* ... */}
    </button>
  );
}
```

**Files to update:**
- [ ] `src/components/IssueCard.tsx`
- [ ] `src/components/WorkspaceCard.tsx` (or wherever workspace cards are rendered)
- [ ] `src/components/ui/Logo.tsx`
- [ ] `src/components/GlobalSearch.tsx`
- [ ] `src/components/auth/SignInForm.tsx`
- [ ] (others as discovered during inventory)

---

### 4. Update E2E Tests to Use SELECTORS Constants

**What:** Replace all raw selectors in tests with imports from `SELECTORS`.

**Why:** Centralization, consistency, IDE support, easier refactoring.

**Before/After examples:**

```typescript
// ❌ BEFORE: Raw selectors scattered in tests
test("can drag issue", async ({ page }) => {
  const issueCard = page.getByRole("button").filter({ hasText: issueTitle });
  const targetColumn = page.locator("[data-board-column]");
  // ...
});

// ✅ AFTER: Centralized selectors
import { SELECTORS } from "./selectors";

test("can drag issue", async ({ page }) => {
  const issueCard = page.locator(SELECTORS.issueCard).filter({ hasText: issueTitle });
  const targetColumn = page.locator(SELECTORS.boardColumn);
  // ...
});
```

**Files to update:**
- [ ] `e2e/board-drag-drop.spec.ts`
- [ ] `e2e/teams.spec.ts`
- [ ] `e2e/search.spec.ts`
- [ ] `e2e/invite.spec.ts`
- [ ] `e2e/auth-comprehensive.spec.ts`
- [ ] (all other spec files)

---

### 5. Audit and Fix/Delete Meaningless Tests

**What:** Review all E2E tests for assertions that don't actually verify behavior.

**Red flags to look for:**

1. **Generic `.first()` on broad selectors:**
   ```typescript
   // BAD: Matches any image on page
   const logo = page.locator("img").first();
   await expect(logo).toBeVisible();
   ```

2. **Role selectors without specificity:**
   ```typescript
   // BAD: Matches any button
   const button = page.getByRole("button");
   await expect(button).toBeVisible();
   ```

3. **Assertions that can't fail:**
   ```typescript
   // BAD: Page always has some text
   await expect(page.locator("body")).toContainText(/.*/);
   ```

4. **Tests that check existence but not behavior:**
   ```typescript
   // BAD: Doesn't verify the button does anything
   test("button exists", async ({ page }) => {
     await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
   });
   ```

**What to do with bad tests:**

| Situation | Action |
|-----------|--------|
| Test can be fixed with better selectors | Fix it |
| Test is redundant (covered by other tests) | Delete it |
| Test is testing something untestable in E2E | Move to unit test or delete |
| Test is testing something that doesn't exist | Delete it |

**Tests to audit (from recent "fixes"):**

- [ ] `e2e/invite.spec.ts` - "invite page shows branding" - Currently checks any img
- [ ] `e2e/board-drag-drop.spec.ts` - Issue card selector was wrong
- [ ] `e2e/teams.spec.ts` - Workspace card selector too broad
- [ ] `e2e/search.spec.ts` - Issue badge assertion
- [ ] (full audit of all spec files)

---

### 6. Add Validation Script for E2E Test Quality

**What:** A script that flags bad patterns in E2E tests before they're committed.

**Why:** Prevent regression. Catch meaningless tests during code review.

**Implementation:**

```javascript
// scripts/validate/check-e2e-quality.js

const BAD_PATTERNS = [
  {
    pattern: /\.locator\(["'](?:img|div|span|button|a)["']\)\.first\(\)/,
    message: "Don't use .first() on generic element selectors - use data-testid instead",
  },
  {
    pattern: /getByRole\(["']button["']\)(?!.*name:)/,
    message: "getByRole('button') without name is too broad - add { name: /.../ }",
  },
  {
    pattern: /\.locator\(["'][^"']*["']\)(?!.*data-testid).*\.first\(\)/,
    message: "Avoid .first() - it usually indicates a selector that's too broad",
  },
  {
    pattern: /toBeVisible\(\);\s*}\);?\s*$/m,
    message: "Test ends with just toBeVisible() - consider testing behavior, not just existence",
  },
];

// Scan all e2e/*.spec.ts files and report violations
```

**Add to validation pipeline:**

```json
// package.json
{
  "scripts": {
    "validate:e2e": "node scripts/validate/check-e2e-quality.js"
  }
}
```

**Files to create:**
- [ ] `scripts/validate/check-e2e-quality.js`
- [ ] Update `scripts/validate.js` to include e2e checks
- [ ] Update `package.json` scripts

---

### 7. Update CLAUDE.md/RULES.md with E2E Standards

**What:** Document the E2E testing standards so AI assistants and developers follow them.

**Add to RULES.md:**

```markdown
## E2E Testing Standards

### Selector Hierarchy (in order of preference)

1. **`data-testid`** - For elements that don't have clear accessible roles
   ```typescript
   page.getByTestId("issue-card")
   page.locator(SELECTORS.issueCard)
   ```

2. **Accessible roles with specific name** - For buttons, links, headings
   ```typescript
   page.getByRole("button", { name: /submit/i })
   page.getByRole("heading", { name: /settings/i })
   ```

3. **Label associations** - For form inputs
   ```typescript
   page.getByLabel("Email")
   ```

### Forbidden Patterns

```typescript
// ❌ NEVER: Generic selectors with .first()
page.locator("img").first()
page.locator("button").first()

// ❌ NEVER: Role without specificity
page.getByRole("button")  // Which button?

// ❌ NEVER: Raw CSS selectors for test-specific elements
page.locator(".card-container > div:nth-child(2)")

// ❌ NEVER: Tests that only check existence
test("button exists", async ({ page }) => {
  await expect(button).toBeVisible();  // So what? What does it DO?
});
```

### Required Patterns

```typescript
// ✅ ALWAYS: Import from centralized selectors
import { SELECTORS } from "./selectors";

// ✅ ALWAYS: Use specific selectors
page.locator(SELECTORS.issueCard).filter({ hasText: issueTitle })

// ✅ ALWAYS: Test behavior, not just existence
test("create button opens modal", async ({ page }) => {
  await page.getByRole("button", { name: /create/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
```
```

**Files to update:**
- [ ] `RULES.md` - Add E2E testing section
- [ ] `CLAUDE.md` - Reference the rules

---

## Acceptance Criteria

- [ ] `e2e/selectors.ts` exists with all needed selectors
- [ ] All components have appropriate `data-testid` attributes
- [ ] All E2E tests import from `SELECTORS` (no raw `data-testid` strings in tests)
- [ ] Validation script catches bad patterns
- [ ] No tests use `.first()` on generic selectors
- [ ] No tests check "any image exists" or similar meaningless assertions
- [ ] RULES.md documents E2E standards
- [ ] All E2E tests pass

---

## Related Files

- `e2e/*.spec.ts` - All test files
- `e2e/pages/*.page.ts` - Page objects
- `e2e/fixtures.ts` - Test fixtures
- `src/components/**/*.tsx` - Components needing data-testid
- `scripts/validate/*.js` - Validation scripts
- `RULES.md` - Development rules
