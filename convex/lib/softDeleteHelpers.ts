/**
 * Soft Delete Helper Utilities
 * 
 * Provides reusable filter functions for querying soft-deleted records.
 * Use these helpers to ensure consistent soft delete behavior across all queries.
 * 
 * Usage:
 *   .filter(notDeleted)           // Exclude deleted items (most common)
 *   .filter(onlyDeleted)          // Only show deleted items (trash view)
 *   .filter(includeDeleted)       // Show all items regardless of delete status
 */

import type { ExpressionOrValue, FilterBuilder, QueryInitializer } from "convex/server";
import type { GenericQueryCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";

/**
 * Filter to exclude soft-deleted items
 * Use this in all normal queries to hide deleted records
 * 
 * @example
 * const issues = await ctx.db
 *   .query("issues")
 *   .withIndex("by_project", (q) => q.eq("projectId", projectId))
 *   .filter(notDeleted)
 *   .collect();
 */
export function notDeleted(q: FilterBuilder<any>): ExpressionOrValue<boolean> {
  return q.neq(q.field("isDeleted"), true);
}

/**
 * Filter to show ONLY soft-deleted items
 * Use this for "trash" views where users can restore deleted items
 * 
 * @example
 * const deletedIssues = await ctx.db
 *   .query("issues")
 *   .withIndex("by_deleted", (q) => q.eq("isDeleted", true))
 *   .collect();
 * 
 * // Or with additional filters
 * const projectTrash = await ctx.db
 *   .query("issues")
 *   .filter((q) => q.and(
 *     q.eq(q.field("projectId"), projectId),
 *     onlyDeleted(q)
 *   ))
 *   .collect();
 */
export function onlyDeleted(q: FilterBuilder<any>): ExpressionOrValue<boolean> {
  return q.eq(q.field("isDeleted"), true);
}

/**
 * No filter - shows all items regardless of delete status
 * Useful for admin views or analytics that need complete data
 * 
 * Note: This is the default behavior without any filter.
 * This function exists for explicit documentation in code.
 * 
 * @example
 * const allIssues = await ctx.db
 *   .query("issues")
 *   .collect(); // Already includes deleted - no filter needed
 */
export function includeDeleted(): boolean {
  return true; // No filter applied
}

/**
 * WRAPPER: Query with automatic soft delete filtering
 * 
 * Use this instead of ctx.db.query() to automatically exclude deleted items.
 * This is the recommended approach - avoids manually adding .filter(notDeleted) everywhere.
 * 
 * @param ctx - Query context
 * @param tableName - Name of the table to query
 * @returns Query initializer with automatic soft delete filtering
 * 
 * @example
 * // Old way (manual filter)
 * const issues = await ctx.db
 *   .query("issues")
 *   .filter(notDeleted)
 *   .collect();
 * 
 * // New way (automatic filter)
 * const issues = await queryActive(ctx, "issues").collect();
 * 
 * // Works with indexes
 * const issues = await queryActive(ctx, "issues")
 *   .withIndex("by_project", (q) => q.eq("projectId", projectId))
 *   .collect();
 * 
 * // Works with pagination
 * const result = await queryActive(ctx, "issues")
 *   .withIndex("by_project", (q) => q.eq("projectId", projectId))
 *   .paginate(paginationOpts);
 */
export function queryActive<TableName extends keyof DataModel>(
  ctx: GenericQueryCtx<DataModel>,
  tableName: TableName
): QueryInitializer<any> {
  return ctx.db.query(tableName).filter(notDeleted);
}

/**
 * WRAPPER: Query only soft-deleted items
 * 
 * Use this for "trash" views where users can see and restore deleted items.
 * 
 * @param ctx - Query context
 * @param tableName - Name of the table to query
 * @returns Query initializer filtered to only deleted items
 * 
 * @example
 * const deletedIssues = await queryDeleted(ctx, "issues")
 *   .withIndex("by_project", (q) => q.eq("projectId", projectId))
 *   .collect();
 */
export function queryDeleted<TableName extends keyof DataModel>(
  ctx: GenericQueryCtx<DataModel>,
  tableName: TableName
): QueryInitializer<any> {
  return ctx.db.query(tableName).filter(onlyDeleted);
}

/**
 * Mark a record as soft deleted
 * Sets isDeleted, deletedAt, and deletedBy fields
 * 
 * @param userId - User ID who is performing the deletion
 * @returns Object with soft delete fields to patch
 * 
 * @example
 * await ctx.db.patch(issueId, softDeleteFields(userId));
 */
export function softDeleteFields(userId: any) {
  return {
    isDeleted: true,
    deletedAt: Date.now(),
    deletedBy: userId,
  };
}

/**
 * Restore a soft deleted record
 * Removes isDeleted, deletedAt, and deletedBy fields
 * 
 * @returns Object with fields to clear for restoration
 * 
 * @example
 * await ctx.db.patch(issueId, restoreFields());
 */
export function restoreFields() {
  return {
    isDeleted: undefined,
    deletedAt: undefined,
    deletedBy: undefined,
  };
}

/**
 * Check if a record is soft deleted
 * 
 * @param record - Any database record
 * @returns true if the record is soft deleted
 * 
 * @example
 * const issue = await ctx.db.get(issueId);
 * if (issue && isSoftDeleted(issue)) {
 *   throw new Error("Cannot modify deleted issue");
 * }
 */
export function isSoftDeleted(record: any): boolean {
  return record.isDeleted === true;
}

/**
 * Get time since deletion in milliseconds
 * Returns null if not deleted
 * 
 * @param record - Any database record with deletedAt field
 * @returns Milliseconds since deletion, or null if not deleted
 * 
 * @example
 * const timeSinceDeletion = getTimeSinceDeletion(issue);
 * if (timeSinceDeletion && timeSinceDeletion > THIRTY_DAYS) {
 *   // Eligible for permanent deletion
 * }
 */
export function getTimeSinceDeletion(record: any): number | null {
  if (!record.isDeleted || !record.deletedAt) {
    return null;
  }
  return Date.now() - record.deletedAt;
}

/**
 * Check if a soft deleted record is eligible for permanent deletion
 * Default threshold is 30 days
 * 
 * @param record - Any database record
 * @param thresholdMs - Milliseconds threshold (default: 30 days)
 * @returns true if record should be permanently deleted
 * 
 * @example
 * const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
 * if (isEligibleForPermanentDeletion(issue, THIRTY_DAYS)) {
 *   await hardDelete(issue._id);
 * }
 */
export function isEligibleForPermanentDeletion(
  record: any,
  thresholdMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days default
): boolean {
  const timeSince = getTimeSinceDeletion(record);
  return timeSince !== null && timeSince > thresholdMs;
}
