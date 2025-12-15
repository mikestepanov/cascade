import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for files
export const generateUploadUrl = mutation(async (ctx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  return await ctx.storage.generateUploadUrl();
});

// Add attachment to an issue
export const addAttachment = mutation({
  args: {
    issueId: v.id("issues"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    // Add to issue attachments array
    const currentAttachments = issue.attachments || [];
    await ctx.db.patch(args.issueId, {
      attachments: [...currentAttachments, args.storageId],
    });

    // Log activity (store storageId in oldValue for reliable lookup)
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId,
      action: "attached",
      field: "attachment",
      oldValue: args.storageId, // Store storageId for direct lookup
      newValue: args.filename,
      createdAt: Date.now(),
    });

    return args.storageId;
  },
});

// Remove attachment from an issue
export const removeAttachment = mutation({
  args: {
    issueId: v.id("issues"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    // Remove from issue attachments array
    const updatedAttachments = (issue.attachments || []).filter((id) => id !== args.storageId);
    await ctx.db.patch(args.issueId, {
      attachments: updatedAttachments,
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

    return true;
  },
});

// Get attachment URL
export const getAttachmentUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.storage.getUrl(args.storageId);
  },
});

// Get all attachments for an issue with metadata
export const getIssueAttachments = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const issue = await ctx.db.get(args.issueId);
    if (!issue?.attachments) {
      return [];
    }

    // Query activity log ONCE to avoid N+1 queries
    const attachActivities = await ctx.db
      .query("issueActivity")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .filter((q) => q.eq(q.field("action"), "attached"))
      .collect();

    // Build lookup map by storageId (stored in oldValue)
    const activityByStorageId = new Map(
      attachActivities.filter((a) => a.oldValue).map((a) => [a.oldValue, a]),
    );

    // Get all attachment URLs in parallel
    const urls = await Promise.all(
      issue.attachments.map((storageId) => ctx.storage.getUrl(storageId)),
    );

    // Build attachment details with direct lookup by storageId
    const attachmentDetails = issue.attachments.map((storageId, index) => {
      const activity = activityByStorageId.get(storageId);

      return {
        storageId,
        url: urls[index],
        filename: activity?.newValue ?? "Unknown",
        uploadedAt: activity?.createdAt ?? issue._creationTime,
        uploadedBy: activity?.userId,
      };
    });

    return attachmentDetails;
  },
});
