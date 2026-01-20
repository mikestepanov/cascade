/**
 * Soft Delete Cleanup
 *
 * Automatically permanently deletes soft-deleted records after 30 days
 * Runs daily via cron job
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authenticatedQuery } from "./customFunctions";
import { cascadeDelete } from "./lib/relationships";
import { isEligibleForPermanentDeletion, onlyDeleted } from "./lib/softDeleteHelpers";

const TABLES_WITH_SOFT_DELETE = [
  "projects",
  "documents",
  "issues",
  "sprints",
  "projectMembers",
] as const;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Permanently delete soft-deleted records older than 30 days
 * Called by cron job daily at 2 AM UTC
 *
 * Returns detailed stats for monitoring
 */
export const permanentlyDeleteOld = internalMutation({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    let totalDeleted = 0;
    const deletedByTable: Record<string, number> = {};
    const errors: string[] = [];

    for (const table of TABLES_WITH_SOFT_DELETE) {
      deletedByTable[table] = 0;

      try {
        // Query all soft-deleted records (bounded to prevent OOM)
        const deleted = await ctx.db
          .query(table)
          .withIndex("by_deleted", (q) => q.eq("isDeleted", true))
          .take(1000); // Limit per run to prevent timeout

        // Filter to only those older than 30 days
        const toDelete = deleted.filter((record) =>
          isEligibleForPermanentDeletion(record, THIRTY_DAYS_MS),
        );

        // Permanently delete each one with cascading
        for (const record of toDelete) {
          try {
            await cascadeDelete(ctx, table, record._id);
            totalDeleted++;
            deletedByTable[table]++;
          } catch (error) {
            errors.push(`${table}/${record._id}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      } catch (error) {
        errors.push(`${table}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    const durationMs = Date.now() - startTime;

    // Log summary for monitoring
    console.log(`[softDeleteCleanup] Completed in ${durationMs}ms`, {
      totalDeleted,
      deletedByTable,
      errorCount: errors.length,
    });

    if (errors.length > 0) {
      console.warn(`[softDeleteCleanup] Errors:`, errors.slice(0, 10)); // Log first 10 errors
    }

    return {
      deleted: totalDeleted,
      deletedByTable,
      durationMs,
      errorCount: errors.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    };
  },
});

/**
 * List deleted projects (trash view)
 * Shows projects deleted by current user
 */
export const listDeletedProjects = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const deleted = await ctx.db.query("projects").filter(onlyDeleted).collect();

    // Filter to projects user has access to
    return deleted.filter(
      (p) => p.createdBy === ctx.userId || p.ownerId === ctx.userId || p.isPublic,
    );
  },
});

/**
 * List deleted documents (trash view)
 * Shows documents deleted by current user
 */
export const listDeletedDocuments = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("documents")
      .filter(onlyDeleted)
      .filter((q) => q.eq(q.field("createdBy"), ctx.userId))
      .collect();
  },
});

/**
 * List deleted issues for a project (trash view)
 * Shows all deleted issues in a project
 */
export const listDeletedIssues = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter(onlyDeleted)
      .collect();
  },
});
