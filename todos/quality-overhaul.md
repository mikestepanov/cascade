# Quality Overhaul

> **Priority:** P2 (Maintenance)
> **Effort:** Medium
> **Status:** Near Complete

---

## Remaining Tasks

### Task 9: Docstring Coverage

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
- [x] No duplicate type definitions in codebase
- [ ] JSDoc on core convex functions
- [x] No `console.log` in production code (verified clean)
- [x] All Biome complexity warnings resolved
