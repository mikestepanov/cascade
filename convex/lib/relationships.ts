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

// biome-ignore lint/suspicious/noExplicitAny: Dynamic table access requires any types for type safety with runtime table names
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Relationship definition between parent and child tables
 */
export type Relationship = {
  parent: string; // Parent table name (e.g., "issues")
  child: string; // Child table name (e.g., "issueComments")
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
export async function cascadeDelete(
  ctx: MutationCtx,
  table: string,
  recordId: Id<any>,
): Promise<void> {
  // Find all relationships where this table is the parent
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    if (rel.onDelete === "cascade") {
      // Find all child records
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => q.eq(rel.foreignKey, recordId))
        .collect();

      // Recursively delete children (handles grandchildren, great-grandchildren, etc.)
      for (const child of children) {
        await cascadeDelete(ctx, rel.child, child._id);
        await ctx.db.delete(child._id);
      }
    } else if (rel.onDelete === "set_null") {
      // Set foreign key to null instead of deleting
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => q.eq(rel.foreignKey, recordId))
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          [rel.foreignKey]: undefined,
        } as any);
      }
    } else if (rel.onDelete === "restrict") {
      // Don't allow delete if children exist
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => q.eq(rel.foreignKey, recordId))
        .collect();

      if (children.length > 0) {
        throw new Error(
          `Cannot delete ${table} ${recordId}: ${children.length} ` +
            `${rel.child} record(s) still reference it`,
        );
      }
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
export async function cascadeSoftDelete(
  ctx: MutationCtx,
  table: string,
  recordId: Id<any>,
  deletedBy: Id<"users">,
  deletedAt: number,
): Promise<void> {
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    if (rel.onDelete === "cascade") {
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => q.eq(rel.foreignKey, recordId))
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
    // Note: set_null and restrict not applicable for soft deletes
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
export async function cascadeRestore(
  ctx: MutationCtx,
  table: string,
  recordId: Id<any>,
): Promise<void> {
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    if (rel.onDelete === "cascade") {
      // Find children (including soft-deleted ones)
      const children = await ctx.db
        .query(rel.child as any)
        .withIndex(rel.index as any, (q: any) => q.eq(rel.foreignKey, recordId))
        .collect();

      for (const child of children) {
        // Recursively restore children
        await cascadeRestore(ctx, rel.child, child._id);

        // Remove deleted flags
        await ctx.db.patch(child._id, {
          isDeleted: undefined,
          deletedAt: undefined,
          deletedBy: undefined,
        } as any);
      }
    }
  }
}
