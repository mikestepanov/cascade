# Convex Architectural Review & TODOs

This document outlines architectural improvements, risks, and recommended actions for the Convex backend, based on a comprehensive codebase review and analysis of Convex best practices.

## 📊 Progress Summary

**Critical Priority**: 2/3 completed ✅
- ✅ Efficient Rate Limiting (completed)
- ✅ Scalable Roadmap Pagination (completed)
- ⚠️ Soft Deletes (requires planning - large architectural change)

**Medium Priority**: 0/3 completed
**Low Priority**: 0/2 completed

---

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

### 2. ✅ Scalable Roadmap Query (Pagination) (COMPLETED)

**Status**: ✅ **COMPLETED** - Added paginated version of roadmap query

**What was done**:
- Created `listRoadmapIssuesPaginated` query with cursor-based pagination
- Kept original `listRoadmapIssues` for backward compatibility
- Uses `paginationOptsValidator` for proper pagination options
- Returns `{ page, isDone, continueCursor }` format
- Supports both sprint-specific and backlog roadmap pagination

**Benefits**:
- **Scalability**: Can handle projects with thousands of issues
- **Performance**: Loads data in chunks instead of all at once
- **UX**: Enables "Load More" or infinite scroll patterns
- **Backward Compatible**: Existing code continues to work

**Files modified**:
- `convex/issues.ts` (added `listRoadmapIssuesPaginated`)

**Next Steps for Frontend**:
- Update roadmap views to use paginated version
- Implement "Load More" button or infinite scroll
- Add loading states for pagination

**Note**: Existing roadmap views still use non-paginated version.
Migration to paginated version should be done when implementing infinite scroll UI.

**Current State**: `listRoadmapIssues` in `issues.ts` fetches **all** root issues for a project/sprint without pagination.
**Risk**: Scalability cliff. A project with 2,000+ tickets will cause slow loads or function timeouts (`Limit exceeded`).
**Recommended Action**:

**Note**: Existing roadmap views still use non-paginated version.
Migration to paginated version should be done when implementing infinite scroll UI.

### 3. Safety: Transition to Soft Deletes

**Current State**: `bulkDelete` in `issues.ts` permanently removes issues and all related records (comments, etc.).
**Risk**: Data loss. No "Undo" functionality. Accidental deletion is catastrophic.

**Status**: ⚠️ **REQUIRES PLANNING** - Large architectural change

**Why This Needs Careful Planning**:
- **Schema Migration**: Need to add `isDeleted`, `deletedAt`, `deletedBy` to multiple tables
- **Query Updates**: ALL queries across the codebase need `.neq("isDeleted", true)` filters
- **Data Migration**: Existing records need default `isDeleted: false`
- **Cascading Logic**: Child records (comments, links) must be soft-deleted with parent
- **Restore Functionality**: Need mutations to restore deleted items and their children
- **Cron Jobs**: Setup scheduled deletion of items > 30 days old
- **UI Changes**: Admin interface to view/restore deleted items
- **Testing**: Comprehensive tests for delete/restore flows

**Recommended Action**:
- Create detailed implementation plan with phases
- Dedicate sprint/milestone for this feature
- Start with issues table, then expand to projects, documents
- Add feature flag to test in production safely

**Tables Requiring Soft Deletes**:
1. `issues` (highest priority)
2. `projects`
3. `documents`
4. `sprints`
5. `issueComments`
6. `projectMembers`

**Implementation Phases**:
- **Phase 1**: Schema updates + migrations
- **Phase 2**: Update all read queries to filter deleted
- **Phase 3**: Update delete mutations to soft delete
- **Phase 4**: Add restore mutations
- **Phase 5**: Implement cron job for permanent deletion
- **Phase 6**: UI for viewing/restoring deleted items

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
