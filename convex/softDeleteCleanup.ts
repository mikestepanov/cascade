/**
 * Soft Delete Cleanup
 *
 * Automatically permanently deletes soft-deleted records after 30 days
 * Runs daily via cron job
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
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
 */
export const permanentlyDeleteOld = internalMutation({
  args: {},
  handler: async (ctx) => {
    let totalDeleted = 0;

    for (const table of TABLES_WITH_SOFT_DELETE) {
      // Query all soft-deleted records
      const deleted = await ctx.db
        .query(table)
        .withIndex("by_deleted", (q) => q.eq("isDeleted", true))
        .collect();

      // Filter to only those older than 30 days
      const toDelete = deleted.filter((record) =>
        isEligibleForPermanentDeletion(record, THIRTY_DAYS_MS),
      );

      // Permanently delete each one with cascading
      for (const record of toDelete) {
        await cascadeDelete(ctx, table, record._id);
        totalDeleted++;
      }

      console.log(`Cleaned up ${toDelete.length} old ${table} records`);
    }

    console.log(`Total records permanently deleted: ${totalDeleted}`);
    return { deleted: totalDeleted };
  },
});

/**
 * List deleted projects (trash view)
 * Shows projects deleted by current user
 */
export const listDeletedProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const deleted = await ctx.db.query("projects").filter(onlyDeleted).collect();

    // Filter to projects user has access to
    return deleted.filter((p) => p.createdBy === userId || p.ownerId === userId || p.isPublic);
  },
});

/**
 * List deleted documents (trash view)
 * Shows documents deleted by current user
 */
export const listDeletedDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("documents")
      .filter(onlyDeleted)
      .filter((q) => q.eq(q.field("createdBy"), userId))
      .collect();
  },
});

/**
 * List deleted issues for a project (trash view)
 * Shows all deleted issues in a project
 */
export const listDeletedIssues = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("issues")
      .withIndex("by_workspace", (q) => q.eq("projectId", args.projectId))
      .filter(onlyDeleted)
      .collect();
  },
});
