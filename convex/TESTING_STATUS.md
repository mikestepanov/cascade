# Backend Testing Status

**Last Updated:** 2025-01-17
**Status:** ⚠️ Infrastructure Complete, Blocker Identified

## What's Done ✅

### Phase 1: Infrastructure Setup - COMPLETE

1. **✅ vitest.convex.config.ts** - Separate config for backend tests
   - Uses `node` environment (vs `jsdom` for frontend)
   - Includes `convex/**/*.test.ts`
   - Excludes `_generated/` and setup files
   - Coverage configured

2. **✅ convex/testSetup.ts** - Module exports for convex-test
   - Exports all 24 backend modules
   - Ready for use with `convexTest(schema, modules)`

3. **✅ convex/test-utils.ts** - Test helper functions
   - `createTestUser(t, userData)` - Helper to create test users
   - `createTestProject(t, userId, projectData)` - Helper to create test projects
   - `addProjectMember(t, projectId, userId, role, addedBy)` - Helper to add project members
   - `createTestIssue(t, projectId, reporterId, issueData)` - Helper to create test issues
   - `expectThrowsAsync(fn, expectedError)` - Helper for testing errors

4. **✅ package.json scripts** - Test commands added
   - `test:convex` - Run backend tests
   - `test:convex:ui` - Run with UI
   - `test:convex:coverage` - Run with coverage report
   - `test:all` - Run both frontend and backend tests
   - Updated `check` script to include backend tests

5. **✅ convex/rbac.test.ts** - Comprehensive RBAC tests written
   - 19 test cases covering all RBAC functions
   - Tests for hasMinimumRole, getUserRole, canAccessProject, canEditProject, canManageProject, assertMinimumRole
   - Uses test-utils helpers for clean setup
   - **Status:** Written but NOT PASSING due to blocker below

## Current Blocker 🚧

### Issue: `convex-test` Cannot Find `_generated` Directory

**Error Message:**
```
Error: Could not find the "_generated" directory, make sure to run `npx convex dev`
or `npx convex codegen`. Make sure your `import.meta.glob` includes the files
in the "_generated" directory
```

**Root Cause:**
- The `convex-test` library (v0.0.38) uses `import.meta.glob` to auto-discover Convex modules
- This works in Vite/bundler environments but not in pure Node.js (vitest with node environment)
- The `_generated` directory exists at `/home/user/cascade/convex/_generated/` but can't be discovered
- This is a known limitation of how `convex-test` discovers the Convex project structure

**Test Results:**
- ✅ 5/19 tests passing (pure utility functions that don't need database)
- ❌ 14/19 tests failing (all database-dependent tests)
- The failing tests can't even initialize `convexTest(schema, modules)` due to directory discovery issue

**What We Tried:**
1. ✅ Created separate vitest config with `environment: "node"`
2. ✅ Renamed `setup.test.ts` to `testSetup.ts` to avoid being picked up as test file
3. ✅ Set `root: "."` in vitest config
4. ❌ Still can't discover `_generated` directory

## Possible Solutions 💡

### Option 1: Use Actual Convex Deployment (Recommended)
Run `npx convex dev` in the background during tests to have an actual deployment:
```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Run tests
pnpm run test:convex
```
**Pros:** Might resolve the directory discovery issue
**Cons:** Requires deployment configuration, not isolated tests

### Option 2: Wait for convex-test Update
The `convex-test` package is actively developed. A future version may support Node.js testing better.

**Tracking:** Check https://www.npmjs.com/package/convex-test for updates

### Option 3: Mock the Database Layer
Create manual mocks for database operations instead of using `convex-test`:
```typescript
// Manually mock ctx.db operations
const mockDb = {
  get: vi.fn(),
  insert: vi.fn(),
  query: vi.fn(),
  // ...
};
```
**Pros:** Works in any environment
**Cons:** Loses type safety, doesn't test actual Convex behavior

### Option 4: Use Different Test Runner
Try using Node's built-in test runner or Jest instead of Vitest:
```bash
# Option: Try with tsx + node:test
pnpm add -D tsx
node --import tsx --test convex/**/*.test.ts
```
**Pros:** Might have better Node.js compatibility
**Cons:** Loses Vitest features, ecosystem

## What's Next 📋

### Immediate Next Steps:
1. **Try Option 1:** Test with `npx convex dev` running
2. **Research:** Check convex-test GitHub issues for similar problems
3. **Ask Community:** Post in Convex Discord about testing setup
4. **Document Findings:** Update this file with solution when found

### If Blocker Resolved:
Continue with Phase 2 from TODO.md:
- Complete RBAC tests (already written, just need to run)
- Write Projects tests
- Write Issues tests
- Write Documents tests
- And so on...

## Files Created 📁

```
cascade/
├── vitest.convex.config.ts          # Convex test configuration
├── convex/
│   ├── testSetup.ts                 # Module exports for testing
│   ├── test-utils.ts                # Test helper functions
│   ├── rbac.test.ts                 # RBAC tests (written, blocked)
│   └── TESTING_STATUS.md            # This file
└── package.json                      # Updated with test scripts
```

## Test Coverage Goal 🎯

Once blocker is resolved, target coverage:
- **80%+ for RBAC/security functions**
- **70%+ for core CRUD operations**
- **50%+ for utility functions**

## Commands 🔧

```bash
# Install dependencies
pnpm install

# Run backend tests (currently blocked)
pnpm run test:convex

# Run backend tests with UI
pnpm run test:convex:ui

# Run backend tests with coverage
pnpm run test:convex:coverage

# Run all tests (frontend + backend)
pnpm run test:all

# Run full check (typecheck + lint + all tests)
pnpm run check
```

## Notes 📝

- Frontend tests work fine with the regular `pnpm test` command
- Pure utility functions (like `hasMinimumRole`) test successfully
- The infrastructure is 100% complete - we just need to resolve the module discovery issue
- All 19 RBAC test cases are written and ready to run once blocker is fixed
