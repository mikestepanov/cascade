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

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId,
      action: "attached",
      field: "attachment",
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
    if (!(issue && issue.attachments)) {
      return [];
    }

    // Get metadata for each attachment from activity log
    const attachmentDetails = await Promise.all(
      issue.attachments.map(async (storageId) => {
        const url = await ctx.storage.getUrl(storageId);

        // Find the activity log entry where this was attached
        const activity = await ctx.db
          .query("issueActivity")
          .filter((q) =>
            q.and(q.eq(q.field("issueId"), args.issueId), q.eq(q.field("action"), "attached")),
          )
          .collect();

        const attachActivity = activity.find((a) => a.newValue);

        return {
          storageId,
          url,
          filename: attachActivity?.newValue || "Unknown",
          uploadedAt: attachActivity?.createdAt || Date.now(),
          uploadedBy: attachActivity?.userId,
        };
      }),
    );

    return attachmentDetails;
  },
});
