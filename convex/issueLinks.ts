import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { batchFetchIssues } from "./lib/batchHelpers";
import { assertCanEditProject } from "./workspaceAccess";

export const create = mutation({
  args: {
    fromIssueId: v.id("issues"),
    toIssueId: v.id("issues"),
    linkType: v.union(v.literal("blocks"), v.literal("relates"), v.literal("duplicates")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const fromIssue = await ctx.db.get(args.fromIssueId);
    if (!fromIssue) {
      throw new Error("Issue not found");
    }

    await assertCanEditProject(ctx, fromIssue.workspaceId, userId);

    // Check if link already exists
    const existing = await ctx.db
      .query("issueLinks")
      .withIndex("by_from_issue", (q) => q.eq("fromIssueId", args.fromIssueId))
      .filter((q) =>
        q.and(q.eq(q.field("toIssueId"), args.toIssueId), q.eq(q.field("linkType"), args.linkType)),
      )
      .first();

    if (existing) {
      throw new Error("Link already exists");
    }

    const now = Date.now();
    const linkId = await ctx.db.insert("issueLinks", {
      fromIssueId: args.fromIssueId,
      toIssueId: args.toIssueId,
      linkType: args.linkType,
      createdBy: userId,
      createdAt: now,
    });

    // Log activity
    const toIssue = await ctx.db.get(args.toIssueId);
    await ctx.db.insert("issueActivity", {
      issueId: args.fromIssueId,
      userId,
      action: "linked",
      field: args.linkType,
      newValue: toIssue?.key || args.toIssueId,
      createdAt: now,
    });

    return linkId;
  },
});

export const remove = mutation({
  args: {
    linkId: v.id("issueLinks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("Link not found");
    }

    const issue = await ctx.db.get(link.fromIssueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    await assertCanEditProject(ctx, issue.workspaceId, userId);

    await ctx.db.delete(args.linkId);

    // Log activity
    const toIssue = await ctx.db.get(link.toIssueId);
    await ctx.db.insert("issueActivity", {
      issueId: link.fromIssueId,
      userId,
      action: "unlinked",
      field: link.linkType,
      oldValue: toIssue?.key || link.toIssueId,
      createdAt: Date.now(),
    });
  },
});

export const getForIssue = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { outgoing: [], incoming: [] };
    }

    // Get outgoing links (this issue links to others)
    const outgoingLinks = await ctx.db
      .query("issueLinks")
      .withIndex("by_from_issue", (q) => q.eq("fromIssueId", args.issueId))
      .collect();

    // Get incoming links (other issues link to this)
    const incomingLinks = await ctx.db
      .query("issueLinks")
      .withIndex("by_to_issue", (q) => q.eq("toIssueId", args.issueId))
      .collect();

    // Batch fetch all linked issues to avoid N+1 queries
    const allIssueIds = [
      ...outgoingLinks.map((l) => l.toIssueId),
      ...incomingLinks.map((l) => l.fromIssueId),
    ];
    const issueMap = await batchFetchIssues(ctx, allIssueIds);

    // Helper to format issue
    const formatIssue = (issue: NonNullable<ReturnType<typeof issueMap.get>>) => ({
      _id: issue._id,
      key: issue.key,
      title: issue.title,
      status: issue.status,
      type: issue.type,
      priority: issue.priority,
    });

    // Enrich with pre-fetched data (no N+1)
    const outgoing = outgoingLinks.map((link) => {
      const issue = issueMap.get(link.toIssueId);
      return {
        _id: link._id,
        linkType: link.linkType,
        issue: issue ? formatIssue(issue) : null,
      };
    });

    const incoming = incomingLinks.map((link) => {
      const issue = issueMap.get(link.fromIssueId);
      return {
        _id: link._id,
        linkType: link.linkType,
        issue: issue ? formatIssue(issue) : null,
      };
    });

    return { outgoing, incoming };
  },
});
