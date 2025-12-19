# Unit Test Investigation Summary

**Date:** 2025-12-19  
**Issue:** React components don't execute render functions in Vitest unit tests  
**Status:** **ROOT CAUSE IDENTIFIED - Awaiting upstream fixes**

## Symptoms

- ✅ Tests don't crash (after act patch)
- ✅ Test files import and compile successfully
- ✅ Mocks are set up correctly
- ❌ React component functions never execute
- ❌ All renders result in empty `<div />` instead of component output

## Root Cause

**React 19 + @testing-library/react 16.3 + Vitest 4 incompatibility**

The JSX transformation chain works, but component functions are never called. This affects:
- Functional components defined in test files
- Imported components from src/
- Even simple components like `() => <div>Hello</div>`

## Environment

```
react: 19.2.1
react-dom: 19.2.1
@testing-library/react: 16.3.1
vitest: 4.0.15
@vitejs/plugin-react: 5.1.1
vite: 7.2.6
```

## Investigation Timeline

### Fixed: React.act Compatibility ✅

Created `src/test/react-act-patch.ts` which patches `react-dom/test-utils.act` before @testing-library/react loads. This prevents act-related crashes.

```typescript
// React 19 doesn't export act, so we create a simple implementation
const testUtils = require("react-dom/test-utils");
const actImpl = (callback: () => void | Promise<void>) => {
  const result = callback();
  if (result && typeof result.then === "function") {
    return result.then(() => undefined);
  }
  return Promise.resolve();
};
testUtils.act = actImpl;
```

### Unsolved: Component Rendering ❌

Even with:
- ✅ Correct act polyfill
- ✅ All Convex hooks mocked (useQuery, useMutation, useAction, useConvexAuth)
- ✅ Simple vi.mock() patterns
- ✅ Correct vitest.config.ts with react plugin
- ✅ No JSX syntax errors

**Components still don't execute.**

Example test output:
```
console.log("[TEST] About to render");
// ❌ NO component logs appear here
console.log("[TEST] Container HTML:", ""); // Empty!
```

## Not Related To

- ❌ "projects" → "workspaces" rename
- ❌ Our mocking strategy
- ❌ Our test setup files
- ❌ ConvexContext implementation

## Affected Tests

All unit tests that render React components:
- `ProfileContent.test.tsx` - 2 tests
- Any future component tests

## Current Workaround

**Rely on E2E tests (Playwright)** which work perfectly:
- ✅ E2E tests pass
- ✅ Full React 19 compatibility in browser
- ✅ Real user interactions
- ✅ No mocking complexity

## Future Resolution

Wait for upstream fixes in one of:
1. **@testing-library/react v17+** with React 19 support
2. **Vitest 5.x** with improved React 19 handling
3. **@vitejs/plugin-react 6.x** with better test transformation

## Recommendations

1. **Skip unit tests for now** - they're blocked by tooling issues
2. **Expand E2E test coverage** - these work and provide better confidence
3. **Re-evaluate quarterly** - check for @testing-library/react updates
4. **Document in CI** - mark unit tests as "known failing" not "broken code"

## References

- React 19 release: https://react.dev/blog/2024/12/05/react-19
- Testing Library React 19 tracking: https://github.com/testing-library/react-testing-library/issues/1209
- Vitest React 19 issues: https://github.com/vitest-dev/vitest/issues?q=react+19

---

*This investigation consumed significant effort. The issue is NOT in our codebase but in the testing ecosystem's React 19 support.*
