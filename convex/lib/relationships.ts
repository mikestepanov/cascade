/**
 * Relationship Registry & Cascading Delete System
 *
 * Central registry of all parent-child relationships in the database.
 * Automatically handles cascading deletes/soft-deletes so you never forget.
 *
 * Usage:
 *   await cascadeDelete(ctx, "issues", issueId);
 *   await cascadeSoftDelete(ctx, "issues", issueId, userId, now);
 */

import type { Id, TableNames } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Relationship definition between parent and child tables
 */
export type Relationship = {
  parent: TableNames; // Parent table name (e.g., "issues")
  child: TableNames; // Child table name (e.g., "issueComments")
  foreignKey: string; // Field in child pointing to parent (e.g., "issueId")
  index: string; // Index name for fast lookup (e.g., "by_issue")
  onDelete: "cascade" | "set_null" | "restrict";
};

/**
 * Master registry of all database relationships
 * Add new relationships here when creating related tables
 */
export const RELATIONSHIPS: Relationship[] = [
  // ============================================================================
  // ISSUE RELATIONSHIPS
  // ============================================================================

  {
    parent: "issues",
    child: "issueComments",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete comments when issue deleted
  },
  {
    parent: "issues",
    child: "issueActivity",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete activity log when issue deleted
  },
  {
    parent: "issues",
    child: "issueLinks",
    foreignKey: "fromIssueId",
    index: "by_from_issue",
    onDelete: "cascade", // Delete outgoing links when issue deleted
  },
  {
    parent: "issues",
    child: "issueLinks",
    foreignKey: "toIssueId",
    index: "by_to_issue",
    onDelete: "cascade", // Delete incoming links when issue deleted
  },
  {
    parent: "issues",
    child: "issueWatchers",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete watchers when issue deleted
  },
  {
    parent: "issues",
    child: "timeEntries",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete time entries when issue deleted
  },

  // ============================================================================
  // PROJECT RELATIONSHIPS
  // ============================================================================

  {
    parent: "projects",
    child: "issues",
    foreignKey: "projectId",
    index: "by_workspace",
    onDelete: "cascade", // Delete all issues when project deleted
  },
  {
    parent: "projects",
    child: "sprints",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete all sprints when project deleted
  },
  {
    parent: "projects",
    child: "projectMembers",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete memberships when project deleted
  },
  {
    parent: "projects",
    child: "labels",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete labels when project deleted
  },

  // ============================================================================
  // SPRINT RELATIONSHIPS
  // ============================================================================

  {
    parent: "sprints",
    child: "issues",
    foreignKey: "sprintId",
    index: "by_sprint",
    onDelete: "set_null", // Move issues to backlog when sprint deleted
  },

  // ============================================================================
  // USER RELATIONSHIPS
  // ============================================================================

  {
    parent: "users",
    child: "notifications",
    foreignKey: "userId",
    index: "by_user",
    onDelete: "cascade", // Delete notifications when user deleted
  },
];

/**
 * Automatically cascade delete all related records
 * Handles multi-level cascading (parent → child → grandchild)
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to delete
 *
 * @example
 * await cascadeDelete(ctx, "issues", issueId);
 * // Deletes issue AND all comments, activities, links, watchers, time entries
 */
async function handleDeleteRelation(
  ctx: MutationCtx,
  rel: Relationship,
  recordId: Id<TableNames>
) {
  const children = await ctx.db
    .query(rel.child)
    .withIndex(rel.index, (q) => q.eq(rel.foreignKey, recordId))
    .collect();

  if (rel.onDelete === "cascade") {
    // Recursively delete children
    for (const child of children) {
      // Recursion needs a cast because TS can't prove child[rel.child] matches the recursion
      await cascadeDelete(ctx, rel.child, child._id as Id<TableNames>);
      await ctx.db.delete(child._id);
    }
  } else if (rel.onDelete === "set_null") {
    // Set foreign key to null instead of deleting
    for (const child of children) {
      await ctx.db.patch(child._id, {
        [rel.foreignKey]: undefined,
      } as Record<string, unknown>); // Dynamic field update still requires simple any or Record type
    }
  } else if (rel.onDelete === "restrict") {
    // Don't allow delete if children exist
    if (children.length > 0) {
      throw new Error(
        `Cannot delete ${rel.parent} ${recordId}: ${children.length} ` +
          `${rel.child} record(s) still reference it`,
      );
    }
  }
}

/**
 * Automatically cascade delete all related records
 * Handles multi-level cascading (parent → child → grandchild)
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to delete
 *
 * @example
 * await cascadeDelete(ctx, "issues", issueId);
 * // Deletes issue AND all comments, activities, links, watchers, time entries
 */
export async function cascadeDelete<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  recordId: Id<T>,
): Promise<void> {
  // Find all relationships where this table is the parent
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    await handleDeleteRelation(ctx, rel, recordId);
  }
}

/**
 * Soft delete version - cascades isDeleted flag to children
 * Used when implementing soft deletes
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to soft delete
 * @param deletedBy - User ID who performed the deletion
 * @param deletedAt - Timestamp of deletion
 *
 * @example
 * const now = Date.now();
 * await cascadeSoftDelete(ctx, "issues", issueId, userId, now);
 * // Marks issue AND all children as deleted
 */
async function handleSoftDeleteRelation(
  ctx: MutationCtx,
  rel: Relationship,
  recordId: Id<TableNames>,
  deletedBy: Id<"users">,
  deletedAt: number
) {
  if (rel.onDelete === "cascade") {
    const children = await ctx.db
      .query(rel.child)
      .withIndex(rel.index, (q) => q.eq(rel.foreignKey, recordId))
      .collect();

    for (const child of children) {
      // Recursively soft delete children
      await cascadeSoftDelete(
        ctx,
        rel.child,
        child._id as Id<TableNames>,
        deletedBy,
        deletedAt
      );

      // Mark this child as deleted
      await ctx.db.patch(child._id, {
        isDeleted: true,
        deletedAt,
        deletedBy,
      } as Record<string, unknown>); // Partial update of dynamic fields is easier with alias
    }
  }
}

/**
 * Soft delete version - cascades isDeleted flag to children
 * Used when implementing soft deletes
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to soft delete
 * @param deletedBy - User ID who performed the deletion
 * @param deletedAt - Timestamp of deletion
 *
 * @example
 * const now = Date.now();
 * await cascadeSoftDelete(ctx, "issues", issueId, userId, now);
 * // Marks issue AND all children as deleted
 */
export async function cascadeSoftDelete<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  recordId: Id<T>,
  deletedBy: Id<"users">,
  deletedAt: number,
): Promise<void> {
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    await handleSoftDeleteRelation(ctx, rel, recordId, deletedBy, deletedAt);
  }
}

async function handleRestoreRelation(
  ctx: MutationCtx,
  rel: Relationship,
  recordId: Id<TableNames>
) {
  if (rel.onDelete === "cascade") {
    // Find children (including soft-deleted ones)
    const children = await ctx.db
      .query(rel.child)
      .withIndex(rel.index, (q) => q.eq(rel.foreignKey, recordId))
      .collect();

    for (const child of children) {
      // Recursively restore children
      await cascadeRestore(ctx, rel.child, child._id as Id<TableNames>);

      // Remove deleted flags
      await ctx.db.patch(child._id, {
        isDeleted: undefined,
        deletedAt: undefined,
        deletedBy: undefined,
      } as Record<string, unknown>);
    }
  }
}

/**
 * Restore cascade - removes isDeleted flag from children
 * Used when restoring a soft-deleted record
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to restore
 *
 * @example
 * await cascadeRestore(ctx, "issues", issueId);
 * // Restores issue AND all children from soft delete
 */
export async function cascadeRestore<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  recordId: Id<T>,
): Promise<void> {
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    await handleRestoreRelation(ctx, rel, recordId);
  }
}
