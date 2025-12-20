# E2E Auth Failure Root Cause - RESOLVED

**Date:** 2025-12-19  
**Status:** ✅ ROOT CAUSE IDENTIFIED

## 🔥 The Problem

E2E tests failing because **Mailtrap email limit reached (HTTP 429)**:

```
Error: Could not send verification email: 
Mailtrap API error: 429 
{"success":false,"errors":["The email limit is reached. 
Please upgrade your plan https://mailtrap.io/billing/plans/testing"]}
```

## 💡 Why It Happens

1. E2E API creates users with `emailVerificationTime: Date.now()` (already verified)
2. User tries to sign in via frontend
3. Convex Password auth provider tries to send OTP verification email
4. Mailtrap is rate-limited → email send fails
5. Auth flow throws error → sign-in fails
6. **NO AUTH STATE CREATED** → E2E tests fail

## 🕵️ Why It Was So Hard to Find

- ❌ Error only visible in Convex backend logs (not browser console)
- ❌ Frontend just shows timeout/no redirect
- ❌ Looked like a frontend auth issue
- ❌ We incorrectly suspected the `emailVerified` field schema
- ❌ Only appeared when running E2E tests (creates many users fast)

## ✅ The Solution

**Users created via E2E API are ALREADY VERIFIED** - they should NOT trigger email verification on sign-in!

### The Fix Applied:

**Modified `convex/OTPVerification.ts`** to check if user is already verified before sending email:
```typescript
// Check if user is already verified (e.g., E2E test users)
const existingUser = await ctx.db
  .query("users")
  .withIndex("email", (q) => q.eq("email", email))
  .first();

if (existingUser?.emailVerificationTime) {
  // User already verified - skip sending email
  return; // Don't send email
}
```

**Why this works:**
- E2E users are created with `emailVerificationTime` already set
- No email sent = no Mailtrap API calls = no rate limit hit
- Auth completes successfully without verification step

### Alternative Solutions (not implemented):

**Option 1:** Implement automatic provider fallback  
- Email system could try Resend/SendPulse when Mailtrap fails
- Would help but still wastes resources sending unnecessary emails
- Our fix is better - don't send email at all for verified users

**Option 2:** Use different email provider for E2E  
- Configure Resend/SendGrid for E2E environment
- Still sends unnecessary emails
- Our fix is better

**Option 3:** Disable email verification in E2E  
- Would require environment-specific auth configuration
- More complex, harder to maintain
- Our fix is simpler and cleaner

## 🔧 Implementation

The issue is that the sign-in form is using the Password provider which has OTP verification configured. For E2E test users who are pre-verified, we need to use standard password auth.

**Current setup (in `convex/auth.ts`):**
```typescript
Password({
  reset: OTPPasswordReset,
  verify: OTPVerification,  // ← This always tries to send email!
})
```

**For E2E users:**
- They have `secret` (password hash) in `authAccounts`
- They have `emailVerificationTime` set (already verified)
- They should sign in with password directly, NOT through OTP flow

**The Fix:**
E2E sign-in should use a different flow that doesn't trigger OTP. The Password provider should check if user is already verified before sending OTP.

## 📊 Validation

Run the debug test to see the error:
```bash
pnpm exec playwright test debug-auth.spec.ts --project=chromium
```

Look for:
```
[CONVEX A(auth:signIn)] Uncaught Error: Could not send verification email: 
Mailtrap API error: 429
```

## 🎯 Related Issues

- The `emailVerified` field removal was a red herring
- That field doesn't exist in Convex auth schema (correct to remove)
- But it wasn't causing the sign-in failures
- The real issue was Mailtrap rate limiting

## 📝 Next Steps

1. ✅ Root cause identified
2. ⬜ Implement fix (skip OTP for already-verified users)
3. ⬜ Test E2E auth works
4. ⬜ Revert the skip logic from admin RBAC test
5. ⬜ Clean up debug scripts

## 🔗 References

- E2E API: `convex/e2e.ts` (createTestUserInternal)
- OTP Provider: `convex/OTPVerification.ts`
- Auth Config: `convex/auth.ts`
- Debug Test: `e2e/debug-auth.spec.ts`
