/**
 * Migration script: Project → Project
 * 
 * CRITICAL: This migration handles the fact that:
 * 1. Old data has projectId fields pointing to "projects" table
 * 2. The "projects" table was renamed to "projects" in schema
 * 3. But Convex database still has IDs from the old table name
 * 
 * Solution: Just remove projectId fields - don't try to copy them to projectId
 * since the table name mismatch will cause errors.
 * 
 * Run with: pnpm convex run migrations/migrateProjectToWorkspace:migrate
 */

import { internalMutation, query } from "../_generated/server";

// Check migration status
export const checkStatus = query({
  args: {},
  handler: async (ctx) => {
    const tables = ["issues", "documents", "labels", "issueTemplates", "webhooks", 
                    "savedFilters", "automationRules", "customFields", "sprints", "timeEntries"];
    
    const results: Record<string, number> = {};
    let totalNeedsMigration = 0;
    
    for (const table of tables) {
      const items = await ctx.db
        .query(table as any)
        .filter((q: any) => q.neq(q.field("projectId"), undefined))
        .collect();
      
      results[table] = items.length;
      totalNeedsMigration += items.length;
    }

    return {
      ...results,
      totalNeedsMigration,
      needsMigration: totalNeedsMigration > 0,
      message: totalNeedsMigration > 0 
        ? "Migration needed: Remove legacy projectId fields"
        : "All clean! No migration needed",
    };
  },
});

// Migrate all tables - just remove projectId fields (don't copy to projectId)
export const migrate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["issues", "documents", "labels", "issueTemplates", "webhooks", 
                    "savedFilters", "automationRules", "customFields", "sprints", "timeEntries"];
    
    const migrationResults: Record<string, number> = {};
    let totalMigrated = 0;

    for (const tableName of tables) {
      const items = await ctx.db.query(tableName as any).collect();
      let migrated = 0;

      for (const item of items) {
        // Only remove projectId field if it exists
        if ((item as any).projectId !== undefined) {
          await ctx.db.patch(item._id, { projectId: undefined } as any);
          migrated++;
        }
      }

      migrationResults[tableName] = migrated;
      totalMigrated += migrated;
    }

    return {
      ...migrationResults,
      totalMigrated,
      message: `Migration complete: Removed projectId from ${totalMigrated} documents. Now update schema to make projectId required.`,
    };
  },
});
