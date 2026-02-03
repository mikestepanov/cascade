/**
 * Document Migration Functions
 *
 * Migrates documents from BlockNote/ProseMirror format to Plate/Slate format.
 * Run these mutations to convert existing documents to the new editor format.
 *
 * Migration process:
 * 1. Fetch document versions with old format
 * 2. Convert content using blockNoteToPlate converter
 * 3. Store new format in Y.js documents table
 * 4. Mark document as migrated
 *
 * Usage:
 * - Run `migrateBatch` with a batch size to migrate documents incrementally
 * - Run `getMigrationStatus` to check progress
 * - Run `migrateDocument` to migrate a single document
 */

import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalMutation, mutation, query } from "../_generated/server";
import { convertToSlate } from "./blockNoteToPlate";

/**
 * Get migration status
 * Returns counts of migrated and pending documents
 */
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    // Count documents with Y.js state (migrated)
    const migratedDocs = await ctx.db.query("yjsDocuments").collect();
    const migratedDocIds = new Set(migratedDocs.map((d) => d.documentId));

    // Count all documents
    const allDocs = await ctx.db
      .query("documents")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const totalDocs = allDocs.length;
    const migratedCount = allDocs.filter((d) => migratedDocIds.has(d._id)).length;

    return {
      total: totalDocs,
      migrated: migratedCount,
      pending: totalDocs - migratedCount,
      percentComplete: totalDocs > 0 ? Math.round((migratedCount / totalDocs) * 100) : 100,
    };
  },
});

/**
 * Migrate a single document
 * Converts document content and creates Y.js state
 */
export const migrateDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Check if already migrated
    const existingYjs = await ctx.db
      .query("yjsDocuments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .first();

    if (existingYjs) {
      return { success: true, skipped: true, message: "Already migrated" };
    }

    // Get the latest document version
    const latestVersion = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .first();

    // Convert content to Slate format
    const slateContent = latestVersion?.snapshot
      ? convertToSlate(latestVersion.snapshot)
      : [{ type: "p", children: [{ text: "" }] }];

    // Store as Y.js document state
    // The actual Y.js encoding would happen on the client side
    // For now, we store the Slate JSON as a placeholder
    const now = Date.now();
    await ctx.db.insert("yjsDocuments", {
      documentId: args.documentId,
      stateVector: "",
      updates: [JSON.stringify(slateContent)],
      version: 1,
      lastModifiedBy: document.createdBy,
      updatedAt: now,
    });

    return {
      success: true,
      skipped: false,
      documentId: args.documentId,
      title: document.title,
    };
  },
});

/**
 * Migrate a batch of documents
 * Call this repeatedly until all documents are migrated
 */
export const migrateBatch = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 10;

    // Get documents that haven't been migrated yet
    const migratedDocs = await ctx.db.query("yjsDocuments").collect();
    const migratedDocIds = new Set(migratedDocs.map((d) => d.documentId));

    const allDocs = await ctx.db
      .query("documents")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const pendingDocs = allDocs.filter((d) => !migratedDocIds.has(d._id));
    const batch = pendingDocs.slice(0, batchSize);

    const results: Array<{
      documentId: Id<"documents">;
      title: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const doc of batch) {
      try {
        // Get the latest document version
        const latestVersion = await ctx.db
          .query("documentVersions")
          .withIndex("by_document", (q) => q.eq("documentId", doc._id))
          .order("desc")
          .first();

        // Convert content
        const slateContent = latestVersion?.snapshot
          ? convertToSlate(latestVersion.snapshot)
          : [{ type: "p", children: [{ text: "" }] }];

        // Store Y.js state
        const now = Date.now();
        await ctx.db.insert("yjsDocuments", {
          documentId: doc._id,
          stateVector: "",
          updates: [JSON.stringify(slateContent)],
          version: 1,
          lastModifiedBy: doc.createdBy,
          updatedAt: now,
        });

        results.push({
          documentId: doc._id,
          title: doc.title,
          success: true,
        });
      } catch (error) {
        results.push({
          documentId: doc._id,
          title: doc.title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      processed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      remaining: pendingDocs.length - batch.length,
      results,
    };
  },
});

/**
 * Internal mutation for scheduled migration
 * Can be triggered by a cron job for automatic migration
 */
export const scheduledMigrate = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 50;

    // Get documents that haven't been migrated yet
    const migratedDocs = await ctx.db.query("yjsDocuments").collect();
    const migratedDocIds = new Set(migratedDocs.map((d) => d.documentId));

    const allDocs = await ctx.db
      .query("documents")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const pendingDocs = allDocs.filter((d) => !migratedDocIds.has(d._id));
    const batch = pendingDocs.slice(0, batchSize);

    let successCount = 0;
    let failCount = 0;

    for (const doc of batch) {
      try {
        const latestVersion = await ctx.db
          .query("documentVersions")
          .withIndex("by_document", (q) => q.eq("documentId", doc._id))
          .order("desc")
          .first();

        const slateContent = latestVersion?.snapshot
          ? convertToSlate(latestVersion.snapshot)
          : [{ type: "p", children: [{ text: "" }] }];

        const now = Date.now();
        await ctx.db.insert("yjsDocuments", {
          documentId: doc._id,
          stateVector: "",
          updates: [JSON.stringify(slateContent)],
          version: 1,
          lastModifiedBy: doc.createdBy,
          updatedAt: now,
        });

        successCount++;
      } catch (_error) {
        failCount++;
      }
    }

    return {
      processed: batch.length,
      successful: successCount,
      failed: failCount,
      remaining: pendingDocs.length - batch.length,
    };
  },
});

/**
 * Rollback migration for a document
 * Removes the Y.js state, allowing re-migration
 */
export const rollbackDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const yjsDoc = await ctx.db
      .query("yjsDocuments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .first();

    if (!yjsDoc) {
      return { success: false, error: "No Y.js state found for this document" };
    }

    // Remove awareness records for this document
    const awarenessRecords = await ctx.db
      .query("yjsAwareness")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const record of awarenessRecords) {
      await ctx.db.delete(record._id);
    }

    // Remove Y.js document state
    await ctx.db.delete(yjsDoc._id);

    return { success: true };
  },
});
