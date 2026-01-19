import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { authenticatedMutation, issueMutation } from "./customFunctions";

/**
 * Generate upload URL for file attachment
 * Requires authentication
 */
export const generateUploadUrl = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Attach uploaded file to an issue
 * Requires editor role on issue's project
 */
export const attachToIssue = issueMutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    // Add attachment to issue
    await ctx.db.patch(ctx.issue._id, {
      attachments: [...ctx.issue.attachments, args.storageId],
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: ctx.issue._id,
      userId: ctx.userId,
      action: "attached",
      field: "attachment",
      newValue: args.filename,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove attachment from issue
 * Requires editor role on issue's project
 */
export const removeAttachment = issueMutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Remove attachment from issue
    await ctx.db.patch(ctx.issue._id, {
      attachments: ctx.issue.attachments.filter((id) => id !== args.storageId),
      updatedAt: Date.now(),
    });

    // Delete the file from storage
    await ctx.storage.delete(args.storageId);

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: ctx.issue._id,
      userId: ctx.userId,
      action: "removed",
      field: "attachment",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get attachment URL
 * Returns null for unauthenticated users (soft fail)
 */
export const getAttachment = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});
