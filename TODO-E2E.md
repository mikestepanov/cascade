# E2E Test Issues

## Auth Form Expansion Flakiness

**Status:** Partially fixed, still flaky

**Problem:** The sign-in/sign-up form has a collapsed/expanded state. The "Continue with email" button click sometimes doesn't register, leaving the form collapsed.

**What was fixed:**

- Changed `expandEmailForm()` to check `data-form-ready="true"` attribute instead of input visibility
- Changed `clickForgotPassword()` to use `force: true`
- Added retry loop with `toPass()`

**Still needed:**

- Debug why button click doesn't always trigger React state change
- May need to wait for specific React hydration signals before clicking
- Consider using `evaluate()` to call click directly on the DOM element

**Files:**

- `e2e/pages/auth.page.ts` - `expandEmailForm()` method
- `e2e/auth-comprehensive.spec.ts` - "displays all sign in form elements" test

## Dashboard Infrastructure Issues

**Status:** Fixed

**Problem:** 22 tests were failing due to dashboard not loading because of a reversed-word slug collision ("dashboard").

**Fix:**

- Standardized E2E slug generation to use worker-isolated strings (`nixelo-e2e-wX`).
- Tightened `extractOrganizationSlug` in `global-setup.ts` to reject reserved words.
- Added frontend safety check in `_auth/_app/route.tsx`.

**Files:**

- `e2e/fixtures/auth.fixture.ts` - `orgSlug` fixture
- `e2e/pages/dashboard.page.ts` - `goto()` method
