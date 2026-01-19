# Convex Implementation TODO

This document tracks gaps between current Convex usage and documented best practices. Issues are prioritized by impact and effort.

**Generated:** 2026-01-19
**Based on:** [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/), [Authorization Guide](https://stack.convex.dev/authorization), [Query Performance](https://stack.convex.dev/convex-query-performance)

---

## Summary

| Priority | Category | Issues |
|----------|----------|--------|
| 🔴 Critical | Error Handling | 1 |
| 🔴 Critical | Query Performance | 2 |
| 🟠 High | Type Safety | 2 |
| 🟠 High | Security | 2 |
| 🟡 Medium | Code Organization | 3 |
| 🟡 Medium | Performance | 2 |
| 🟢 Low | Documentation | 2 |
| 🟢 Low | Cleanup | 2 |

**Total: 16 issues**

---

## 🔴 Critical Priority

### 1. Adopt ConvexError for Application Errors

**Issue:** Zero usage of `ConvexError`, 632 uses of `throw new Error`

**Current Pattern:**
```typescript
// ❌ Current - error message redacted in production
if (!userId) throw new Error("Not authenticated");
if (!project) throw new Error("Project not found");
if (!canEdit) throw new Error("Access denied");
```

**Best Practice:**
```typescript
// ✅ Recommended - data preserved in production
import { ConvexError } from "convex/values";

if (!userId) throw new ConvexError({ code: "UNAUTHENTICATED" });
if (!project) throw new ConvexError({ code: "NOT_FOUND", resource: "project", id: args.projectId });
if (!canEdit) throw new ConvexError({ code: "FORBIDDEN", action: "edit", resource: "project" });
```

**Why it matters:**
- Regular `Error` messages are redacted to "Server Error" in production
- `ConvexError.data` is preserved and sent to client
- Enables structured client-side error handling
- Distinguishes expected failures from bugs

**Files affected:** 80 files with `throw new Error`

**Action items:**
- [ ] Create `convex/lib/errors.ts` with typed error factory functions
- [ ] Define error codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `RATE_LIMITED`, `CONFLICT`
- [ ] Migrate auth errors first (highest impact)
- [ ] Migrate permission errors
- [ ] Migrate not-found errors
- [ ] Update frontend to handle `ConvexError` types

**Reference:** [Error Handling Docs](https://docs.convex.dev/functions/error-handling/)

---

### 2. Remove Date.now() from Queries

**Issue:** 383 uses of `Date.now()` - many in queries break caching

**Why this is critical:**
- `Date.now()` in queries breaks Convex's reactive subscription system
- Each call returns different value, causing unnecessary re-runs
- Breaks query caching and increases database load

**Current Anti-Pattern:**
```typescript
// ❌ In a query - breaks caching
export const getRecentActivity = query({
  handler: async (ctx) => {
    const cutoff = Date.now() - 86400000; // Different every millisecond!
    return await ctx.db.query("activity")
      .filter(q => q.gte(q.field("createdAt"), cutoff))
      .collect();
  }
});
```

**Best Practice Options:**

**Option A: Pass time from client (rounded)**
```typescript
// ✅ Client passes rounded time
export const getRecentActivity = query({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("activity")
      .filter(q => q.gte(q.field("createdAt"), args.since))
      .collect();
  }
});

// Client-side: round to nearest minute
const since = Math.floor(Date.now() / 60000) * 60000 - 86400000;
useQuery(api.activity.getRecentActivity, { since });
```

**Option B: Use scheduled function with boolean flag**
```typescript
// ✅ Cron sets flags, query reads flags
export const getRecentActivity = query({
  handler: async (ctx) => {
    return await ctx.db.query("activity")
      .withIndex("by_is_recent")
      .filter(q => q.eq(q.field("isRecent"), true))
      .collect();
  }
});
```

**Files to audit:**
- `convex/analytics.ts` - dashboard queries
- `convex/dashboard.ts` - metrics
- `convex/notifications.ts` - recent notifications
- `convex/issues/queries.ts` - activity feeds

**Action items:**
- [ ] Audit all 383 `Date.now()` usages
- [ ] Categorize: queries vs mutations (mutations are OK)
- [ ] Refactor query usages to pass time from client
- [ ] Consider adding `isRecent` flags for common patterns

**Reference:** [Best Practices - Other Recommendations](https://docs.convex.dev/understanding/best-practices/other-recommendations)

---

### 3. Audit Unbounded .collect() Calls

**Issue:** 226 `.collect()` calls - some may scan unlimited documents

**Why this is critical:**
- `.collect()` loads ALL matching documents into memory
- Can exceed read limits with large datasets
- Causes slow queries and high database bandwidth
- Documents filtered by `.filter()` still count against limits

**Current Risk Pattern:**
```typescript
// ❌ Potentially unbounded - could return 10,000+ issues
const allIssues = await ctx.db.query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .collect();
```

**Best Practice:**
```typescript
// ✅ Use pagination for large result sets
const result = await ctx.db.query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .paginate(args.paginationOpts);

// ✅ Or use .take() for known limits
const topIssues = await ctx.db.query("issues")
  .withIndex("by_project_priority")
  .take(100);

// ✅ Or use .first()/.unique() when expecting one result
const issue = await ctx.db.query("issues")
  .withIndex("by_key", q => q.eq("key", issueKey))
  .unique();
```

**High-risk files to audit:**
- `convex/e2e.ts` - 58 `.collect()` calls (test data seeding)
- `convex/issues/queries.ts` - 8 calls
- `convex/onboarding.ts` - 12 calls
- `convex/dashboard.ts` - 7 calls
- `convex/lib/batchHelpers.ts` - 22 calls

**Action items:**
- [ ] Audit each `.collect()` for unbounded potential
- [ ] Add `.take(limit)` where appropriate
- [ ] Implement pagination for list endpoints
- [ ] Use `.first()` or `.unique()` for single-document queries
- [ ] Add comments explaining expected max results

**Reference:** [Queries that Scale](https://stack.convex.dev/queries-that-scale)

---

## 🟠 High Priority

### 4. Replace v.any() with Explicit Validators

**Issue:** 13 uses of `v.any()` bypass runtime validation

**Locations:**
| File | Field | Reason |
|------|-------|--------|
| `schema.ts` | `snapshot` (documentVersions) | ProseMirror data |
| `schema.ts` | `content` (documentTemplates) | BlockNote content |
| `schema.ts` | `content` (projectTemplates) | Template structure |
| `schema.ts` | `settings` (userSettings) | User preferences |
| `webhooks.ts` | `payload` | External webhook data |
| `meetingBot.ts` | `transcriptData` | Transcription output |
| `auditLogs.ts` | `contextData` | Audit context |

**Best Practice:**
```typescript
// ❌ Current - no validation
snapshot: v.any(),

// ✅ Better - explicit structure (when known)
snapshot: v.object({
  type: v.string(),
  content: v.array(v.object({
    type: v.string(),
    attrs: v.optional(v.record(v.string(), v.any())),
    content: v.optional(v.array(v.any())),
  })),
}),

// ✅ OK - documented reason for v.any()
/** External webhook payload - structure varies by provider */
payload: v.any(),
```

**Action items:**
- [ ] Define ProseMirror snapshot validator (or document why v.any() is needed)
- [ ] Define BlockNote content validator
- [ ] Document each v.any() with JSDoc explaining why
- [ ] Consider creating `convex/validators/` for reusable complex validators

**Reference:** [Schema Validation](https://docs.convex.dev/database/schemas)

---

### 5. Implement Persistent Rate Limiting

**Issue:** Rate limiting uses in-memory store, loses state on restart

**Current implementation** (`convex/rateLimiting.ts`):
```typescript
// In-memory store - loses state on function restart
const store = new Map<string, TokenBucket>();

// Comment in code says:
// "In production, you might want to use a Convex table"
```

**Problem:**
- Serverless functions restart frequently
- Rate limits reset on each cold start
- Attackers can bypass by timing requests

**Best Practice:**
```typescript
// ✅ Use Convex table for persistent rate limiting
import { RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Configure limits
});

// In mutation:
const { ok, retryAfter } = await rateLimiter.limit(ctx, "apiKey", key);
if (!ok) {
  throw new ConvexError({ code: "RATE_LIMITED", retryAfter });
}
```

**Action items:**
- [ ] Verify `@convex-dev/rate-limiter` component is registered in `convex.config.ts`
- [ ] Migrate `convex/rateLimiting.ts` to use the component
- [ ] Update rate limit checks in API endpoints
- [ ] Add rate limit headers to HTTP responses

**Reference:** [Rate Limiter Component](https://github.com/get-convex/rate-limiter)

---

### 6. Add API Key Rotation Mechanism

**Issue:** No visible API key rotation or expiration

**Current state:**
- API keys stored as SHA-256 hash (good)
- No expiration date field
- No rotation mechanism
- No usage audit visible in schema

**Best Practice additions to `apiKeys` table:**
```typescript
apiKeys: defineTable({
  // Existing fields...

  // Add these:
  expiresAt: v.optional(v.number()),      // Key expiration
  lastUsedAt: v.optional(v.number()),     // Track usage
  rotatedFromId: v.optional(v.id("apiKeys")), // Key rotation chain
  isRevoked: v.optional(v.boolean()),     // Soft revoke
})
```

**Action items:**
- [ ] Add `expiresAt` field to apiKeys schema
- [ ] Add `lastUsedAt` tracking in validation
- [ ] Create `rotateApiKey` mutation
- [ ] Add cron job to warn about expiring keys
- [ ] Add cron job to revoke expired keys

---

## 🟡 Medium Priority

### 7. Create convex/model/ Directory for Domain Logic

**Issue:** Business logic scattered, no dedicated domain layer

**Current structure:**
```
convex/
├── issues.ts           # Queries + mutations mixed
├── issues/
│   ├── queries.ts      # Query functions
│   ├── mutations.ts    # Mutation functions
│   └── helpers.ts      # Some helpers
├── lib/
│   ├── batchHelpers.ts # Data fetching utilities
│   └── pagination.ts   # Pagination utilities
```

**Best Practice:**
```
convex/
├── model/                    # Domain logic (NEW)
│   ├── issues.ts            # Issue business rules
│   ├── projects.ts          # Project business rules
│   ├── permissions.ts       # Permission checks
│   └── workflows.ts         # Workflow transitions
├── issues/
│   ├── queries.ts           # Thin query wrappers
│   └── mutations.ts         # Thin mutation wrappers
├── lib/                     # Generic utilities
│   └── ...
```

**Benefits:**
- Clearer separation of concerns
- Easier to test business logic
- Queries/mutations become thin wrappers
- Reusable across queries and mutations

**Action items:**
- [ ] Create `convex/model/` directory
- [ ] Extract issue validation logic to `model/issues.ts`
- [ ] Extract permission checks to `model/permissions.ts`
- [ ] Update existing helpers to use model functions

**Reference:** [Opinionated Guidelines](https://gist.github.com/srizvi/966e583693271d874bf65c2a95466339)

---

### 8. Remove Redundant Single-Field Indexes

**Issue:** Some single-field indexes are redundant when composite exists

**Best Practice:**
> Indexes like `by_foo` and `by_foo_and_bar` are usually redundant (you only need `by_foo_and_bar`)

**Example from schema:**
```typescript
// workspaceMembers table
.index("by_workspace", ["workspaceId"])           // ❌ Redundant
.index("by_workspace_user", ["workspaceId", "userId"])  // ✅ Covers both

// projectMembers table
.index("by_project", ["projectId"])               // ❌ Redundant
.index("by_project_user", ["projectId", "userId"]) // ✅ Covers both
```

**Why redundant:**
- Composite index `by_workspace_user` can be used for queries on just `workspaceId`
- Extra indexes increase write overhead and storage

**Exception:** Keep both if you need different sort orders

**Action items:**
- [ ] Audit all indexes in schema.ts
- [ ] Identify redundant single-field indexes
- [ ] Verify no queries depend on specific sort order
- [ ] Remove redundant indexes
- [ ] Test affected queries

---

### 9. Replace .filter() with .withIndex() Where Possible

**Issue:** 366 `.filter()` calls - some could use indexes

**Why it matters:**
- `.filter()` scans documents AFTER loading from index
- Filtered documents still count against bandwidth
- `.withIndex()` conditions are much more efficient

**Current Pattern:**
```typescript
// ❌ Scans all project issues, then filters
const openIssues = await ctx.db.query("issues")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .filter(q => q.neq(q.field("status"), "done"))
  .collect();
```

**Best Practice:**
```typescript
// ✅ Use composite index
const openIssues = await ctx.db.query("issues")
  .withIndex("by_project_status", q =>
    q.eq("projectId", projectId)
     .neq("status", "done")
  )
  .collect();
```

**Action items:**
- [ ] Audit `.filter()` usages in high-traffic queries
- [ ] Identify patterns that could use composite indexes
- [ ] Add missing indexes to schema
- [ ] Refactor queries to use `.withIndex()` conditions

**Reference:** [Indexes and Query Performance](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf)

---

### 10. Reduce ctx.runQuery/runMutation in Actions

**Issue:** 100 uses of `ctx.runQuery`/`ctx.runMutation` - some may be unnecessary

**Best Practice:**
> Avoid `runAction` if a plain function works. Minimize `ctx.runQuery` and `ctx.runMutation` in queries/mutations; use TypeScript helpers instead.

**When ctx.runQuery IS needed:**
- In HTTP actions (no direct DB access)
- In scheduled actions
- When you need separate transaction (partial rollback)

**When to use plain helpers instead:**
```typescript
// ❌ Unnecessary in mutation
const user = await ctx.runQuery(internal.users.get, { userId });

// ✅ Use direct DB access
const user = await ctx.db.get(userId);

// ✅ Or use helper function
const user = await getUserById(ctx, userId);
```

**Action items:**
- [ ] Audit `ctx.runQuery`/`ctx.runMutation` usages
- [ ] Replace with direct DB access or helpers where possible
- [ ] Keep only for: HTTP actions, scheduled tasks, partial rollback scenarios

---

### 11. Update Cron Syntax

**Issue:** Using `crons.daily()` and `crons.weekly()` - docs recommend avoiding

**Current (`convex/crons.ts`):**
```typescript
crons.daily("send daily digests", { hourUTC: 9, minuteUTC: 0 }, ...);
crons.weekly("send weekly digests", { dayOfWeek: "monday", ... }, ...);
```

**Best Practice:**
```typescript
// ✅ Use crons.cron() with cron expression
crons.cron("send daily digests", "0 9 * * *", internal.email.digests.sendDailyDigests);
crons.cron("send weekly digests", "0 9 * * 1", internal.email.digests.sendWeeklyDigests);
```

**Action items:**
- [ ] Convert `crons.daily()` to `crons.cron()` with expression
- [ ] Convert `crons.weekly()` to `crons.cron()` with expression
- [ ] Keep `crons.interval()` - that's fine

---

## 🟢 Low Priority

### 12. Add Authorization JSDoc to Custom Functions

**Issue:** Role requirements hidden in wrapper names

**Current:**
```typescript
export const updateIssue = editorMutation({...}); // Role hidden
```

**Best Practice:**
```typescript
/**
 * Update an issue's details.
 * @requires editor role on project
 * @throws FORBIDDEN if user lacks editor role
 */
export const updateIssue = editorMutation({...});
```

**Action items:**
- [ ] Add JSDoc to all custom function exports
- [ ] Document required roles explicitly
- [ ] Document thrown error codes

---

### 13. Create Error Handling Documentation

**Issue:** No internal doc explaining error patterns

**Create `docs/CONVEX_ERRORS.md`:**
- Error code definitions
- When to use ConvexError vs Error
- Client-side error handling patterns
- Error boundary setup

**Action items:**
- [ ] Create `docs/CONVEX_ERRORS.md`
- [ ] Document all error codes
- [ ] Add examples for common scenarios

---

### 14. Create Performance Guidelines Documentation

**Issue:** No internal doc for query optimization

**Create `docs/CONVEX_PERFORMANCE.md`:**
- Index design guidelines
- When to use pagination
- Denormalization strategies
- Date.now() alternatives
- Batch fetching patterns

**Action items:**
- [ ] Create `docs/CONVEX_PERFORMANCE.md`
- [ ] Document indexing patterns
- [ ] Document pagination patterns
- [ ] Add real examples from codebase

---

### 15. Clean Up Test-Only Code Patterns

**Issue:** `@ts-nocheck` in test files suggests type complexity

**File:** `convex/issues.test.ts`
```typescript
// @ts-nocheck - suggests type system strain
```

**Action items:**
- [ ] Investigate why @ts-nocheck is needed
- [ ] Fix underlying type issues if possible
- [ ] Document if truly necessary

---

### 16. Add Soft Delete Cleanup Monitoring

**Issue:** Soft delete cleanup exists but no monitoring

**Current:** `crons.ts` runs cleanup daily, but no visibility into:
- How many items deleted
- Any failures
- Cleanup duration

**Action items:**
- [ ] Add logging to `softDeleteCleanup.permanentlyDeleteOld`
- [ ] Consider storing cleanup stats in a table
- [ ] Add alerting for cleanup failures

---

## Implementation Order

### Phase 1: Critical (Week 1-2)
1. [ ] Create error handling infrastructure (ConvexError)
2. [ ] Audit and fix Date.now() in queries
3. [ ] Audit unbounded .collect() calls

### Phase 2: High (Week 3-4)
4. [ ] Replace v.any() with validators
5. [ ] Implement persistent rate limiting
6. [ ] Add API key rotation

### Phase 3: Medium (Week 5-6)
7. [ ] Create convex/model/ directory
8. [ ] Remove redundant indexes
9. [ ] Optimize .filter() to .withIndex()
10. [ ] Reduce unnecessary ctx.runQuery
11. [ ] Update cron syntax

### Phase 4: Low (Ongoing)
12. [ ] Add JSDoc to functions
13. [ ] Create error handling docs
14. [ ] Create performance docs
15. [ ] Clean up test code
16. [ ] Add cleanup monitoring

---

## References

- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Authorization Best Practices](https://stack.convex.dev/authorization)
- [Error Handling Docs](https://docs.convex.dev/functions/error-handling/)
- [Query Performance Guide](https://stack.convex.dev/convex-query-performance)
- [Indexes and Query Performance](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf)
- [Opinionated Convex Guidelines](https://gist.github.com/srizvi/966e583693271d874bf65c2a95466339)
- [Queries that Scale](https://stack.convex.dev/queries-that-scale)
- [The Zen of Convex](https://docs.convex.dev/understanding/zen)

---

*Last Updated: 2026-01-19*
