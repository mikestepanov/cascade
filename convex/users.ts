import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getCurrent = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.avatar !== undefined) updates.image = args.avatar;
    // Note: bio, timezone, emailNotifications, desktopNotifications would need to be added to user schema

    await ctx.db.patch(userId, updates);
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get issues created
    const issuesCreated = await ctx.db
      .query("issues")
      .withIndex("by_reporter", (q) => q.eq("reporterId", args.userId))
      .collect();

    // Get issues assigned
    const issuesAssigned = await ctx.db
      .query("issues")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .collect();

    // Get comments
    const comments = await ctx.db
      .query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();

    // Get projects (as member)
    const projectMemberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      issuesCreated: issuesCreated.length,
      issuesAssigned: issuesAssigned.length,
      issuesCompleted: issuesAssigned.filter((i) => {
        // Check if issue is in a "done" state - you'd need to check workflow states
        return i.status === "done";
      }).length,
      comments: comments.length,
      projects: projectMemberships.length,
    };
  },
});
