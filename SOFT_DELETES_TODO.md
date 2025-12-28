# Soft Deletes Implementation Analysis

## ⚡ TL;DR

**What**: Replace permanent deletion with recoverable "soft delete" using `isDeleted` flag  
**Why**: Accidental deletes lose data FOREVER - no undo, no recovery, catastrophic  
**Scope**: 120+ queries across 6 tables need filtering  
**Time**: 2-3 days full implementation  
**Status**: Fully analyzed, ready to implement with detailed plan below

---

## 🎯 What We're Doing (Step-by-Step)

### Current State (Broken):
```typescript
// User clicks delete → data GONE forever
await ctx.db.delete(issueId);  // ❌ Permanent, no recovery

// Scenario: User accidentally bulk deletes entire sprint
// Result: All issues, comments, attachments LOST permanently
// Fix: Impossible - data is gone
```

### New State (Safe):
```typescript
// User clicks delete → data marked as deleted (recoverable)
await ctx.db.patch(issueId, {
  isDeleted: true,           // ✅ Hidden from view
  deletedAt: Date.now(),     // ✅ Track when
  deletedBy: userId,         // ✅ Track who
});

// 30 days later: Auto-cleanup removes it permanently
// During 30 days: Admin can restore from trash
```

---

## 📋 Implementation Checklist (What Gets Changed)

### Phase 1: Schema Changes (2 hours)
**Add to 6 tables:**
- `issues` (highest priority)
- `projects`
- `documents`
- `sprints`
- `issueComments`
- `projectMembers`

**New fields:**
```typescript
isDeleted: v.optional(v.boolean()),      // Default: undefined = false
deletedAt: v.optional(v.number()),       // Timestamp when deleted
deletedBy: v.optional(v.id("users")),    // Who deleted it
```

**New indexes:**
```typescript
.index("by_deleted", ["isDeleted"])
.index("by_project_deleted", ["projectId", "isDeleted"])
```

### Phase 2: Query Updates (1 day)
**Update ALL queries** (120+ locations) to filter out deleted items:

**Before:**
```typescript
const issues = await ctx.db
  .query("issues")
  .withIndex("by_project", (q) => q.eq("projectId", projectId))
  .collect();
// ❌ Shows deleted issues!
```

**After:**
```typescript
const issues = await ctx.db
  .query("issues")
  .withIndex("by_project", (q) => q.eq("projectId", projectId))
  .filter((q) => q.neq(q.field("isDeleted"), true))  // ✅ Hide deleted
  .collect();
```

**Files to update:**
- `convex/issues.ts` - 51 queries
- `convex/projects.ts` - ~30 queries
- `convex/documents.ts` - ~15 queries
- `convex/sprints.ts` - ~10 queries
- Other files - ~14 queries

### Phase 3: Delete Mutations (4 hours)
**Convert "delete" to "patch":**

**Before:**
```typescript
export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    await deleteRelatedRecords(ctx, issueId);  // Delete comments, links, etc.
    await ctx.db.delete(issueId);              // ❌ Gone forever
  }
});
```

**After:**
```typescript
export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Soft delete the issue
    await ctx.db.patch(issueId, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: ctx.userId,
    });
    
    // Cascade: soft delete all children (comments, links, etc.)
    await cascadeSoftDelete(ctx, "issues", issueId, now, ctx.userId);
  }
});
```

### Phase 4: Restore Functionality (3 hours)
**Add ability to undo deletions:**

```typescript
export const restore = mutation({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    // Restore the issue
    await ctx.db.patch(args.issueId, {
      isDeleted: undefined,    // Remove deleted flag
      deletedAt: undefined,
      deletedBy: undefined,
    });
    
    // Optionally restore children (comments, links)
    await restoreChildren(ctx, args.issueId);
  }
});

// Add "trash" view query
export const listDeleted = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .filter((q) => 
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("isDeleted"), true)  // Only show deleted
        )
      )
      .collect();
  }
});
```

### Phase 5: Auto-Cleanup Cron (1 hour)
**Permanent deletion after 30 days:**

```typescript
// convex/crons.ts
crons.daily(
  "permanent delete old items",
  { hourUTC: 2, minuteUTC: 0 },
  internal.cleanup.deleteOldSoftDeleted
);

// convex/cleanup.ts
export const deleteOldSoftDeleted = internalMutation({
  handler: async (ctx) => {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - THIRTY_DAYS;
    
    // Find items deleted more than 30 days ago
    const oldDeleted = await ctx.db
      .query("issues")
      .filter((q) => 
        q.and(
          q.eq(q.field("isDeleted"), true),
          q.lt(q.field("deletedAt"), cutoff)
        )
      )
      .collect();
    
    // NOW permanently delete them
    for (const issue of oldDeleted) {
      await hardDeleteIssue(ctx, issue._id);  // Original delete logic
    }
    
    return { deleted: oldDeleted.length };
  }
});
```

### Phase 6: UI Changes (4 hours)
**Add trash management interface:**

- Project settings → "Trash" tab
- List deleted issues with restore button
- "Empty Trash" button (permanent delete)
- Confirmation dialogs
- Show "Deleted by X on Y" info

### Phase 7: Testing (4 hours)
**Comprehensive test suite:**

```typescript
// Unit tests
- test("soft delete sets isDeleted flag")
- test("queries exclude deleted items")
- test("restore brings item back")
- test("cascade deletes children")

// Integration tests  
- test("delete issue → not in list → shows in trash → restore → back in list")
- test("delete project → all issues deleted → restore project → issues restored")
- test("permanent delete after 30 days")

// Manual testing
- Create/delete/restore flow
- Bulk operations
- UI trash view
- Cron job execution
```

---

## 🔢 Effort Breakdown

| Phase | Time | Complexity | Risk |
|-------|------|-----------|------|
| 1. Schema | 2 hours | Low | Low |
| 2. Queries | 8 hours | Medium | Medium |
| 3. Mutations | 4 hours | Medium | Low |
| 4. Restore | 3 hours | Medium | Low |
| 5. Cron | 1 hour | Low | Low |
| 6. UI | 4 hours | Medium | Low |
| 7. Testing | 4 hours | Medium | Medium |
| **Total** | **26 hours** | **~3 days** | **Medium** |

---

## 🚨 Why This Matters (Real Impact)

### Without Soft Deletes (Current):
❌ User accidentally deletes issue → **50+ comments GONE forever**  
❌ Admin fat-fingers project delete → **Entire team's work LOST**  
❌ Bulk delete wrong sprint → **No way to undo**  
❌ "Where did issue X go?" → **Cannot investigate, no audit trail**  
❌ Regulatory compliance issues → **No data retention**

### With Soft Deletes (After):
✅ User deletes issue → **Can restore within 30 days**  
✅ Admin deletes project → **Recoverable from trash**  
✅ Wrong bulk delete → **"Undo" restores everything**  
✅ "Where did issue X go?" → **See: Deleted by John on Dec 27**  
✅ Compliance → **30-day retention window**

---

## 🎯 Success Metrics

**Before Implementation:**
- Data recovery: Impossible (0%)
- Accidental delete protection: None
- Audit trail: None
- User confidence: Low

**After Implementation:**
- Data recovery: 30-day window (100%)
- Accidental delete protection: Full
- Audit trail: Complete (who/when/what)
- User confidence: High

---

## 📦 Backward Compatibility

**Safe approach using optional fields:**
- `isDeleted: v.optional(v.boolean())` - existing records = `undefined` = `false`
- No migration needed for existing data
- Old queries still work (just need filter added)
- Can roll out incrementally per table

---

## Executive Summary

**Current State**: Hard deletes permanently remove data (issues, projects, documents)
**Goal**: Implement soft deletes for data recovery and audit trail
**Scope**: Large architectural change affecting 51+ query locations
**Timeline**: Multi-day project (2-3 days estimated)

---

## 🔴 Why This Is Critical

### Current Risks:
1. **Accidental Deletion**: No undo - data gone forever
2. **No Audit Trail**: Can't see what was deleted or when
3. **Cascade Issues**: Deleting parent deletes all children permanently
4. **Compliance**: Some regulations require data retention
5. **User Error**: Easy to click wrong button, lose work

### Real-World Scenarios:
- User accidentally deletes issue with 50+ comments → all gone
- Admin deletes project → all issues, sprints, documents lost
- Fat-finger bulk delete → entire sprint wiped out
- No way to investigate "where did this issue go?"

---

## 📊 Scope Analysis

### Tables Requiring Soft Deletes:

| Table | Query Count | Priority | Complexity |
|-------|-------------|----------|------------|
| `issues` | 51 | 🔴 Critical | High |
| `projects` | ~30 | 🔴 Critical | High |
| `documents` | ~15 | 🟡 Medium | Medium |
| `sprints` | ~10 | 🟡 Medium | Low |
| `issueComments` | ~8 | 🟢 Low | Low |
| `projectMembers` | ~5 | 🟢 Low | Low |

**Total estimated queries to update**: ~120+

---

## 🏗️ Implementation Plan

### Phase 1: Schema Updates (Day 1, Morning)

**Add to each table:**
```typescript
isDeleted: v.optional(v.boolean()), // Default: undefined (treated as false)
deletedAt: v.optional(v.number()),
deletedBy: v.optional(v.id("users")),
```

**Why `optional` instead of required?**
- Backward compatible with existing data
- `undefined` treated as `false` in queries
- No migration needed for existing records

**Add indexes:**
```typescript
.index("by_deleted", ["isDeleted"])
.index("by_workspace_deleted", ["projectId", "isDeleted"])
```

### Phase 2: Query Helper Utilities (Day 1, Afternoon)

Create `convex/lib/softDeleteHelpers.ts`:

```typescript
/**
 * Filter out soft-deleted items from query
 * Usage: query("issues").filter(notDeleted)
 */
export const notDeleted = (q) => q.neq(q.field("isDeleted"), true);

/**
 * Wrapper for queries that auto-filters deleted items
 */
export function activeQuery(ctx, table: string) {
  return ctx.db.query(table).filter(notDeleted);
}

/**
 * Get only deleted items (for trash view)
 */
export const onlyDeleted = (q) => q.eq(q.field("isDeleted"), true);
```

### Phase 3: Update Read Queries (Day 2, Full Day)

**Strategy**: Update queries in order of priority

**Pattern - Before:**
```typescript
const issues = await ctx.db
  .query("issues")
  .withIndex("by_project", (q) => q.eq("projectId", projectId))
  .collect();
```

**Pattern - After:**
```typescript
const issues = await ctx.db
  .query("issues")
  .withIndex("by_project", (q) => q.eq("projectId", projectId))
  .filter(notDeleted) // ← Add this line
  .collect();
```

**Files to update** (priority order):
1. `convex/issues.ts` - 51 queries
2. `convex/projects.ts` - ~30 queries
3. `convex/documents.ts` - ~15 queries
4. `convex/sprints.ts` - ~10 queries
5. `convex/issueComments.ts` - ~8 queries
6. Other files as needed

### Phase 4: Update Delete Mutations (Day 3, Morning)

**Convert hard deletes to soft deletes:**

**Before:**
```typescript
export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    await deleteIssueRelatedRecords(ctx, issueId);
    await ctx.db.delete(issueId); // ← Hard delete
  }
});
```

**After:**
```typescript
export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Soft delete the issue
    await ctx.db.patch(issueId, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: ctx.userId,
    });
    
    // Cascade soft delete to children
    await softDeleteIssueRelatedRecords(ctx, issueId, now, ctx.userId);
  }
});
```

**New cascading function:**
```typescript
async function softDeleteIssueRelatedRecords(
  ctx, 
  issueId, 
  deletedAt, 
  deletedBy
) {
  // Soft delete comments
  const comments = await ctx.db
    .query("issueComments")
    .withIndex("by_issue", (q) => q.eq("issueId", issueId))
    .collect();
    
  for (const comment of comments) {
    await ctx.db.patch(comment._id, {
      isDeleted: true,
      deletedAt,
      deletedBy,
    });
  }
  
  // Soft delete activities, links, watchers, time entries...
  // (Same pattern for all related records)
}
```

### Phase 5: Restore Functionality (Day 3, Afternoon)

**Add restore mutations:**

```typescript
export const restore = mutation({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const issue = await ctx.db.get(args.issueId);
    if (!issue || !issue.isDeleted) {
      throw new Error("Issue not found or not deleted");
    }
    
    // Check permissions
    await assertCanEditProject(ctx, issue.projectId, userId);
    
    // Restore the issue
    await ctx.db.patch(args.issueId, {
      isDeleted: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
    });
    
    // Optionally restore children
    await restoreIssueRelatedRecords(ctx, args.issueId);
  }
});
```

**Add "trash" queries:**

```typescript
export const listDeleted = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_workspace_deleted", (q) => 
        q.eq("projectId", args.projectId).eq("isDeleted", true)
      )
      .collect();
  }
});
```

### Phase 6: Permanent Deletion Cron (Day 3, Evening)

**Auto-delete after 30 days:**

```typescript
// convex/crons.ts
crons.daily(
  "permanent delete old items",
  { hourUTC: 2, minuteUTC: 0 },
  internal.cleanup.permanentlyDeleteOldItems
);

// convex/cleanup.ts
export const permanentlyDeleteOldItems = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const cutoff = now - THIRTY_DAYS;
    
    // Find old deleted issues
    const oldDeleted = await ctx.db
      .query("issues")
      .filter((q) => 
        q.and(
          q.eq(q.field("isDeleted"), true),
          q.lt(q.field("deletedAt"), cutoff)
        )
      )
      .collect();
    
    for (const issue of oldDeleted) {
      // Now permanently delete (hard delete)
      await deleteIssueRelatedRecords(ctx, issue._id);
      await ctx.db.delete(issue._id);
    }
    
    return { permanentlyDeleted: oldDeleted.length };
  }
});
```

### Phase 7: UI Changes (As Needed)

**Add to project settings:**
- "Trash" tab showing deleted issues
- Restore button for each deleted issue
- "Empty Trash" button (permanent delete)
- Filter to hide/show deleted items

---

## 🎯 Testing Strategy

### Unit Tests:
1. Test soft delete sets correct fields
2. Test queries exclude deleted items
3. Test restore brings back item
4. Test cascade delete affects children
5. Test cascade restore affects children

### Integration Tests:
1. Delete issue → verify not in list
2. Delete issue → verify shows in trash
3. Restore issue → verify back in list
4. Delete project → verify all issues deleted
5. Permanent delete → verify truly gone

### Manual Testing:
1. Create issue, delete, restore
2. Bulk delete, check all soft deleted
3. Wait for cron, verify permanent deletion
4. Check UI shows trash correctly

---

## 🚨 Risks & Mitigation

### Risk 1: Missing a Query
**Impact**: Deleted items show up where they shouldn't
**Mitigation**: 
- Use TypeScript search for `.query("issues")`
- Add integration tests
- Gradual rollout with feature flag

### Risk 2: Performance Impact
**Impact**: Extra filter on every query
**Mitigation**:
- `isDeleted` is optional, so undefined = false (no storage overhead)
- Index on `isDeleted` for trash queries
- Measure query times before/after

### Risk 3: Cascade Complexity
**Impact**: Complex restore logic, might miss children
**Mitigation**:
- Document all relationships
- Start simple (don't restore children initially)
- Add restore children as enhancement

### Risk 4: Breaking Changes
**Impact**: Existing code breaks during migration
**Mitigation**:
- Use optional fields (backward compatible)
- Update queries incrementally
- Keep hard delete as internal function

---

## 📋 Checklist

### Before Starting:
- [ ] Create feature branch: `feat/soft-deletes`
- [ ] Back up production data
- [ ] Announce planned changes to team
- [ ] Set up feature flag in config

### Phase 1 - Schema:
- [ ] Add fields to `issues` table
- [ ] Add fields to `projects` table
- [ ] Add fields to `documents` table
- [ ] Add fields to `sprints` table
- [ ] Add fields to `issueComments` table
- [ ] Add indexes for deleted queries
- [ ] Deploy schema changes

### Phase 2 - Helpers:
- [ ] Create `convex/lib/softDeleteHelpers.ts`
- [ ] Add `notDeleted` filter
- [ ] Add `onlyDeleted` filter
- [ ] Add `activeQuery` wrapper
- [ ] Write helper tests

### Phase 3 - Queries (Issues):
- [ ] Update `listByProject`
- [ ] Update `listByUser`
- [ ] Update `listRoadmapIssues`
- [ ] Update `listByProjectSmart`
- [ ] Update `get` (single issue)
- [ ] Update search queries
- [ ] Update all 51 issue queries
- [ ] Test all updated queries

### Phase 3 - Queries (Other Tables):
- [ ] Update projects queries (~30)
- [ ] Update documents queries (~15)
- [ ] Update sprints queries (~10)
- [ ] Update comments queries (~8)
- [ ] Test all updated queries

### Phase 4 - Mutations:
- [ ] Create `softDeleteIssueRelatedRecords`
- [ ] Update `bulkDelete` to soft delete
- [ ] Update project delete
- [ ] Update document delete
- [ ] Update sprint delete
- [ ] Test all delete mutations

### Phase 5 - Restore:
- [ ] Add `restore` mutation for issues
- [ ] Add `restoreIssueRelatedRecords`
- [ ] Add `listDeleted` query
- [ ] Add restore for projects
- [ ] Add restore for documents
- [ ] Test restore functionality

### Phase 6 - Cron:
- [ ] Create `convex/cleanup.ts`
- [ ] Add `permanentlyDeleteOldItems` mutation
- [ ] Add cron job to `crons.ts`
- [ ] Test cron job manually
- [ ] Verify permanent deletion

### Phase 7 - UI:
- [ ] Add "Trash" tab to project settings
- [ ] Show deleted items list
- [ ] Add restore button
- [ ] Add permanent delete button
- [ ] Add "show deleted" toggle
- [ ] Test UI flows

### Testing:
- [ ] Write unit tests for helpers
- [ ] Write unit tests for mutations
- [ ] Write integration tests
- [ ] Manual testing checklist
- [ ] Performance testing

### Deployment:
- [ ] Code review
- [ ] Test in staging environment
- [ ] Enable feature flag in production
- [ ] Monitor for issues
- [ ] Document changes in CHANGELOG

---

## 📈 Success Metrics

### Before:
- Issues permanently deleted: Immediate
- Data recovery: Impossible
- Audit trail: None

### After:
- Issues soft deleted: Instant (recoverable)
- Data recovery: 30 day window
- Audit trail: Full (who/when/what)
- Permanent deletion: Automated after 30 days

---

## 🎓 Lessons from Other Projects

### Common Pitfalls:
1. **Forgetting child records** - Always cascade
2. **Performance issues** - Use indexes on `isDeleted`
3. **UI confusion** - Make it clear item is deleted
4. **Restoring partially** - Document what gets restored

### Best Practices:
1. **Default to false** - Use `undefined` as false for storage efficiency
2. **Separate trash UI** - Don't mix with active items
3. **Auto-cleanup** - Don't let trash grow forever
4. **Admin override** - Let admins permanently delete immediately

---

## 📝 Alternative Approaches

### Approach 1: Archive Table (Rejected)
Move deleted items to separate `archived_issues` table
**Pros**: Clean separation
**Cons**: Complex queries, data duplication, harder restore

### Approach 2: Soft Delete (Chosen)
Add `isDeleted` flag to existing tables
**Pros**: Simple, easy restore, maintains relationships
**Cons**: Every query needs filter

### Approach 3: Event Sourcing (Overkill)
Store all changes as events, replay to get current state
**Pros**: Complete history
**Cons**: Way too complex for this use case

---

## 🚀 Quick Start (When Ready)

```bash
# 1. Create branch
git checkout -b feat/soft-deletes

# 2. Update schema
# Edit convex/schema.ts - add isDeleted/deletedAt/deletedBy fields

# 3. Create helpers
# Create convex/lib/softDeleteHelpers.ts

# 4. Start with issues.ts
# Add .filter(notDeleted) to all queries

# 5. Update delete mutations
# Change ctx.db.delete() to ctx.db.patch() with isDeleted: true

# 6. Add restore
# Create restore mutations

# 7. Add cron
# Auto-delete after 30 days

# 8. Test thoroughly
# Unit + integration + manual testing

# 9. Deploy carefully
# Feature flag, staging first, monitor closely
```

---

## 📞 Questions & Decisions

### Decision Points:
1. **Retention period**: 30 days? 90 days? Configurable?
   - Recommendation: 30 days default, admin configurable
   
2. **Restore children**: Automatic or manual?
   - Recommendation: Automatic for comments/activities, manual for sub-issues
   
3. **UI placement**: Separate trash page or inline?
   - Recommendation: Separate trash tab in project settings
   
4. **Admin permanent delete**: Allow immediate permanent delete?
   - Recommendation: Yes, for admins only, with confirmation

5. **Feature flag**: How to roll out?
   - Recommendation: Per-project feature flag, gradual rollout

---

## 📚 Additional Resources

- Convex Schema Documentation: https://docs.convex.dev/database/schemas
- Filtering Guide: https://docs.convex.dev/database/reading-data#filtering
- Cron Jobs: https://docs.convex.dev/scheduling/cron-jobs
- Indexes: https://docs.convex.dev/database/indexes

---

**Last Updated**: 2025-12-28
**Status**: Analysis Complete - Ready for Implementation
**Estimated Time**: 2-3 days (1 developer)
**Priority**: Critical (High Risk of Data Loss)
