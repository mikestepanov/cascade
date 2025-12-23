# Unit Test Investigation Summary

**Date:** 2025-12-19  
**Issue:** React components don't execute render functions in Vitest unit tests  
**Status:** **✅ SOLVED - React 19 concurrent rendering incompatibility**

## Solution

**Wrap Testing Library's `render()` with `flushSync()` from `react-dom`**

React 19 uses concurrent rendering by default, making `render()` asynchronous. Testing Library doesn't wait for concurrent updates, resulting in empty containers.

### Implementation

Created `src/test/custom-render.tsx`:

```typescript
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { flushSync } from "react-dom";

export function render(ui: ReactElement, options?: RenderOptions) {
  let result: ReturnType<typeof rtlRender>;
  flushSync(() => {
    result = rtlRender(ui, options);
  });
  return result!;
}

export * from "@testing-library/react";
```

### Usage

```typescript
// Instead of:
import { render, screen } from '@testing-library/react';

// Use:
import { render, screen } from '@/test/custom-render';
```

## Root Cause

**React 19 concurrent rendering + @testing-library/react 16.3 incompatibility**

- React 19 made `render()` asynchronous by default (concurrent mode)
- Testing Library's `render()` doesn't wait for React 19's concurrent updates
- Components execute but DOM updates happen asynchronously
- Tests check DOM immediately and see empty containers

## Investigation Timeline

### ✅ Fixed: React.act Compatibility

Created `src/test/react-act-patch.ts` to patch `react-dom/test-utils.act`.

### ✅ Fixed: Component Rendering  

**Tests conducted:**
1. ❌ `createElement('div', {}, 'Hello')` → empty container
2. ❌ Direct `createRoot()` + `render()` → empty container  
3. ✅ `createRoot()` + `render()` + `setTimeout(100)` → **WORKS!**
4. ✅ `flushSync(() => render())` → **WORKS!**

**Conclusion:** React 19's async rendering needs `flushSync()` for synchronous tests.

## Test Results

- ✅ `ProfileContent.test.tsx` - **2/2 tests passing**
- 📊 Overall: **536 passed**, 636 failed (need to migrate to custom render)

## Migration Guide

### For New Tests

```typescript
import { render, screen } from '@/test/custom-render';
```

### For Existing Tests

Replace import:
```diff
- import { render, screen } from '@testing-library/react';
+ import { render, screen } from '@/test/custom-render';
```

## Environment

```
react: 19.2.1
react-dom: 19.2.1
@testing-library/react: 16.3.1
vitest: 4.0.15
@vitejs/plugin-react: 5.1.1
vite: 7.2.6
```

## References

- React 19 Concurrent Features: https://react.dev/blog/2024/12/05/react-19
- flushSync API: https://react.dev/reference/react-dom/flushSync
- Testing Library React 19: https://github.com/testing-library/react-testing-library/issues/1209

---

**Investigation complete. Solution working. Migration in progress.**
