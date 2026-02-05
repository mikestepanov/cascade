# Quality Overhaul

> **Priority:** P2 (Maintenance)
> **Effort:** Medium
> **Status:** Near Complete

---

## Remaining Tasks

### Task 9: Docstring Coverage ✅

**Current state:** ~95% coverage on exported convex functions

**DONE:**
- [x] Audited all convex files — found ~73 undocumented exported functions across 24 files
- [x] Phase 1: Integration files (webhooks, meetingBot, googleCalendar, github) — 58 functions
- [x] Phase 2: Core feature files (presence, notifications, projectTemplates) — 16 functions
- [x] Phase 3: System files (e2e, automationRules, documentTemplates, apiKeys, etc.) — 17 files
- [x] Verified with `pnpm fixme` — biome + typecheck pass clean

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
- [x] JSDoc on core convex functions
- [x] No `console.log` in production code (verified clean)
- [x] All Biome complexity warnings resolved
