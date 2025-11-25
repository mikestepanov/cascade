# Backend Testing Guide

## Overview

This directory contains backend tests for Cascade's Convex functions. The testing infrastructure uses `convex-test` for integration tests and vitest for test running.

## Quick Start (Local Development)

### Prerequisites

1. **Active Convex deployment** - You must have Convex configured locally
2. **Environment file** - `.env` or `.env.local` with your Convex deployment settings

### Running Tests

```bash
# 1. Start Convex dev server (in one terminal)
npx convex dev

# 2. Run backend tests (in another terminal)
pnpm run test:convex

# Or run with UI
pnpm run test:convex:ui

# Or run with coverage report
pnpm run test:convex:coverage
```

## Test Structure

### Pure Function Tests

Tests for utility functions that don't require database access:

- ✅ Can run anywhere (even without Convex deployment)
- Example: `hasMinimumRole()` in `rbac.test.ts`

### Integration Tests

Tests for queries/mutations that interact with the database:

- ⚠️ Require active Convex deployment
- Use `convexTest()` to create isolated test database
- Example: `getUserRole()`, `canAccessProject()` in `rbac.test.ts`

## File Organization

```
convex/
├── rbac.test.ts          # RBAC function tests (19 tests)
├── testSetup.ts          # Module exports for convex-test
├── test-utils.ts         # Test helper functions
└── TESTING_STATUS.md     # Current testing status and blockers
```

## Test Utilities

### Helper Functions (`test-utils.ts`)

```typescript
// Create a test user
const userId = await createTestUser(t, {
  name: "Test User",
  email: "test@example.com",
});

// Create a test project
const projectId = await createTestProject(t, userId, {
  name: "Test Project",
  key: "TEST",
  isPublic: false,
});

// Add a member to a project
await addProjectMember(t, projectId, memberId, "editor", adminId);

// Create a test issue
const issueId = await createTestIssue(t, projectId, reporterId, {
  title: "Test Issue",
  type: "task",
  priority: "high",
});
```

## Writing New Tests

### Example Test File

```typescript
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { modules } from "./testSetup";
import { createTestUser, createTestProject } from "./testUtils";

describe("MyModule", () => {
  it("should do something", async () => {
    const t = convexTest(schema, modules);

    // Setup test data
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // Run your test
    const result = await t.run(async (ctx) => {
      const { myFunction } = await import("./myModule");
      return await myFunction(ctx, projectId, userId);
    });

    // Assert
    expect(result).toBeDefined();
  });
});
```

## Current Test Coverage

- **RBAC (rbac.ts):** 19 tests
  - ✅ 5 pure function tests passing
  - ⚠️ 14 integration tests (require Convex deployment)

## Troubleshooting

### Error: "Could not find the \_generated directory"

**Cause:** `convex-test` needs an active Convex deployment to discover modules.

**Solution:**

```bash
# Make sure Convex dev server is running
npx convex dev

# Then run tests in another terminal
pnpm run test:convex
```

### Error: "CONVEX_DEPLOYMENT not set"

**Cause:** Missing Convex configuration.

**Solution:**

1. Check your `.env` or `.env.local` file exists
2. Run `npx convex dev` to set up deployment
3. Follow Convex setup instructions

### Tests Pass Locally But Fail in CI

**Cause:** CI environment doesn't have Convex deployment configured.

**Solution:**
Add Convex deployment configuration to CI:

1. Add `CONVEX_DEPLOY_KEY` secret to GitHub
2. Update CI workflow to run `npx convex deploy` before tests

## What's Next

See `TESTING_STATUS.md` for:

- Current implementation status
- Known blockers
- Roadmap for additional test coverage

## Resources

- [Convex Testing Docs](https://docs.convex.dev/functions/testing)
- [convex-test on npm](https://www.npmjs.com/package/convex-test)
- [Vitest Documentation](https://vitest.dev/)
