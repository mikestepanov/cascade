# Robust Cascading Deletes Analysis

## ⚡ TL;DR

**What**: Replace manual cascade logic with automated relationship registry  
**Why**: Easy to forget updating cascade function when adding new tables → orphaned data  
**Scope**: Create centralized system that auto-handles all relationships  
**Time**: 1-2 hours  
**Status**: Fully analyzed, ready to implement (Approach 1 recommended)

---

## 🎯 What We're Doing (Step-by-Step)

### Current State (Broken):
```typescript
// Manual cascade function in issues.ts
async function deleteIssueRelatedRecords(ctx, issueId) {
  // Delete comments
  const comments = await ctx.db.query("issueComments")...
  for (const c of comments) await ctx.db.delete(c._id);
  
  // Delete activities
  const activities = await ctx.db.query("issueActivity")...
  for (const a of activities) await ctx.db.delete(a._id);
  
  // Delete links
  // Delete watchers
  // Delete time entries
  // ... 6 different related tables
}

// Problem: Add new table with relationship
export const issueAttachments = defineTable({
  issueId: v.id("issues"),
  fileUrl: v.string(),
});

// ❌ Developer forgets to update deleteIssueRelatedRecords
// Result: Orphaned attachments when issue deleted
// Bug: Attachments table grows indefinitely with dead references
```

### New State (Safe):
```typescript
// 1. Define relationship ONCE in registry
// convex/lib/relationships.ts
export const RELATIONSHIPS = [
  {
    parent: "issues",
    child: "issueComments",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",  // Delete children when parent deleted
  },
  {
    parent: "issues",
    child: "issueActivity",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",
  },
  // ... all 6 relationships defined here
];

// 2. Use automatic cascade everywhere
export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    await cascadeDelete(ctx, "issues", issueId);  // ✅ Automatic!
    await ctx.db.delete(issueId);
  }
});

// 3. Add new table? Just add to registry (takes 30 seconds)
{
  parent: "issues",
  child: "issueAttachments",
  foreignKey: "issueId",
  index: "by_issue",
  onDelete: "cascade",
}
// ✅ Cascade automatically works - impossible to forget!
```

---

## 📋 Implementation Checklist (What Gets Changed)

### Step 1: Create Relationship Registry (30 mins)

**Create `convex/lib/relationships.ts`:**

```typescript
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

// Define all relationships in one place
export type Relationship = {
  parent: string;      // Parent table name
  child: string;       // Child table name
  foreignKey: string;  // Field in child pointing to parent
  index: string;       // Index name for fast lookup
  onDelete: "cascade" | "set_null" | "restrict";
};

export const RELATIONSHIPS: Relationship[] = [
  // Issue relationships
  {
    parent: "issues",
    child: "issueComments",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",  // Delete comments when issue deleted
  },
  {
    parent: "issues",
    child: "issueActivity",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",  // Delete activity when issue deleted
  },
  {
    parent: "issues",
    child: "issueLinks",
    foreignKey: "fromIssueId",
    index: "by_from_issue",
    onDelete: "cascade",  // Delete outgoing links
  },
  {
    parent: "issues",
    child: "issueLinks",
    foreignKey: "toIssueId",
    index: "by_to_issue",
    onDelete: "cascade",  // Delete incoming links
  },
  {
    parent: "issues",
    child: "issueWatchers",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",
  },
  {
    parent: "issues",
    child: "timeEntries",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",
  },
  
  // Project relationships
  {
    parent: "projects",
    child: "issues",
    foreignKey: "projectId",
    index: "by_workspace",
    onDelete: "cascade",  // Delete all issues when project deleted
  },
  {
    parent: "projects",
    child: "sprints",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade",
  },
  {
    parent: "sprints",
    child: "issues",
    foreignKey: "sprintId",
    index: "by_sprint",
    onDelete: "set_null",  // Move issues to backlog when sprint deleted
  },
  
  // Add more relationships as needed...
];

/**
 * Automatically cascade delete all related records
 * Handles multi-level cascading (parent → child → grandchild)
 */
export async function cascadeDelete(
  ctx: MutationCtx,
  table: string,
  recordId: Id<any>
): Promise<void> {
  // Find all relationships where this table is parent
  const childRelationships = RELATIONSHIPS.filter(r => r.parent === table);
  
  for (const rel of childRelationships) {
    if (rel.onDelete === "cascade") {
      // Find all children
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => 
          q.eq(rel.foreignKey, recordId)
        )
        .collect();
      
      // Recursively delete children (handles grandchildren)
      for (const child of children) {
        await cascadeDelete(ctx, rel.child, child._id);
        await ctx.db.delete(child._id);
      }
    } 
    else if (rel.onDelete === "set_null") {
      // Set foreign key to null instead
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => 
          q.eq(rel.foreignKey, recordId)
        )
        .collect();
        
      for (const child of children) {
        await ctx.db.patch(child._id, {
          [rel.foreignKey]: undefined,
        } as any);
      }
    } 
    else if (rel.onDelete === "restrict") {
      // Don't allow delete if children exist
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => 
          q.eq(rel.foreignKey, recordId)
        )
        .collect();
        
      if (children.length > 0) {
        throw new Error(
          `Cannot delete ${table}: ${children.length} ${rel.child} still reference it`
        );
      }
    }
  }
}

/**
 * Soft delete version - cascades isDeleted flag to children
 */
export async function cascadeSoftDelete(
  ctx: MutationCtx,
  table: string,
  recordId: Id<any>,
  deletedBy: Id<"users">,
  deletedAt: number
): Promise<void> {
  const childRelationships = RELATIONSHIPS.filter(r => r.parent === table);
  
  for (const rel of childRelationships) {
    if (rel.onDelete === "cascade") {
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => 
          q.eq(rel.foreignKey, recordId)
        )
        .collect();
      
      for (const child of children) {
        // Recursively soft delete children
        await cascadeSoftDelete(ctx, rel.child, child._id, deletedBy, deletedAt);
        
        // Mark as deleted
        await ctx.db.patch(child._id, {
          isDeleted: true,
          deletedAt,
          deletedBy,
        } as any);
      }
    }
  }
}
```

### Step 2: Update Delete Functions (30 mins)

**Replace manual cascade with automatic:**

```typescript
// BEFORE - convex/issues.ts
async function deleteIssueRelatedRecords(ctx, issueId) {
  // 40 lines of manual deletion code
  const comments = await ctx.db.query("issueComments")...
  for (const c of comments) await ctx.db.delete(c._id);
  // ... repeat 6 times
}

export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    await deleteIssueRelatedRecords(ctx, issueId);  // Manual
    await ctx.db.delete(issueId);
  }
});

// AFTER
import { cascadeDelete } from "./lib/relationships";

export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    await cascadeDelete(ctx, "issues", issueId);  // Automatic!
    await ctx.db.delete(issueId);
  }
});

// Can delete deleteIssueRelatedRecords function entirely!
```

### Step 3: Test & Document (15 mins)

**Write tests:**
```typescript
test("cascadeDelete handles multi-level cascading", async () => {
  // Create: Project → Issue → Comment
  const projectId = await createProject();
  const issueId = await createIssue(projectId);
  const commentId = await createComment(issueId);
  
  // Delete project
  await cascadeDelete(ctx, "projects", projectId);
  
  // Verify all deleted
  expect(await ctx.db.get(projectId)).toBeNull();
  expect(await ctx.db.get(issueId)).toBeNull();      // ✅ Cascaded
  expect(await ctx.db.get(commentId)).toBeNull();    // ✅ Multi-level!
});
```

**Update documentation:**
```typescript
// CLAUDE.md - Add section:
## Cascading Deletes

When deleting records, use `cascadeDelete()` from `convex/lib/relationships.ts`:

```typescript
import { cascadeDelete } from "./lib/relationships";

// Automatically deletes all related records
await cascadeDelete(ctx, "issues", issueId);
await ctx.db.delete(issueId);
```

To add new relationship:
1. Add to RELATIONSHIPS array in relationships.ts
2. Choose strategy: "cascade", "set_null", or "restrict"
3. That's it! Automatic everywhere.
```

---

## 🔢 Effort Breakdown

| Step | Time | Complexity | Lines of Code |
|------|------|-----------|---------------|
| 1. Create registry | 30 mins | Low | ~150 lines |
| 2. Update deletes | 30 mins | Low | -40 lines |
| 3. Test & docs | 15 mins | Low | +50 lines |
| **Total** | **75 mins** | **Low** | **Net: +160 lines** |

---

## 🚨 Why This Matters (Real Impact)

### Without Registry (Current):
❌ Add `issueAttachments` table → **Forget to update cascade → orphaned data**  
❌ 6 separate delete loops → **Hard to maintain**  
❌ Add relationship in 3 places (issues, projects, sprints) → **Repetitive**  
❌ No audit of relationships → **Can't see what cascades**  
❌ Manually track multi-level → **Easy to miss grandchildren**

### With Registry (After):
✅ Add table → **Add 5-line entry → done**  
✅ Single implementation → **Easy to maintain**  
✅ Works everywhere automatically → **DRY principle**  
✅ Clear audit trail → **See all relationships in one file**  
✅ Multi-level cascading automatic → **No grandchildren orphaned**

---

## 🎯 Relationship Strategies

### 1. CASCADE (Most Common)
**Use when**: Child has no meaning without parent
```typescript
{ parent: "issues", child: "issueComments", onDelete: "cascade" }
// Delete issue → delete all comments (comments are meaningless without issue)
```

### 2. SET_NULL (Decouple)
**Use when**: Child can exist independently
```typescript
{ parent: "sprints", child: "issues", onDelete: "set_null" }
// Delete sprint → move issues to backlog (issues still valid)
```

### 3. RESTRICT (Safety)
**Use when**: Prevent accidental deletion
```typescript
{ parent: "projects", child: "issues", onDelete: "restrict" }
// Can't delete project if issues exist (force user to handle first)
```

---

## 📦 Example: Adding New Relationship

**Scenario**: Add attachments feature

```typescript
// 1. Define table in schema.ts
issueAttachments: defineTable({
  issueId: v.id("issues"),
  fileUrl: v.string(),
  uploadedBy: v.id("users"),
})
  .index("by_issue", ["issueId"])
  .index("by_user", ["uploadedBy"])

// 2. Add to registry (relationships.ts) - 30 seconds!
{
  parent: "issues",
  child: "issueAttachments",
  foreignKey: "issueId",
  index: "by_issue",
  onDelete: "cascade",  // Delete attachments when issue deleted
}

// 3. Done! No other changes needed
// cascadeDelete() automatically handles it everywhere
```

**Old way would require:**
- Update `deleteIssueRelatedRecords` (easy to forget)
- Update `deleteProjectRelatedRecords`
- Update soft delete versions
- Test all 3 places
- Risk: Forget one = orphaned data

---

## 🎯 Success Metrics

**Before Implementation:**
- Time to add relationship: 30 mins (update 3 functions)
- Risk of forgetting: High
- Maintenance burden: High
- Code duplication: 3x

**After Implementation:**
- Time to add relationship: 30 seconds (one entry)
- Risk of forgetting: Zero (enforced)
- Maintenance burden: Low
- Code duplication: 0x (DRY)

---

## Executive Summary

**Current State**: Manual cascade logic in `deleteIssueRelatedRecords` function
**Problem**: Easy to forget updating when adding new related tables
**Goal**: Automate cascade deletes so they're impossible to forget
**Timeline**: 1-2 hours for basic implementation

---

## 🔴 Current Problems

### The Manual Cascade Function:

```typescript
async function deleteIssueRelatedRecords(ctx, issueId) {
  // Delete comments
  const comments = await ctx.db.query("issueComments")...
  for (const comment of comments) await ctx.db.delete(comment._id);
  
  // Delete activities
  const activities = await ctx.db.query("issueActivity")...
  for (const activity of activities) await ctx.db.delete(activity._id);
  
  // Delete links
  // Delete watchers
  // Delete time entries
  // ... 6 different related tables
}
```

### Issues:
1. **Maintenance Burden**: Must update function when adding new relationships
2. **Easy to Forget**: Developer adds `issueAttachments` table, forgets to update this
3. **Dangling References**: Orphaned records in database
4. **No Centralization**: Same pattern repeated for projects, documents, etc.
5. **Hard to Audit**: Can't easily see what gets deleted

---

## 🏗️ Solution Approaches

### Approach 1: Relationship Registry (Recommended)

**Concept**: Register all relationships in one place, auto-cascade from there

```typescript
// convex/lib/relationships.ts

type Relationship = {
  parent: string;  // Table name
  child: string;   // Table name
  foreignKey: string; // Field name in child
  index: string;   // Index name for efficient lookup
  onDelete: "cascade" | "set_null" | "restrict";
};

export const RELATIONSHIPS: Relationship[] = [
  // Issue relationships
  {
    parent: "issues",
    child: "issueComments",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",
  },
  {
    parent: "issues",
    child: "issueActivity",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",
  },
  {
    parent: "issues",
    child: "issueLinks",
    foreignKey: "fromIssueId",
    index: "by_from_issue",
    onDelete: "cascade",
  },
  {
    parent: "issues",
    child: "issueLinks",
    foreignKey: "toIssueId",
    index: "by_to_issue",
    onDelete: "cascade",
  },
  {
    parent: "issues",
    child: "issueWatchers",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",
  },
  {
    parent: "issues",
    child: "timeEntries",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade",
  },
  
  // Project relationships
  {
    parent: "projects",
    child: "issues",
    foreignKey: "projectId",
    index: "by_workspace",
    onDelete: "cascade",
  },
  {
    parent: "projects",
    child: "sprints",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade",
  },
  // ... more relationships
];

/**
 * Automatically cascade delete all related records
 */
export async function cascadeDelete(
  ctx: MutationCtx,
  table: string,
  recordId: Id<any>
) {
  // Find all relationships where this table is the parent
  const childRelationships = RELATIONSHIPS.filter(r => r.parent === table);
  
  for (const rel of childRelationships) {
    if (rel.onDelete === "cascade") {
      // Find all child records
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => 
          q.eq(rel.foreignKey, recordId)
        )
        .collect();
      
      // Recursively delete children (handles multi-level cascading)
      for (const child of children) {
        await cascadeDelete(ctx, rel.child, child._id);
        await ctx.db.delete(child._id);
      }
    } else if (rel.onDelete === "set_null") {
      // Set foreign key to null instead of deleting
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => 
          q.eq(rel.foreignKey, recordId)
        )
        .collect();
        
      for (const child of children) {
        await ctx.db.patch(child._id, {
          [rel.foreignKey]: undefined,
        } as any);
      }
    } else if (rel.onDelete === "restrict") {
      // Don't allow delete if children exist
      const childCount = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => 
          q.eq(rel.foreignKey, recordId)
        )
        .collect();
        
      if (childCount.length > 0) {
        throw new Error(
          `Cannot delete ${table} ${recordId}: ${childCount.length} ` +
          `${rel.child} records still reference it`
        );
      }
    }
  }
}

/**
 * Soft delete version - cascades isDeleted flag
 */
export async function cascadeSoftDelete(
  ctx: MutationCtx,
  table: string,
  recordId: Id<any>,
  deletedBy: Id<"users">,
  deletedAt: number
) {
  const childRelationships = RELATIONSHIPS.filter(r => r.parent === table);
  
  for (const rel of childRelationships) {
    if (rel.onDelete === "cascade") {
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => 
          q.eq(rel.foreignKey, recordId)
        )
        .collect();
      
      for (const child of children) {
        // Recursively soft delete children
        await cascadeSoftDelete(ctx, rel.child, child._id, deletedBy, deletedAt);
        
        // Mark this child as deleted
        await ctx.db.patch(child._id, {
          isDeleted: true,
          deletedAt,
          deletedBy,
        } as any);
      }
    }
  }
}
```

**Usage in delete mutations:**

```typescript
// BEFORE - Manual cascade
export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    await deleteIssueRelatedRecords(ctx, issueId); // Manual
    await ctx.db.delete(issueId);
  }
});

// AFTER - Automatic cascade
export const bulkDelete = mutation({
  handler: async (ctx, args) => {
    await cascadeDelete(ctx, "issues", issueId); // Automatic!
    await ctx.db.delete(issueId);
  }
});
```

**Benefits:**
- ✅ Single source of truth for relationships
- ✅ Impossible to forget - just call cascadeDelete()
- ✅ Easy to add new relationships - just add to array
- ✅ Handles multi-level cascading (parent → child → grandchild)
- ✅ Different strategies (cascade, set_null, restrict)
- ✅ Works for both hard and soft deletes

---

### Approach 2: Schema-Based (Using convex-helpers)

**Concept**: Define relationships in schema, use helper library

```typescript
// convex/schema.ts
import { defineRelationships } from "convex-helpers/server/relationships";

export const relationships = defineRelationships({
  issues: {
    comments: { table: "issueComments", field: "issueId" },
    activities: { table: "issueActivity", field: "issueId" },
    watchers: { table: "issueWatchers", field: "issueId" },
  },
  projects: {
    issues: { table: "issues", field: "projectId" },
    sprints: { table: "sprints", field: "projectId" },
  },
});
```

**Pros:**
- Uses existing library
- Schema colocated with relationships

**Cons:**
- Requires external dependency
- Less flexible than custom solution
- May not support all Convex features

---

### Approach 3: Type-Safe Relationships (Advanced)

**Concept**: Use TypeScript to enforce relationship definitions

```typescript
// convex/lib/typedRelationships.ts

type Table = keyof typeof schema;

type RelationshipDef<
  Parent extends Table,
  Child extends Table,
  FK extends keyof Doc<Child>
> = {
  parent: Parent;
  child: Child;
  foreignKey: FK;
  index: string;
  onDelete: "cascade" | "set_null" | "restrict";
};

// Type-safe relationship definition
const issueComments: RelationshipDef<"issues", "issueComments", "issueId"> = {
  parent: "issues",
  child: "issueComments",
  foreignKey: "issueId",
  index: "by_issue",
  onDelete: "cascade",
};

// TypeScript will error if:
// - Table doesn't exist
// - Field doesn't exist on child table
// - Field type doesn't match parent ID type
```

**Pros:**
- Compile-time safety
- Impossible to define invalid relationship
- Great IDE support

**Cons:**
- More complex TypeScript
- Harder to maintain
- Overkill for this project

---

## 📋 Implementation Plan (Approach 1 - Recommended)

### Step 1: Create Relationship Registry (30 mins)

Create `convex/lib/relationships.ts`:
- Define RELATIONSHIPS array
- Implement cascadeDelete()
- Implement cascadeSoftDelete()
- Add tests

### Step 2: Update Delete Functions (30 mins)

Replace manual cascade with automatic:
- Update `bulkDelete` in issues.ts
- Update project delete
- Update document delete
- Test all delete operations

### Step 3: Documentation (15 mins)

- Add comments explaining system
- Document how to add new relationships
- Create examples

### Step 4: Testing (15 mins)

- Test single-level cascade
- Test multi-level cascade
- Test different strategies (cascade, set_null, restrict)
- Test soft delete cascade

**Total time**: ~90 minutes

---

## 🎯 Benefits Summary

### Before:
```typescript
// Add new table with relationship
export const issueAttachments = defineTable({ issueId: v.id("issues") });

// MUST REMEMBER to update deleteIssueRelatedRecords:
async function deleteIssueRelatedRecords(ctx, issueId) {
  // Delete comments
  // Delete activities
  // ... 
  // Oops! Forgot to add attachments! 🐛
}
```

### After:
```typescript
// Add new table with relationship
export const issueAttachments = defineTable({ issueId: v.id("issues") });

// Add to relationship registry (ENFORCED by code review)
{
  parent: "issues",
  child: "issueAttachments",
  foreignKey: "issueId",
  index: "by_issue",
  onDelete: "cascade",
}

// Delete functions work automatically! ✅
await cascadeDelete(ctx, "issues", issueId);
```

---

## 🔧 Migration Path

### Phase 1: Create Infrastructure
1. Create relationships.ts
2. Define all existing relationships
3. Write tests

### Phase 2: Parallel Run
1. Keep existing deleteIssueRelatedRecords
2. Add cascadeDelete call
3. Compare results (should be identical)
4. Log any differences

### Phase 3: Switch Over
1. Remove old manual cascade function
2. Use cascadeDelete everywhere
3. Update documentation

### Phase 4: Expand
1. Add cascade for projects
2. Add cascade for documents
3. Add relationship validation

---

## 📊 Relationship Audit

### Current Issue Relationships:
- issueComments (many) → CASCADE
- issueActivity (many) → CASCADE
- issueLinks (many, bidirectional) → CASCADE
- issueWatchers (many) → CASCADE
- timeEntries (many) → CASCADE
- notifications (many) → CASCADE or SET_NULL?

### Current Project Relationships:
- issues (many) → CASCADE
- sprints (many) → CASCADE
- projectMembers (many) → CASCADE
- documents (many) → SET_NULL?
- webhooks (many) → CASCADE

### Current Sprint Relationships:
- issues.sprintId → SET_NULL (move to backlog)

---

## 🚨 Edge Cases

### 1. Bidirectional Relationships
**Example**: issueLinks (from/to)
**Solution**: Define both directions in registry

### 2. Circular References
**Example**: Issue → Parent Issue → Child Issue
**Solution**: Track visited IDs to prevent infinite loops

### 3. Soft Delete + Hard Delete
**Example**: Soft deleted issue, then permanent delete
**Solution**: Two functions - cascadeSoftDelete and cascadeDelete

### 4. Partial Failures
**Example**: Cascade fails halfway through
**Solution**: Convex transactions handle this automatically

---

## 📈 Success Metrics

### Maintainability:
- Time to add new relationship: 5 minutes (add to registry)
- Code review: Easy to spot missing relationships
- Bugs: Zero dangling references

### Performance:
- Same performance as manual (same queries)
- Possible optimization: Batch deletes

### Developer Experience:
- New developer onboarding: Clear system to follow
- Less cognitive load: Don't have to remember

---

## 🎓 Example: Adding New Relationship

```typescript
// 1. Create new table in schema.ts
issueAttachments: defineTable({
  issueId: v.id("issues"),
  fileId: v.id("_storage"),
  fileName: v.string(),
  uploadedBy: v.id("users"),
})
  .index("by_issue", ["issueId"])
  .index("by_user", ["uploadedBy"])

// 2. Add to relationship registry (relationships.ts)
{
  parent: "issues",
  child: "issueAttachments",
  foreignKey: "issueId",
  index: "by_issue",
  onDelete: "cascade", // Delete attachments when issue is deleted
}

// 3. That's it! Cascade happens automatically
// When issue is deleted, attachments are automatically cleaned up
```

**Old way would require:**
- Update deleteIssueRelatedRecords
- Update softDeleteIssueRelatedRecords
- Update tests
- Easy to forget!

---

## 📝 Checklist

### Implementation:
- [ ] Create convex/lib/relationships.ts
- [ ] Define RELATIONSHIPS array
- [ ] Implement cascadeDelete()
- [ ] Implement cascadeSoftDelete()
- [ ] Implement cascadeRestore()
- [ ] Add comprehensive tests
- [ ] Document usage

### Migration:
- [ ] Audit all current relationships
- [ ] Add all to registry
- [ ] Test cascade for issues
- [ ] Test cascade for projects
- [ ] Test cascade for documents
- [ ] Remove old manual functions
- [ ] Update CLAUDE.md with new pattern

### Future Enhancements:
- [ ] Add relationship validation on schema change
- [ ] Add CLI tool to show relationship tree
- [ ] Add performance monitoring
- [ ] Add batch delete optimization

---

## 🚀 Quick Start

```typescript
// 1. Install (just create file, no dependencies)
// Create convex/lib/relationships.ts

// 2. Define relationships
export const RELATIONSHIPS = [
  { parent: "issues", child: "issueComments", ... },
];

// 3. Use in mutations
import { cascadeDelete } from "./lib/relationships";

export const deleteIssue = mutation({
  handler: async (ctx, args) => {
    await cascadeDelete(ctx, "issues", args.issueId);
    await ctx.db.delete(args.issueId);
  }
});

// Done! Relationships automatically enforced
```

---

**Last Updated**: 2025-12-28
**Status**: Analysis Complete - Ready for Implementation
**Estimated Time**: 1-2 hours
**Priority**: Medium (Maintenance & Developer Experience)
**Dependencies**: None (works with or without soft deletes)
