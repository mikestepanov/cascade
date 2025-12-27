# Convex Architectural Review & TODOs

This document outlines remaining architectural improvements for the Convex backend.

## 🚨 Critical Priority (Performance & Scalability)

### Safety: Transition to Soft Deletes

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

## 🛠 Medium Priority (Maintainability & Robustness)

### 1. Standardize Project Authorization

**Current State**: Auth checks (`assertCanAccess...`) are manually called in every function.
**Risk**: Human error. It is easy to forget a check in a new mutation, leading to security vulnerabilities.
**Recommended Action**:

- Enforce the **`projectQuery`** / **`projectMutation`** wrapper pattern (found in `customFunctions.ts`) globally.
- These wrappers should handle auth checks automatically before executing the handler.
- **Action Item**: Refactor all project-scoped functions in `issues.ts` to use custom wrappers.

### 2. Robust Cascading Deletes

**Current State**: `deleteIssueRelatedRecords` manually deletes child records one-by-one in a loop.
**Risk**: Maintenance burden & "Dangling References". If a new table (e.g., `tags`) is added, developers might forget to update this function.
**Recommended Action**:

- Use **`convex-helpers`** or a strict "service layer" pattern where defining a relation automatically registers a deletion hook.
- For soft deletes, cascading is less critical immediately, but "restoring" an issue must also handle its children (or leave them deleted).

### 3. Optimize "Smart Board" Indexes

**Current State**: `listByProjectSmart` does excellent work filtering in-memory, but depends on `by_workspace_status_updated`.
**Optimization**: Ensure your compound indexes fully cover the query predicates to avoid scanning unnecessary rows.

- **Action Item**: Review `schema.ts` indexes against the `doneColumnDays` filter in `issues.ts` to ensure the database engine can skip old "Done" items entirely without reading them.

---

## 🔍 Future / Low Priority

### 1. Offline Sync Queue Robustness

**Current State**: `offlineSyncQueue` table exists.
**Recommendation**: Ensure there is a dedicated cron job or processing trigger that actively retries `status: "failed"` items effectively, with exponential backoff, to prevent the queue from growing indefinitely.

### 2. Type-Safe "Exclude" for Sensitive Fields

**Current State**: User objects are often returned mostly whole.
**Recommendation**: Ensure sensitive fields (like `email` in public contexts) are explicitly stripped. Convex 1.0+ supports defining return types (validators) for queries, which enforces this at the framework level.

---

## 📝 Completed Tasks (Reference)

### ✅ Efficient Rate Limiting (Completed 2025-12-27)
- Migrated to `@convex-dev/rate-limiter` component with O(1) token bucket algorithm
- Created `convex/lib/rateLimiter.ts`
- Updated `convex/lib/apiAuth.ts`
- Added `rateLimits` table to schema

### ✅ Scalable Roadmap Pagination (Completed 2025-12-27)
- Added `listRoadmapIssuesPaginated` query with cursor-based pagination
- Backward compatible with existing `listRoadmapIssues`
- Supports "Load More" / infinite scroll patterns
