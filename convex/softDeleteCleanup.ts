/**
 * Soft Delete Cleanup
 *
 * Automatically permanently deletes soft-deleted records after 30 days
 * Runs daily via cron job
 */

import type { GenericDatabaseReader, GenericId } from "convex/server";
import { v } from "convex/values";
import type { DataModel, TableNames } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import { authenticatedQuery } from "./customFunctions";
import { logger } from "./lib/logger";
import { cascadeDelete } from "./lib/relationships";
import {
  isEligibleForPermanentDeletion,
  onlyDeleted,
  type SoftDeletable,
} from "./lib/softDeleteHelpers";

interface SoftDeletableRecord extends SoftDeletable {
  _id: GenericId<TableNames>;
}

const TABLES_WITH_SOFT_DELETE = [
  "projects",
  "documents",
  "issues",
  "sprints",
  "projectMembers",
] as const;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function querySoftDeletedRecords(
  db: GenericDatabaseReader<DataModel>,
  table: (typeof TABLES_WITH_SOFT_DELETE)[number],
): Promise<SoftDeletableRecord[]> {
  // All tables in TABLES_WITH_SOFT_DELETE have by_deleted index
  // Using type assertion because Convex's generic query builder doesn't track index availability
  type QueryBuilder = {
    withIndex: (
      name: string,
      predicate: (q: { eq: (field: string, value: boolean) => unknown }) => unknown,
    ) => { take: (n: number) => Promise<SoftDeletableRecord[]> };
  };
  const query = db.query(table) as unknown as QueryBuilder;
  return query.withIndex("by_deleted", (q) => q.eq("isDeleted", true)).take(1000);
}

async function deleteFromTable(
  ctx: MutationCtx,
  table: (typeof TABLES_WITH_SOFT_DELETE)[number],
  ageLimitMs: number,
): Promise<{ deleted: number; errors: string[] }> {
  let deleted = 0;
  const errors: string[] = [];

  try {
    const records = await querySoftDeletedRecords(ctx.db, table);
    const eligibleRecords = records.filter((r) => isEligibleForPermanentDeletion(r, ageLimitMs));

    for (const record of eligibleRecords) {
      try {
        await cascadeDelete(ctx, table, record._id);
        await ctx.db.delete(record._id);
        deleted++;
      } catch (e) {
        errors.push(`${table}/${record._id}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }
  } catch (error) {
    errors.push(`${table}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { deleted, errors };
}

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
      const stats = await deleteFromTable(ctx, table, THIRTY_DAYS_MS);
      totalDeleted += stats.deleted;
      deletedByTable[table] = stats.deleted;
      errors.push(...stats.errors);
    }

    const durationMs = Date.now() - startTime;

    // Log summary for monitoring
    logger.info("Soft delete cleanup completed", {
      durationMs,
      totalDeleted,
      deletedByTable,
      errorCount: errors.length,
    });

    if (errors.length > 0) {
      logger.warn("Soft delete cleanup errors", { errors: errors.slice(0, 10) });
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
