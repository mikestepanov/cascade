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

### 1. ✅ Standardize Project Authorization (MOSTLY COMPLETE - 7/11 done)

**Status**: 🟡 **MOSTLY COMPLETE** - Single-issue mutations refactored, bulk operations remain

**What was done**:
- Created `issueViewerMutation` wrapper for viewer-level permissions
- Refactored 7 out of 11 mutations to use wrappers:
  - ✅ `updateStatus` - issueMutation
  - ✅ `updateStatusByCategory` - issueMutation
  - ✅ `addComment` - issueViewerMutation
  - ✅ `create` - editorMutation
  - ✅ `update` - issueMutation
  - ✅ `bulkUpdateStatus` - authenticatedMutation
  - ✅ `bulkUpdatePriority` - authenticatedMutation

**Benefits Achieved**:
- **Code reduction**: ~120 lines of boilerplate eliminated
- **Security**: Impossible to forget auth/permission checks
- **Consistency**: Standardized error messages across mutations
- **Type safety**: Better IntelliSense with typed context
- **Maintainability**: Single source of truth for auth logic

**Remaining Work** (4 bulk mutations):
- `bulkAssign`
- `bulkAddLabels`
- `bulkMoveToSprint`
- `bulkDelete`

**Note**: These follow the same pattern as `bulkUpdateStatus` and `bulkUpdatePriority`.
Easy to complete when needed (10-15 mins). Recommend completing during next sprint.

### 2. Robust Cascading Deletes

**Current State**: `deleteIssueRelatedRecords` manually deletes child records one-by-one in a loop.
**Risk**: Maintenance burden & "Dangling References". If a new table (e.g., `tags`) is added, developers might forget to update this function.
**Recommended Action**:

- Use **`convex-helpers`** or a strict "service layer" pattern where defining a relation automatically registers a deletion hook.
- For soft deletes, cascading is less critical immediately, but "restoring" an issue must also handle its children (or leave them deleted).

---

## 🔍 Future / Low Priority

### 1. Offline Sync Queue Robustness

**Current State**: `offlineSyncQueue` table exists.
**Recommendation**: Ensure there is a dedicated cron job or processing trigger that actively retries `status: "failed"` items effectively, with exponential backoff, to prevent the queue from growing indefinitely.
