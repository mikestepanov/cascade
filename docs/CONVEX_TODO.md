# Convex Implementation TODO

Tracks gaps between current Convex usage and best practices. Prioritized by impact.

**Updated:** 2026-01-19

---

## Summary

| Priority | Category | Issues | Status |
|----------|----------|--------|--------|
| 🔴 Critical | Error Handling | 1 | 🟡 In Progress (~234 remaining) |
| 🔴 Critical | Query Performance - .collect() | 1 | ⬜ Not Started |
| 🟠 High | Security - Rate Limiting | 1 | ⬜ Not Started |
| 🟠 High | Security - API Key Rotation | 1 | ⬜ Not Started |
| 🟡 Medium | Code Organization | 1 | ⬜ Not Started |
| 🟡 Medium | Performance - Indexes | 2 | ⬜ Not Started |
| 🟡 Medium | Performance - ctx.runQuery | 1 | ⬜ Not Started |
| 🟡 Medium | Cron Syntax | 1 | ⬜ Not Started |
| 🟢 Low | Documentation | 2 | ⬜ Not Started |
| 🟢 Low | Cleanup | 2 | ⬜ Not Started |

**Total: 13 issues remaining**

---

## 🔴 Critical Priority

### 1. Migrate to ConvexError for Application Errors

**Issue:** ~234 uses of `throw new Error` need migration to `ConvexError`

**Infrastructure complete:**
- `convex/lib/errors.ts` with typed error factory functions
- Error codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `RATE_LIMITED`, `CONFLICT`
- Custom functions already use `unauthenticated()` (19 files)

**Remaining work:**
```typescript
// ❌ Current - error message redacted in production
throw new Error("Project not found");
throw new Error("Access denied");

// ✅ Target - data preserved in production
throw new ConvexError({ code: "NOT_FOUND", resource: "project", id: args.projectId });
throw new ConvexError({ code: "FORBIDDEN", action: "edit", resource: "project" });
```

**Files to migrate:** ~60 files with `throw new Error`

**Action items:**
- [ ] Migrate auth errors in remaining files
- [ ] Migrate NOT_FOUND errors
- [ ] Migrate FORBIDDEN errors
- [ ] Migrate VALIDATION errors
- [ ] Update frontend to handle `ConvexError` types

**Reference:** [Error Handling Docs](https://docs.convex.dev/functions/error-handling/)

---

### 2. Audit Unbounded .collect() Calls

**Issue:** 226 `.collect()` calls - some may scan unlimited documents

**Risk:** `.collect()` loads ALL matching documents into memory, can exceed limits.

**High-risk files:**
- `convex/e2e.ts` - 58 calls (test data)
- `convex/issues/queries.ts` - 8 calls
- `convex/onboarding.ts` - 12 calls
- `convex/dashboard.ts` - 7 calls
- `convex/lib/batchHelpers.ts` - 22 calls

**Action items:**
- [ ] Audit each `.collect()` for unbounded potential
- [ ] Add `.take(limit)` where appropriate
- [ ] Implement pagination for list endpoints
- [ ] Use `.first()` or `.unique()` for single-document queries

**Reference:** [Queries that Scale](https://stack.convex.dev/queries-that-scale)

---

## 🟠 High Priority

### 3. Implement Persistent Rate Limiting

**Issue:** Rate limiting uses in-memory store, resets on cold start

**Current:** `convex/rateLimiting.ts` uses `Map<string, TokenBucket>` - loses state on restart.

**Solution:** Use `@convex-dev/rate-limiter` component with Convex table storage.

**Action items:**
- [ ] Verify component is registered in `convex.config.ts`
- [ ] Migrate `convex/rateLimiting.ts` to use the component
- [ ] Update rate limit checks in API endpoints
- [ ] Add rate limit headers to HTTP responses

**Reference:** [Rate Limiter Component](https://github.com/get-convex/rate-limiter)

---

### 4. Add API Key Rotation Mechanism

**Issue:** No API key expiration or rotation

**Add to `apiKeys` table:**
```typescript
expiresAt: v.optional(v.number()),
lastUsedAt: v.optional(v.number()),
rotatedFromId: v.optional(v.id("apiKeys")),
isRevoked: v.optional(v.boolean()),
```

**Action items:**
- [ ] Add fields to apiKeys schema
- [ ] Add `lastUsedAt` tracking in validation
- [ ] Create `rotateApiKey` mutation
- [ ] Add cron job to warn about expiring keys

---

## 🟡 Medium Priority

### 5. Create convex/model/ Directory for Domain Logic

**Issue:** Business logic scattered, no dedicated domain layer

**Target structure:**
```
convex/
├── model/              # Domain logic (NEW)
│   ├── issues.ts       # Issue business rules
│   ├── projects.ts     # Project business rules
│   └── permissions.ts  # Permission checks
├── issues/
│   ├── queries.ts      # Thin query wrappers
│   └── mutations.ts    # Thin mutation wrappers
```

**Action items:**
- [ ] Create `convex/model/` directory
- [ ] Extract issue validation logic
- [ ] Extract permission checks
- [ ] Update existing helpers

---

### 6. Remove Redundant Single-Field Indexes

**Issue:** Some single-field indexes are redundant when composite exists

**Example:**
```typescript
.index("by_workspace", ["workspaceId"])           // ❌ Redundant
.index("by_workspace_user", ["workspaceId", "userId"])  // ✅ Covers both
```

**Action items:**
- [ ] Audit all indexes in schema.ts
- [ ] Identify redundant single-field indexes
- [ ] Remove redundant indexes
- [ ] Test affected queries

---

### 7. Replace .filter() with .withIndex()

**Issue:** 366 `.filter()` calls - some could use indexes

`.filter()` scans documents AFTER loading - filtered docs still count against bandwidth.

**Action items:**
- [ ] Audit `.filter()` usages in high-traffic queries
- [ ] Identify patterns that could use composite indexes
- [ ] Add missing indexes to schema
- [ ] Refactor queries to use `.withIndex()` conditions

---

### 8. Reduce ctx.runQuery/runMutation in Actions

**Issue:** 100 uses - some may be unnecessary

**When to use plain helpers instead:**
```typescript
// ❌ Unnecessary in mutation
const user = await ctx.runQuery(internal.users.get, { userId });

// ✅ Use direct DB access
const user = await ctx.db.get(userId);
```

**Action items:**
- [ ] Audit `ctx.runQuery`/`ctx.runMutation` usages
- [ ] Replace with direct DB access where possible

---

### 9. Update Cron Syntax

**Issue:** Using `crons.daily()` - docs recommend `crons.cron()` instead

**Action items:**
- [ ] Convert `crons.daily()` to `crons.cron()` with expression
- [ ] Convert `crons.weekly()` to `crons.cron()` with expression

---

## 🟢 Low Priority

### 10. Add Authorization JSDoc to Custom Functions

**Action items:**
- [ ] Add JSDoc to all custom function exports
- [ ] Document required roles explicitly
- [ ] Document thrown error codes

---

### 11. Create Error Handling Documentation

**Create `docs/CONVEX_ERRORS.md`** with error codes, patterns, client-side handling.

---

### 12. Create Performance Guidelines Documentation

**Create `docs/CONVEX_PERFORMANCE.md`** with index design, pagination, batch patterns.

---

### 13. Clean Up Test-Only Code Patterns

**File:** `convex/issues.test.ts` has `@ts-nocheck` - investigate why.

---

### 14. Add Soft Delete Cleanup Monitoring

Add logging/stats to `softDeleteCleanup.permanentlyDeleteOld`.

---

## Implementation Order

### Phase 1: Critical (Current)
1. 🟡 Migrate `throw new Error` → `ConvexError` (~234 remaining)
2. ⬜ Audit unbounded `.collect()` calls

### Phase 2: High
3. ⬜ Implement persistent rate limiting
4. ⬜ Add API key rotation

### Phase 3: Medium
5-9. Code organization, indexes, performance

### Phase 4: Low (Ongoing)
10-14. Documentation, cleanup

---

## References

- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Error Handling Docs](https://docs.convex.dev/functions/error-handling/)
- [Query Performance Guide](https://stack.convex.dev/convex-query-performance)
- [Queries that Scale](https://stack.convex.dev/queries-that-scale)
