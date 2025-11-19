import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all versions for a document
export const listVersions = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user can access this document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (!document.isPublic && document.createdBy !== userId) {
      throw new Error("Not authorized to access this document");
    }

    // Get all versions for this document
    const versions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document_created", (q) => q.eq("documentId", args.documentId))
      .order("desc")
      .collect();

    // Enrich with user information
    return await Promise.all(
      versions.map(async (version) => {
        const user = await ctx.db.get(version.createdBy);
        return {
          ...version,
          createdByName: user?.name || user?.email || "Unknown",
        };
      }),
    );
  },
});

// Get a specific version
export const getVersion = query({
  args: {
    documentId: v.id("documents"),
    versionId: v.id("documentVersions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user can access this document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    if (!document.isPublic && document.createdBy !== userId) {
      throw new Error("Not authorized to access this document");
    }

    // Get the version
    const version = await ctx.db.get(args.versionId);
    if (!version || version.documentId !== args.documentId) {
      throw new Error("Version not found");
    }

    const user = await ctx.db.get(version.createdBy);
    return {
      ...version,
      createdByName: user?.name || user?.email || "Unknown",
    };
  },
});

// Restore a previous version
export const restoreVersion = mutation({
  args: {
    documentId: v.id("documents"),
    versionId: v.id("documentVersions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user can edit this document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Only owner can restore versions
    if (document.createdBy !== userId) {
      throw new Error("Only the document owner can restore versions");
    }

    // Get the version to restore
    const version = await ctx.db.get(args.versionId);
    if (!version || version.documentId !== args.documentId) {
      throw new Error("Version not found");
    }

    // Return the version snapshot and version number
    // The UI will handle submitting this snapshot to ProseMirror
    return {
      snapshot: version.snapshot,
      version: version.version,
      title: version.title,
    };
  },
});

// Delete a specific version (optional cleanup feature)
export const deleteVersion = mutation({
  args: { versionId: v.id("documentVersions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    // Check if user owns the document
    const document = await ctx.db.get(version.documentId);
    if (!document || document.createdBy !== userId) {
      throw new Error("Not authorized to delete this version");
    }

    await ctx.db.delete(args.versionId);
  },
});

// Get version count for a document
export const getVersionCount = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return 0;
    }

    if (!document.isPublic && document.createdBy !== userId) {
      return 0;
    }

    const versions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    return versions.length;
  },
});
