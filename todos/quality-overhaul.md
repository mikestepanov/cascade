# Quality Overhaul

> **Priority:** P2 (Maintenance)
> **Effort:** Medium
> **Status:** Near Complete

---

## Remaining: Flaky E2E Tests

These tests fail intermittently in CI (pass locally). Need investigation:

- `analytics.spec.ts:25` - "Completed Sprints" strict mode violation (2 elements)
- `analytics.spec.ts:69` - chart sections
- `activity-feed.spec.ts:26` - empty state detection
- `auth-comprehensive.spec.ts:15` - sign in form elements
- `auth.spec.ts:126` - sign up verification email
- `integration-workflow.spec.ts:113` - dashboard shows issues
- `invite.spec.ts:33` - invalid invite page
- `invites.spec.ts:26` - admin send/revoke invites
- `permission-cascade.spec.ts:46` - org owner create workspaces
- `search.spec.ts:70` - no results found
- `teams.spec.ts:28` - navigate to teams list

---

## Completed

- [x] `src/lib/test-ids.ts` shared constants
- [x] All E2E tests use `TEST_IDS` (AST validator enforces)
- [x] Validation scripts in CI (`check-test-ids.js`, `check-e2e-quality.js`)
- [x] High-severity `.first()` on generic selectors fixed
- [x] RULES.md documents E2E standards
- [x] JSDoc on core convex functions (~95% coverage)
- [x] No duplicate type definitions
- [x] No `console.log` in production code
- [x] All Biome complexity warnings resolved
