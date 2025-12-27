# Convex Architectural Review & TODOs

This document outlines architectural improvements, risks, and recommended actions for the Convex backend, based on a comprehensive codebase review and analysis of Convex best practices.

## 🚨 Critical Priority (Performance & Scalability)

### 1. ✅ Implement Efficient Rate Limiting (COMPLETED)

**Status**: ✅ **COMPLETED** - Migrated to `@convex-dev/rate-limiter`

**What was done**:
- Replaced O(N) row counting approach with O(1) token bucket algorithm
- Integrated `@convex-dev/rate-limiter` component (already configured in `convex.config.ts`)
- Created `convex/lib/rateLimiter.ts` with `checkApiKeyRateLimit` function
- Updated `convex/lib/apiAuth.ts` to use the new rate limiter
- Added `rateLimits` table to schema for component storage
- No longer collecting all usage logs to check limits

**Benefits**:
- **Performance**: O(1) operations instead of O(N)
- **Scalability**: Token bucket algorithm handles high traffic efficiently
- **Transactional**: Uses Convex component's atomic counters
- **Reliable**: Professional implementation with proper edge cases handled

**Files modified**:
- `convex/lib/rateLimiter.ts` (new file)
- `convex/lib/apiAuth.ts` (refactored `checkRateLimit` function)
- `convex/schema.ts` (added `rateLimits` table)

### 2. Scalable Roadmap Query (Pagination)

**Current State**: `listRoadmapIssues` in `issues.ts` fetches **all** root issues for a project/sprint without pagination.
**Risk**: Scalability cliff. A project with 2,000+ tickets will cause slow loads or function timeouts (`Limit exceeded`).
**Recommended Action**:

- Implement cursor-based pagination using `paginationOpts`.
- Update the UI to support "Load More" or "Infinite Scroll" for the roadmap view.
- **Action Item**: Refactor `listRoadmapIssues` to use `.paginate(args.paginationOpts)`.

### 3. Safety: Transition to Soft Deletes

**Current State**: `bulkDelete` in `issues.ts` permanently removes issues and all related records (comments, etc.).
**Risk**: Data loss. No "Undo" functionality. Accidental deletion is catastrophic.
**Recommended Action**:

- Add `isDeleted: v.optional(v.boolean())` and `deletedAt: v.optional(v.number())` to key tables (`issues`, `projects`).
- Update queries to filter `q.neq("isDeleted", true)`.
- Use a cron job (`crons.ts`) to permanently delete items older than 30 days.
- **Action Item**: Update `schema.ts` and refactor deletion mutations to simple updates.

---

## 🛠 Medium Priority (Maintainability & robustness)

### 4. Standardize Project Authorization

**Current State**: Auth checks (`assertCanAccess...`) are manually called in every function.
**Risk**: Human error. It is easy to forget a check in a new mutation, leading to security vulnerabilities.
**Recommended Action**:

- Enforce the **`projectQuery`** / **`projectMutation`** wrapper pattern (found in `customFunctions.ts`) globally.
- These wrappers should handle auth checks automatically before executing the handler.
- **Action Item**: Refactor all project-scoped functions in `issues.ts` to use custom wrappers.

### 5. Robust Cascading Deletes

**Current State**: `deleteIssueRelatedRecords` manually deletes child records one-by-one in a loop.
**Risk**: Maintenance burden & "Dangling References". If a new table (e.g., `tags`) is added, developers might forget to update this function.
**Recommended Action**:

- Use **`convex-helpers`** or a strict "service layer" pattern where defining a relation automatically registers a deletion hook.
- For soft deletes, cascading is less critical immediately, but "restoring" an issue must also handle its children (or leave them deleted).

### 6. Optimize "Smart Board" Indexes

**Current State**: `listByProjectSmart` does excellent work filtering in-memory, but depends on `by_workspace_status_updated`.
**Optimization**: Ensure your compound indexes fully cover the query predicates to avoid scanning unnecessary rows.

- **Action Item**: Review `schema.ts` indexes against the `doneColumnDays` filter in `issues.ts` to ensure the database engine can skip old "Done" items entirely without reading them.

---

## 🔍 Future / Low Priority

### 7. Offline Sync Queue Robustness

**Current State**: `offlineSyncQueue` table exists.
**Recommendation**: Ensure there is a dedicated cron job or processing trigger that actively retries `status: "failed"` items effectively, with exponential backoff, to prevent the queue from growing indefinitely.

### 8. Type-Safe "Exclude" for Sensitive Fields

**Current State**: User objects are often returned mostly whole.
**Recommendation**: Ensure sensitive fields (like `email` in public contexts) are explicitly stripped. Convex 1.0+ supports defining return types (validators) for queries, which enforces this at the framework level.

---

## Summary of Next Steps

1. **Immediately**: Integrate `@convex-dev/rate-limiter` to fix the rate limit performance risk.
2. **Next Sprint**: Refactor `listRoadmapIssues` to support pagination.
3. **Architecture Task**: Plan the migration to `soft-deletes` (requires schema change & data migration script).
