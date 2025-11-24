import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertCanEditProject } from "./projectAccess";

// Generate upload URL for file attachment
export const generateUploadUrl = mutation(async (ctx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  return await ctx.storage.generateUploadUrl();
});

// Attach uploaded file to an issue
export const attachToIssue = mutation({
  args: {
    issueId: v.id("issues"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue not found");

    // Check if user has access to the project
    await assertCanEditProject(ctx, issue.projectId, userId);

    // Add attachment to issue
    await ctx.db.patch(args.issueId, {
      attachments: [...issue.attachments, args.storageId],
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId,
      action: "attached",
      field: "attachment",
      newValue: args.filename,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Remove attachment from issue
export const removeAttachment = mutation({
  args: {
    issueId: v.id("issues"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue not found");

    // Check if user has access to the project
    await assertCanEditProject(ctx, issue.projectId, userId);

    // Remove attachment from issue
    await ctx.db.patch(args.issueId, {
      attachments: issue.attachments.filter((id) => id !== args.storageId),
      updatedAt: Date.now(),
    });

    // Delete the file from storage
    await ctx.storage.delete(args.storageId);

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId,
      action: "removed",
      field: "attachment",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get attachment metadata
export const getAttachment = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});
