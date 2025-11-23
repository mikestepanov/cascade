# Convex Backend TODO - Health Check Issues

**Last Updated:** 2025-11-23
**Status:** 🔴 **CRITICAL** - TypeScript Errors Blocking Development

---

## 🔴 CRITICAL: TypeScript Compilation Failures

### Issue #1: AI Module TypeScript Errors (87+ errors)
**Severity:** CRITICAL
**Status:** ❌ BLOCKING
**Location:** `convex/ai/*.ts` (5 files)

#### Error Breakdown:
- **25 errors:** Missing `@types/node` for `process.env` access
- **11 errors:** Unused `@ts-expect-error` directives (types may be stale)
- **50+ errors:** Implicit `any` types on function parameters
- **2 errors:** Missing imports from `@convex-dev/auth/server` and `convex/values`

#### Affected Files:
1. `convex/ai/actions.ts` - 21 errors
2. `convex/ai/mutations.ts` - 16 errors
3. `convex/ai/queries.ts` - 24 errors
4. `convex/ai/config.ts` - 8 errors
5. `convex/ai/providers.ts` - 1 error

#### Example Errors:
```
convex/ai/config.ts(30,24): error TS2580: Cannot find name 'process'.
Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.

convex/ai/actions.ts(22,19): error TS7006: Parameter 'ctx' implicitly has an 'any' type.

convex/ai/actions.ts(29,5): error TS2578: Unused '@ts-expect-error' directive.
```

#### Root Causes:
1. **Missing Node Types in Convex tsconfig**
   - `convex/tsconfig.json` doesn't include `@types/node`
   - `process.env` access fails without Node types

2. **Stale Type Generation**
   - Multiple `@ts-expect-error` comments suggest types haven't been regenerated
   - Convex dev server may need to be restarted

3. **Lack of Type Annotations**
   - Many functions use implicit `any` types instead of proper Convex types
   - Violates strict TypeScript mode

#### Fix Steps:

**Step 1: Update convex/tsconfig.json**
```json
{
  "compilerOptions": {
    "allowJs": true,
    "strict": true,
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "types": ["node"],  // ← ADD THIS LINE
    "target": "ESNext",
    "lib": ["ES2021", "dom"],
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["./**/*"],
  "exclude": ["./_generated"]
}
```

**Step 2: Regenerate Convex Types**
```bash
# Start Convex dev server to regenerate types
npx convex dev
```

**Step 3: Fix Implicit Any Types**

Example fix for `convex/ai/actions.ts`:
```typescript
// Before (implicit any - ERROR)
handler: async (ctx, args) => {
  // ...
}

// After (explicit types - OK)
import { ActionCtx } from "../_generated/server";

handler: async (ctx: ActionCtx, args: { chatId: Id<"aiChats">; message: string }) => {
  // ...
}
```

**Step 4: Remove Unused @ts-expect-error**
After regenerating types, remove the 11 unused `@ts-expect-error` comments.

#### Estimated Effort:
- 🕐 **2-4 hours** (including testing)

---

## 🟡 HIGH: Deprecated Schema Field Still Active

### Issue #2: projects.members Array Migration Incomplete
**Severity:** HIGH
**Status:** ⚠️ DATA INCONSISTENCY RISK
**Location:** `convex/schema.ts:67`, multiple usage sites

#### Problem:
The `projects.members` field is marked as "deprecated" in schema but is still actively used:

**Schema Definition:**
```typescript
// convex/schema.ts:67
members: v.array(v.id("users")), // Kept for backwards compatibility, deprecated
```

**Active Usage (6+ locations):**
1. `convex/onboarding.ts` - Creates sample project with `members: [userId]`
2. `convex/projectTemplates.ts` - Template instantiation uses `members: [userId]`
3. `convex/projects.ts:46` - Project creation: `members: [userId]`
4. `convex/projects.ts:77` - Project list filtering: `project.members.includes(userId)`
5. `convex/projects.ts` - Add member: `members: [...project.members, user._id]`
6. `convex/projects.ts` - Remove member: `members: project.members.filter(...)`

#### Current State:
- ✅ `projectMembers` table exists (proper RBAC implementation)
- ⚠️ `members` array is updated alongside `projectMembers`
- ❌ No migration script to backfill data
- ❌ Some queries check `members` array instead of `projectMembers` table

#### Issues This Causes:
1. **Data Duplication** - Same data in two places
2. **Sync Risk** - Updates might miss one or the other
3. **Performance** - Filtering arrays is slower than indexed queries
4. **Confusion** - Developers don't know which to use

#### Options to Fix:

**Option A: Complete Migration (RECOMMENDED)**
1. Create migration script to ensure all `projectMembers` records exist
2. Update all queries to use `projectMembers` table instead of `members` array
3. Remove `members` field from schema (breaking change - requires version bump)
4. Add schema migration notes to CHANGELOG

**Estimated Effort:** 🕐 4-6 hours

**Option B: Document Dual System**
1. Add clear documentation that both must be kept in sync
2. Create helper functions to ensure both update together
3. Add tests to validate synchronization
4. Keep both systems indefinitely

**Estimated Effort:** 🕐 1-2 hours

**Recommendation:** Choose Option A for long-term maintainability.

---

## 🟡 MEDIUM: Incomplete Feature Implementations

### Issue #3: Email Invitations Not Functional
**Severity:** MEDIUM
**Status:** ⚠️ STUB IMPLEMENTATION
**Location:** `convex/invites.ts:95, :176`

#### Problem:
User invitation system has TODO comments where email sending should happen:

```typescript
// convex/invites.ts:95
// TODO: Send email with invite link

// convex/invites.ts:176
// TODO: Send email with invite link again
```

#### Impact:
- Users can't receive invitation emails
- Invitation system is non-functional without manual link sharing
- Poor user experience

#### Fix Required:
Implement email sending using existing email infrastructure (`convex/email/`):

```typescript
// Example implementation
import { sendEmail } from "./email/index";

// In createInvite mutation
await ctx.scheduler.runAfter(0, internal.email.notifications.sendInviteEmail, {
  email: args.email,
  inviteToken: token,
  invitedBy: userId,
});
```

**Estimated Effort:** 🕐 2-3 hours

---

### Issue #4: Google Calendar Sync Incomplete
**Severity:** MEDIUM
**Status:** ⚠️ STUB IMPLEMENTATION
**Location:** `convex/http/googleOAuth.ts:236, :247`

#### Problem:
Google Calendar integration has TODO markers:

```typescript
/**
 * TODO: Complete Google Calendar sync implementation
 */

/* TODO: Implement this properly */
```

#### Impact:
- Advertised feature may not work as expected
- Users expecting calendar sync will be disappointed

#### Fix Required:
1. Implement bi-directional sync logic
2. Handle OAuth token refresh
3. Add error handling for API failures
4. Test with real Google Calendar API

**Estimated Effort:** 🕐 8-12 hours (complex OAuth implementation)

---

### Issue #5: Excessive @ts-expect-error Usage
**Severity:** MEDIUM
**Status:** ⚠️ TYPE SAFETY BYPASS
**Location:** Multiple files (26+ usages)

#### Problem:
26+ `@ts-expect-error` comments throughout codebase:

**By File:**
- `convex/ai/actions.ts` - 10 instances
- `convex/pumble.ts` - 6 instances
- `convex/email/notifications.ts` - 3 instances
- `convex/email/digests.ts` - 2 instances
- `convex/email/helpers.ts` - 1 instance
- `convex/crons.ts` - 2 instances
- `convex/api/issues.ts` - 1 instance

#### Common Patterns:
1. "Convex types need regeneration after adding X module"
2. "Convex bug: subdirectory modules not typed in internal export"

#### Issues:
- Disables TypeScript safety checks
- May hide real errors
- Makes refactoring risky
- 11 of these are "Unused" (errors no longer exist)

#### Fix Required:
1. **Run `npx convex dev`** to regenerate types
2. **Remove unused directives** (11 of them)
3. **Fix remaining type issues** properly instead of suppressing
4. **Update code** to work with generated types

**Estimated Effort:** 🕐 3-4 hours

---

## 🟢 INFORMATIONAL: Code Quality Items

### Issue #6: Console Statement in Production Code
**Severity:** LOW
**Location:** 1 instance in backend code

Found 1 console statement in production backend code (excluding tests).

**Recommendation:** Remove or replace with proper logging.

---

## 📊 Summary Statistics

| Category | Count | Severity |
|----------|-------|----------|
| TypeScript Errors | 87+ | 🔴 Critical |
| Deprecated Fields | 1 | 🟡 High |
| Incomplete Features | 3 | 🟡 Medium |
| @ts-expect-error | 26 | 🟡 Medium |
| Console Logs | 1 | 🟢 Low |

---

## 🎯 Recommended Fix Order

### Phase 1: Critical (Do First) ⚡
1. ✅ **Fix AI Module TypeScript Errors** (2-4 hours)
   - Update tsconfig with Node types
   - Regenerate Convex types
   - Add proper type annotations
   - Remove unused @ts-expect-error

**Blockers Resolved:**
- ✅ TypeScript compilation passes
- ✅ Development workflow unblocked
- ✅ CI/CD can run type checks

### Phase 2: High Priority (This Week) 📅
2. ✅ **Complete Member Migration** (4-6 hours)
   - Migrate to projectMembers table fully
   - Remove deprecated members array
   - Update all queries

**Benefits:**
- ✅ Cleaner data model
- ✅ Better performance
- ✅ Reduced confusion

### Phase 3: Features (This Month) 🚀
3. ✅ **Implement Email Invitations** (2-3 hours)
4. ✅ **Complete Google Calendar Sync** (8-12 hours)
5. ✅ **Clean up @ts-expect-error** (3-4 hours)

---

## 🔐 Security Notes

✅ **No security vulnerabilities found in Convex backend code**
- Proper authentication checks using `getAuthUserId(ctx)`
- RBAC implementation with role hierarchy
- API key hashing (not plaintext storage)
- Input validation using Convex validators

---

## 🧪 Testing Status

**Backend Test Files:** 9
- ✅ analytics.test.ts
- ✅ automationRules.test.ts
- ✅ documents.test.ts
- ✅ issues.test.ts
- ✅ notifications.test.ts
- ✅ projects.test.ts
- ✅ rbac.test.ts
- ✅ sprints.test.ts
- ✅ webhooks.test.ts

**Untested Modules:** ~19 (see `TODO.md`)

**Test Infrastructure:** ✅ Complete
- `convex-test` configured
- `vitest.convex.config.ts` set up
- Test utilities created

**Blocker:** Tests require active Convex deployment to run.

---

## 📚 Related Documentation

- **Main TODO:** `TODO.md` - Product roadmap
- **Human Tasks:** `HUMAN_TODO.md` - Manual setup instructions
- **Testing:** `convex/TESTING_STATUS.md` - Test infrastructure status
- **Schema:** `convex/schema.ts` - Database schema definition
- **Auth:** `docs/AUTHENTICATION.md` - Authentication guide

---

## ✅ Next Steps

1. **Immediate:**
   ```bash
   # Step 1: Update convex/tsconfig.json (add "types": ["node"])
   # Step 2: Start Convex dev server
   npx convex dev

   # Step 3: Run type check (should pass)
   pnpm run typecheck
   ```

2. **This Week:**
   - Complete member migration
   - Implement email invitations

3. **This Month:**
   - Complete Google Calendar sync
   - Clean up @ts-expect-error usage
   - Improve test coverage

---

**Questions or Issues?**
Refer to CLAUDE.md for development patterns and conventions.
