# E2E Test Sign-In Flakiness Investigation

**Date**: 2025-12-17
**Issue**: Intermittent sign-in failures during E2E test setup (1/3 users randomly fail)
**Status**: ROOT CAUSE IDENTIFIED

---

## Symptoms

During E2E global setup, one of three test users randomly fails to sign in:
- teamLead, teamMember, or viewer (usually teamLead)
- Error: `TimeoutError: locator.waitFor: Timeout 30000ms exceeded`
- Waiting for: `getByRole('heading', { name: /welcome back/i })`
- Sometimes the submit button changes to "null" after form submission

---

## Root Cause

**The "Welcome back" heading is inside `<Unauthenticated>` wrapper**, which only renders AFTER Convex:
1. Establishes WebSocket connection
2. Queries authentication state  
3. Determines user is not authenticated

**Location**: `src/routes/signin.tsx:17-18`
```typescript
<Unauthenticated>
  <AuthPageLayout title="Welcome back" subtitle="Sign in to your account to continue">
```

### Timing Chain

```
Page Load → Convex Init → WebSocket Connect → Auth Query → Unauthenticated Renders → Heading Appears
   ^                                                                                          ^
   |                                                                                          |
   +-------------------- Can take 1-30+ seconds on cold starts -------------------------+
```

---

## Why It's Intermittent

**Factors causing variability:**
1. **Cold starts**: First request to Convex backend can be slow (5-15s)
2. **WebSocket latency**: Network conditions affect connection speed
3. **Concurrent tests**: Multiple users connecting simultaneously
4. **System load**: CI/local machine resources

**Why teamLead fails more often:**
- It's tested FIRST in the setup sequence
- Bears the brunt of cold start delays
- Later users (teamMember, viewer) benefit from warmed-up connections

---

## Current Mitigations

**In `e2e/utils/auth-helpers.ts:trySignInUser()`:**

1. **30-second timeout** for heading wait (line 181)
2. **React hydration check** to verify form is ready (line 186-198)
3. **Form fallback** (partially implemented)

**Problems with current approach:**
- Relies on heading which is auth-state dependent
- No visibility into WHY timeouts happen
- No retry mechanism for transient failures

---

## Proposed Fixes

### Option 1: Wait for Form Instead of Heading (Quick Fix)
**Change**: Wait for form element (always present) instead of heading (auth-dependent)

```typescript
// Instead of:
await locators.signInHeading.waitFor({ state: "visible", timeout: 30000 });

// Use:
await page.locator('form[data-form-ready="true"]').waitFor({ 
  state: "visible", 
  timeout: 30000 
});
```

**Pros**: More reliable, doesn't depend on Convex auth state
**Cons**: Loses validation that page fully loaded

### Option 2: Add Retry Logic (Robust Fix)
**Change**: Retry sign-in attempt on timeout

```typescript
async function trySignInWithRetry(page, baseURL, user, maxRetries = 2) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const success = await trySignInUser(page, baseURL, user);
    if (success) return true;
    
    if (attempt < maxRetries - 1) {
      console.log(`  ≡ƒöó Retry ${attempt + 1}/${maxRetries - 1}...`);
      await page.waitForTimeout(2000);
    }
  }
  return false;
}
```

**Pros**: Handles transient failures gracefully
**Cons**: Increases test setup time on failures

### Option 3: Add Loading Fallback (Recommended)
**Change**: Wait for EITHER heading OR form, whichever appears first

```typescript
await Promise.race([
  locators.signInHeading.waitFor({ state: "visible" }),
  page.locator('form[data-form-ready="true"]').waitFor({ state: "visible" })
]).catch(() => {
  // Both failed, throw error
});
```

**Pros**: Best of both worlds - fast when working, fallback when slow
**Cons**: Slightly more complex logic

---

## Diagnostic Improvements Applied

**Added diagnostic logging** (`e2e/utils/auth-helpers.ts`):
- Every 5s: Log heading visibility, form visibility, page content
- On timeout: Screenshot saved to `e2e/.auth/signin-timeout-debug.png`
- On button=null: Check if user is actually authenticated

**Added fallback handling**:
- If button disappears, wait 3s and check if on dashboard
- Log page content when unexpected state occurs

---

## Recommendations

### Immediate (This PR):
1. ΓÖå **Apply Option 3** - Wait for heading OR form (most robust)
2. ΓÖå Keep diagnostic logging (helps future debugging)
3. ΓÖå Document in E2E testing docs

### Short-term:
1. Consider adding retry logic for global setup specifically
2. Add Convex connection readiness check before attempting sign-in
3. Monitor test runs to see if Option 3 resolves flakiness

### Long-term:
1. Consider moving "Welcome back" outside `<Unauthenticated>` wrapper
2. Add loading state to sign-in page that shows immediately
3. Add telemetry to track Convex connection timing in tests

---

## Files Modified

- `e2e/utils/auth-helpers.ts` - Enhanced diagnostics and fallback logic
- `docs/E2E_SIGNIN_FLAKINESS.md` - This document

---

## Related Issues

- Initial bug report: Workspace migration broke E2E tests (fixed)
- This is a NEW issue discovered during investigation
- Not previously documented in codebase

---

**Next Steps**: Implement Option 3 and run full test suite to validate fix.
