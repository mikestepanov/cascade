import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Add current user as a watcher to an issue
 */
export const watch = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if already watching
    const existing = await ctx.db
      .query("issueWatchers")
      .withIndex("by_issue_user", (q) => q.eq("issueId", args.issueId).eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Add watcher
    const watcherId = await ctx.db.insert("issueWatchers", {
      issueId: args.issueId,
      userId,
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId,
      action: "started_watching",
      createdAt: Date.now(),
    });

    return watcherId;
  },
});

/**
 * Remove current user as a watcher from an issue
 */
export const unwatch = mutation({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find watcher record
    const watcher = await ctx.db
      .query("issueWatchers")
      .withIndex("by_issue_user", (q) => q.eq("issueId", args.issueId).eq("userId", userId))
      .first();

    if (!watcher) {
      return;
    }

    // Remove watcher
    await ctx.db.delete(watcher._id);

    // Log activity
    await ctx.db.insert("issueActivity", {
      issueId: args.issueId,
      userId,
      action: "stopped_watching",
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all watchers for an issue with user details
 */
export const getWatchers = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const watchers = await ctx.db
      .query("issueWatchers")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();

    // Get user details for each watcher
    const watchersWithUsers = await Promise.all(
      watchers.map(async (watcher) => {
        const user = await ctx.db.get(watcher.userId);
        return {
          _id: watcher._id,
          userId: watcher.userId,
          userName: user?.name || "Unknown User",
          userEmail: user?.email,
          createdAt: watcher.createdAt,
        };
      }),
    );

    return watchersWithUsers;
  },
});

/**
 * Check if current user is watching an issue
 */
export const isWatching = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const watcher = await ctx.db
      .query("issueWatchers")
      .withIndex("by_issue_user", (q) => q.eq("issueId", args.issueId).eq("userId", userId))
      .first();

    return !!watcher;
  },
});

/**
 * Get all issues the current user is watching
 */
export const getWatchedIssues = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const watchers = await ctx.db
      .query("issueWatchers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get issue details for each watched issue
    const issues = await Promise.all(
      watchers.map(async (watcher) => {
        const issue = await ctx.db.get(watcher.issueId);
        if (!issue) return null;

        const project = await ctx.db.get(issue.workspaceId);
        const assignee = issue.assigneeId ? await ctx.db.get(issue.assigneeId) : null;

        return {
          _id: issue._id,
          key: issue.key,
          title: issue.title,
          type: issue.type,
          status: issue.status,
          priority: issue.priority,
          projectName: project?.name || "Unknown Project",
          assignee: assignee ? { name: assignee.name } : null,
          watchedAt: watcher.createdAt,
        };
      }),
    );

    return issues.filter((issue) => issue !== null);
  },
});
