/**
 * Soft Delete Cleanup
 *
 * Automatically permanently deletes soft-deleted records after 30 days
 * Runs daily via cron job
 */

import { internalMutation } from "./_generated/server";
import { cascadeDelete } from "./lib/relationships";
import { isEligibleForPermanentDeletion } from "./lib/softDeleteHelpers";

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
        isEligibleForPermanentDeletion(record, THIRTY_DAYS_MS)
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
